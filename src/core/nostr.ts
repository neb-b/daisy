import {
  relayInit,
  getEventHash,
  signEvent,
  generatePrivateKey,
  getPublicKey,
  validateEvent,
  verifySignature,
  Relay,
} from "nostr-tools"
import type { Sub } from "nostr-tools"

export const nostrEventKinds = {
  profile: 0,
  note: 1,
  contactList: 3,
  repost: 6,
  reaction: 7,
}

export const defaultRelays = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://nostr-pub.wellorder.net",
  // "wss://brb.io",
  // "wss://nostr-relay.wlvs.space",
  "wss://nostr.oxtr.dev",
  // "wss://relay.nostr.bg",
  // "wss://nostr.fmt.wiz.biz",
]

const GET_EVENTS_LIMIT = 40
const TIMEOUT = 500

type ConnectionEventCbArg = {
  success: boolean
  relay?: Relay
}

export const connectToRelay = async (relayEndpoint, cb: (ConnectionEventCbArg) => void) => {
  let relay
  let handled = false

  try {
    relay = relayInit(relayEndpoint)
    await relay.connect()

    relay.on("connect", () => {
      console.log("connected to: ", relay.url)

      handled = true
      return cb({ relay, success: true })
    })

    relay.on("error", () => {
      relay.close()
      handled = true

      return cb({ relay, success: false })
    })
  } catch (e) {
    console.log("error with init relay", relayEndpoint, e)
    handled = true

    cb({ relay: { url: relayEndpoint, status: 0 }, success: false })
  }

  setTimeout(() => {
    if (handled) return

    if (relay) {
      relay.close()
    }

    cb({ relay, success: false })
  }, 1000)
}

export const getReplies = async (
  relays: Relay[],
  eventIds: string[]
): Promise<{
  notes: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  related: NostrEvent[]
  reactions: Record<string, NostrReactionEvent[]>
}> =>
  new Promise(async (resolve) => {
    const notes = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      "#e": eventIds,
    })

    const { related, profiles, reactions } = await getRelatedEvents(relays, notes)

    resolve({ notes, related, profiles, reactions })
  })

export const getEventsFromPubkeys = async (
  relays: Relay[],
  pubkeys: string[]
): Promise<{
  notes: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  related: NostrEvent[]
  reactions: Record<string, NostrReactionEvent[]>
}> =>
  new Promise(async (resolve) => {
    const notes = await getNostrEvents(relays, {
      authors: pubkeys,
      kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    })

    const { related, profiles, reactions } = await getRelatedEvents(relays, notes)

    resolve({ notes, related, profiles, reactions })
  })

