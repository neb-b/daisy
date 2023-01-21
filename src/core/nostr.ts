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
  "wss://nostr.oxtr.dev",
]

const GET_EVENTS_LIMIT = 75
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
  pubkeys: string[],
  limit?: number
): Promise<{
  notes: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  related: NostrEvent[]
  reactions: Record<string, NostrReactionEvent[]>
}> =>
  new Promise(async (resolve) => {
    const filter = {
      authors: pubkeys,
      kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    }

    if (limit) {
      // @ts-expect-error
      filter.limit = limit
    }

    const notes = await getNostrEvents(relays, filter)

    const { related, profiles, reactions } = await getRelatedEvents(relays, notes)

    resolve({ notes, related, profiles, reactions })
  })

export const getEventsForPubkey = async (
  relays: Relay[],
  pubkey: string,
  limit?: number
): Promise<{
  notes: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  related: NostrEvent[]
  reactions: Record<string, NostrReactionEvent[]>
}> =>
  new Promise(async (resolve) => {
    const filter = {
      "#p": [pubkey],
      kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    }

    if (limit) {
      // @ts-expect-error
      filter.limit = limit
    }

    const notes = await getNostrEvents(relays, filter)

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
  handleEvent: (NostrEvent, related?: NostrEvent[], profiles?: Record<string, NostrProfileEvent>) => void
): Sub[] => {
  const subscriptions = []
  relays.forEach((relay) => {
    const sub = relay.sub([{ ...filter }])
    subscriptions.push(sub)

    sub.on("event", async (event: NostrEvent) => {
      if (event.kind === nostrEventKinds.note || event.kind === nostrEventKinds.repost) {
        const { related, profiles } = await getRelatedEvents(relays, [event])
        handleEvent(event, related, profiles)
      } else {
        handleEvent(event)
      }
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
      })
      pub.on("seen", () => {
        console.log(`we saw the event on ${relay.url}`)
      })
      pub.on("failed", (reason) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`)
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