const getRelatedEvents = async (
  relays: Relay[],
  notes: NostrEvent[]
): Promise<{
  related: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  reactions: Record<string, NostrReactionEvent[]>
}> =>
  new Promise(async (resolve) => {
    const alreadyFetchedReposts = []
    const repostsSet = new Set<string>()
    const repliesSet = new Set<string>()
    notes.forEach((event) => {
      if (event.kind === 6) {
        try {
          // If the repost is encoded in the event, no need to fetch
          const repostNote = JSON.parse(event.content)
          alreadyFetchedReposts.push(repostNote)
        } catch (e) {
          const repostId = event.tags.find((tag) => tag[0] === "e")?.[1]
          repostsSet.add(repostId)
        }
      } else {
        const replyToId = event.tags.find((tag) => tag[0] === "e")?.[1]
        if (replyToId) {
          repliesSet.add(replyToId)
        }
      }
    })

    const replyEventsPromise = getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      limit: repliesSet.size,
      ids: Array.from(repliesSet),
    })

    const repostEventsPromise = getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      limit: repostsSet.size,
      ids: Array.from(repostsSet),
    })

    const reactionEventsPromise = getNostrEvents(relays, {
      kinds: [nostrEventKinds.reaction],
      "#e": [...repliesSet, ...repostsSet, ...notes.map((note) => note.id)],
    })

    const [replyEvents, repostEvents, reactionEvents] = await Promise.all([
      replyEventsPromise,
      repostEventsPromise,
      reactionEventsPromise,
    ])

    const prunedReactionEvents = reactionEvents.filter(
      (note: NostrEvent) => note.content === "+" || note.content === "🤙" || note.content === "❤️"
    )

    // Get profiles from all the events
    const profilePubkeysSet = new Set<string>()
    notes.forEach((event) => {
      if (event.kind === 1) {
        profilePubkeysSet.add(event.pubkey)
      }
    })
    alreadyFetchedReposts.forEach((event) => {
      profilePubkeysSet.add(event.pubkey)
    })
    repostEvents.forEach((event) => {
      profilePubkeysSet.add(event.pubkey)
    })
    replyEvents.forEach((event) => {
      profilePubkeysSet.add(event.pubkey)
    })

    const profilesEvents = (await getNostrEvents(relays, {
      kinds: [nostrEventKinds.profile],
      authors: Array.from(profilePubkeysSet),
      limit: profilePubkeysSet.size,
    })) as NostrProfileEvent[]

    const userProfileInfos = {}
    profilesEvents.forEach((profileEvent) => {
      const { content, ...userMetadata } = profileEvent
      let user = userMetadata

      try {
        const userInfo = JSON.parse(content) as NostrProfileContent
        // @ts-expect-error
        user = { ...user, content: userInfo }
      } catch (e) {}

      userProfileInfos[profileEvent.pubkey] = user
    })

    const reactionsById = {}
    prunedReactionEvents.forEach((reaction) => {
      const eventId = reaction.tags[0][1]
      if (eventId) {
        if (!reactionsById[eventId]) {
          reactionsById[eventId] = [reaction]
        } else {
          reactionsById[eventId].push(reaction)
        }
      }
    })

    resolve({
      related: [...alreadyFetchedReposts, ...repostEvents, ...replyEvents],
      profiles: userProfileInfos,
      reactions: reactionsById,
    })
  })

const getNostrEvents = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent[]> =>
  new Promise((resolve) => {
    const limit = filter?.limit || GET_EVENTS_LIMIT
    const eventsById: Record<string, NostrEvent> = {}
    let fetchedCount = 0
    let returned = false

    relays.forEach((relay) => {
      const sub = relay.sub([
        {
          limit,
          ...filter,
        },
      ])

      sub.on("event", (event) => {
        const nostrEvent = <NostrEvent>event

        // ts-expect-error
        eventsById[nostrEvent.id] = nostrEvent

        fetchedCount++

        if (fetchedCount === limit) {
          resolve(Array.from(Object.values(eventsById)))
          sub.unsub()
          returned = true
        }
      })

      sub.on("eose", () => {
        sub.unsub()
      })

      setTimeout(() => {
        // If all data was already received do nothing
        if (returned) {
          return
        }

        // If a timeout happens, return what has been received so far
        sub.unsub()
        returned = true

        resolve(Array.from(Object.values(eventsById)))
      }, TIMEOUT)
    })
  })

export const subscribeToNostrEvents = (
  relays: Relay[],
  filter: NostrFilter,
  handleEvent: (NostrEvent, related: NostrEvent[], profiles: Record<string, NostrProfileEvent>) => void
): Sub[] => {
  const subscriptions = []
  relays.forEach((relay) => {
    const sub = relay.sub([{ ...filter }])
    subscriptions.push(sub)

    sub.on("event", async (event: NostrEvent) => {
      const { related, profiles } = await getRelatedEvents(relays, [event])

      handleEvent(event, related, profiles)
    })

    sub.on("eose", () => {
      sub.unsub()
    })
  })

  return subscriptions
}

const getNostrEvent = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent> =>
  new Promise((resolve) => {
    relays.forEach((relay) => {
      const sub = relay.sub([{ ...filter }])
      sub.on("event", (event) => {
        const nostrEvent = <NostrEvent>event
        const { content: stringifedContent, ...rest } = nostrEvent
        if (stringifedContent === "") {
          resolve(nostrEvent)
        } else {
          try {
            const content = JSON.parse(stringifedContent)
            resolve({ content, ...rest })
          } catch (e) {
            console.log("error parsing content", e)
            console.log("", nostrEvent)
          }
        }
        sub.unsub()
      })
      sub.on("eose", () => {
        sub.unsub()
      })
    })
  })

export const publishNote = async (
  relays: Relay[],
  user: { pubkey: string; privateKey: string },
  kind: number,
  content = "",
  tags = []
): Promise<NostrNoteEvent | undefined> => {
  const event = {
    kind,
    pubkey: user.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    content,
    tags,
  }

  // @ts-expect-error
  event.id = getEventHash(event)
  // @ts-expect-error
  event.sig = signEvent(event, user.privateKey)

  // console.log("event", event)
  // let ok = validateEvent(event)
  // let veryOk = verifySignature(event)
  // console.log("ok?", ok)
  // console.log("veryOk?", veryOk)
  // return

  let returned = false
  return new Promise((resolve) => {
    relays.forEach((relay) => {
      const pub = relay.publish(event)

      pub.on("ok", () => {
        if (!returned) {
          // @ts-expect-error
          resolve(event)
          returned = true
        }

        console.log(`${relay.url} has accepted our event`)
        relay.close()
      })
      pub.on("seen", () => {
        console.log(`we saw the event on ${relay.url}`)
        relay.close()
      })
      pub.on("failed", (reason) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`)
        relay.close()
      })
    })

    setTimeout(() => {
      if (!returned) {
        resolve(undefined)
        returned = true
      }
    }, 5000)
  })
}

export const getProfile = async (
  relays: Relay[],
  pubkey: string
): Promise<{ profile?: NostrProfile; contactList?: NostrContactListEvent }> => {
  const profilePromise = getNostrEvent(relays, {
    kinds: [nostrEventKinds.profile],
    authors: [pubkey],
  })

  const contactListPromise = getNostrEvent(relays, {
    kinds: [nostrEventKinds.contactList],
    authors: [pubkey],
  })

  const [profile, contactList] = await Promise.all([profilePromise, contactListPromise])

  const profileRes = profile as NostrProfileEvent
  const contactListRes = contactList as NostrContactListEvent

  return { profile: profileRes, contactList: contactListRes }
}

const note = {
  content: "#[49]",
  created_at: 1674068582,
  id: "254c68444436c4dfdd311e6c432fe1c3f680e8404c1f4176c09ac2850eeae9a8",
  kind: 1,
  pubkey: "b93049a6e2547a36a7692d90e4baa809012526175546a17337454def9ab69d30",
  sig: "cfbc0f30ec6ef7bb0021a7a9777939cee82900ef824d2cc40e4aefcaec132ae333d83ee63f8b27630e3f12d0ea70a287d7f15cd584d26bcb476e6c8aac60d7f3",
  tags: [
    ["e", "999102d285eebf787666bd84fc99a638d66b0deefefb0e872a915a0f404dfc55", ""],
    ["e", "5df888f7574911fbe68ec32bfb0aed959c0d3be966557b67487cf5f3f822741a"],
    ["p", "f1f9b0996d4ff1bf75e79e4cc8577c89eb633e68415c7faf74cf17a07bf80bd8"],
    ["p", "5fd693e61a7969ecf5c11dbf5ce20aedac1cea71721755b037955994bf6061bb"],
    ["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"],
    ["p", "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"],
    ["p", "884704bd421721e292edbff42eb77547fe115c6ff9825b08fc366be4cd69e9f6"],
    ["p", "971615b70ad9ec896f8d5ba0f2d01652f1dfe5f9ced81ac9469ca7facefad68b"],
    ["p", "aeb3a55306dbb058e0f20ba817c3f61cfb55be51fec5c2d50ff2ec31810f82fa"],
    ["p", "2779f3d9f42c7dee17f0e6bcdcf89a8f9d592d19e3b1bbd27ef1cffd1a7f98d1"],
    ["p", "7fb2a29bd1a41d9a8ca43a19a7dcf3a8522f1bc09b4086253539190e9c29c51a"],
    ["p", "2f4fa408d85b962d1fe717daae148a4c98424ab2e10c7dd11927e101ed3257b2"],
    ["p", "e0339348ca6cac9708cd98e631e2f4baad534dfce870881b65aa57d30ff7253e"],
    ["p", "00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700"],
    ["p", "4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0"],
    ["p", "b7c66ce6f7bbe034e96be54c2ffc0adf631a889abc0834ba1431171b67c489aa"],
    ["p", "8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168"],
    ["p", "de7ecd1e2976a6adb2ffa5f4db81a7d812c8bb6698aa00dcf1e76adb55efd645"],
    ["p", "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194"],
    ["p", "52b4a076bcbbbdc3a1aefa3735816cf74993b1b8db202b01c883c58be7fad8bd"],
    ["p", "460c25e682fda7832b52d1f22d3d22b3176d972f60dcdc3212ed8c92ef85065c"],
    ["p", "000000001c5c45196786e79f83d21fe801549fdc98e2c26f96dcef068a5dbcd7"],
    ["p", "cbf904c0702a361911c46d79379a6a502bc3bd0b4c56d25389e62d3ebf4a7db8"],
    ["p", "6f32dddf2d54f2c5e64e1570abcb9c7a05e8041bac0ee9f4235f694fccb68b5d"],
    ["p", "af314f3920509af44417a7c2cb0150632d2f9523e0886988a2b969962a5d0bbc"],
    ["p", "645681b9d067b1a362c4bee8ddff987d2466d49905c26cb8fec5e6fb73af5c84"],
    ["p", "3235036bd0957dfb27ccda02d452d7c763be40c91a1ac082ba6983b25238388c"],
    ["p", "ac9ec020170155f0feb347f0d777ee5fc38dd1f36353093046323646cff5169f"],
    ["p", "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322"],
    ["p", "17e2889fba01021d048a13fd0ba108ad31c38326295460c21e69c43fa8fbe515"],
    ["p", "46fcbe3065eaf1ae7811465924e48923363ff3f526bd6f73d7c184b16bd8ce4d"],
    ["p", "e998cd0639d0167fb71d3fcc1c140dc6241f372884d5fd300bbec95e206163b5"],
    ["p", "ee11a5dff40c19a555f41fe42b48f00e618c91225622ae37b6c2bb67b76c4e49"],
    ["p", "3335d373e6c1b5bc669b4b1220c08728ea8ce622e5a7cfeeb4c0001d91ded1de"],
    ["p", "6681268ace4748d41a4cfcc1e64006fb935bbc359782b3d9611f64d51c6752d9"],
    ["p", "9ec7a778167afb1d30c4833de9322da0c08ba71a69e1911d5578d3144bb56437"],
    ["p", "0000002855ad7906a7568bf4d971d82056994aa67af3cf0048a825415ac90672"],
    ["p", "efc83f01c8fb309df2c8866b8c7924cc8b6f0580afdde1d6e16e2b6107c2862c"],
    ["p", "35d26e4690cbe1a898af61cc3515661eb5fa763b57bd0b42e45099c8b32fd50f"],
    ["p", "68d81165918100b7da43fc28f7d1fc12554466e1115886b9e7bb326f65ec4272"],
    ["p", "7bdef7be22dd8e59f4600e044aa53a1cf975a9dc7d27df5833bc77db784a5805"],
    ["p", "5f498ff809e02c5685e3bda193fcd7147a22e7b3971079549b0bb37643f3cacc"],
    ["p", "3356de61b39647931ce8b2140b2bab837e0810c0ef515bbe92de0248040b8bdd"],
    ["p", "dd81a8bacbab0b5c3007d1672fb8301383b4e9583d431835985057223eb298a5"],
    ["p", "35f25abceda5f71685dd378f02167cc51dd19313660951c40266a5dc3b8ad0f5"],
    ["p", "d4843f4c280abba3d43d84ed7924b2567d7c166f5e72985b9f06d355601b5d78"],
    ["p", "9989500413fb756d8437912cc32be0730dbe1bfc6b5d2eef759e1456c239f905"],
    ["p", "3f770d65d3a764a9c5cb503ae123e62ec7598ad035d836e2a810f3877a745b24"],
    ["p", "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed"],
    ["e", "c9f6d1bda38bb86ea9ce345238a30abf503bfa67ea87ab69893a501d9395156e"],
  ],
}
