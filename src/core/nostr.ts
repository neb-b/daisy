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
  // "wss://relay.snort.social",
  "wss://nostr-pub.wellorder.net",
  // "wss://brb.io",
  // "wss://nostr-relay.wlvs.space",
  "wss://nostr.oxtr.dev",
  // "wss://relay.nostr.bg",
  "wss://nostr.fmt.wiz.biz",
]

const GET_EVENTS_LIMIT = 50
const TIMEOUT = 1000

export const connectToRelay = async (relayEndpoint): Promise<{ relay: Relay; success: boolean }> => {
  return new Promise(async (resolve) => {
    let connected = false
    let relay
    try {
      relay = relayInit(relayEndpoint)
      await relay.connect()

      relay.on("connect", () => {
        console.log("connected to: ", relay.url)
        connected = true
        return resolve({ relay, success: true })
      })
      relay.on("error", () => {
        console.log("error with: ", relay.url)
        relay.close()
        return resolve({ relay, success: false })
      })
    } catch (e) {
      console.log("error with init relay", relayEndpoint, e)
      // @ts-expect-error
      resolve({ relay: { url: relayEndpoint }, success: false })
    }

    setTimeout(() => {
      if (connected) return

      if (relay) {
        relay.close()
      }
      return resolve({ relay, success: false })
    }, 1000)
  })
}

export const getReplies = async (relays: Relay[], eventIds: string[]): Promise<NostrEvent[]> => {
  return new Promise(async (resolve) => {
    const replies = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      "#e": eventIds,
    })

    resolve([...replies])
  })
}

export const getEventsFromPubkeys = async (
  relays: Relay[],
  pubkeys: string[]
): Promise<{
  notes: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  related: NostrEvent[]
  reactions: Record<string, NostrReactionEvent[]>
}> => {
  return new Promise(async (resolve) => {
    const notes = await getNostrEvents(relays, {
      authors: pubkeys,
      kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    })

    const { related, profiles, reactions } = await getRelatedEvents(relays, notes)

    resolve({ notes, related, profiles, reactions })
  })
}

const getRelatedEvents = async (
  relays: Relay[],
  notes: NostrEvent[]
): Promise<{
  related: NostrEvent[]
  profiles: Record<string, NostrProfileEvent>
  reactions: Record<string, NostrReactionEvent[]>
}> => {
  return new Promise(async (resolve) => {
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

    //
    // TODO: fetch all events in parallel, and possibly fetch them together
    // Maybe reactions should be fetched after all the notes are actually rendered
    //
    const replyEvents = (await getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      limit: repliesSet.size,
      ids: Array.from(repliesSet),
    })) as NostrProfileEvent[]

    const repostEvents = (await getNostrEvents(relays, {
      kinds: [nostrEventKinds.note],
      limit: repostsSet.size,
      ids: Array.from(repostsSet),
    })) as NostrProfileEvent[]

    const reactionEvents = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.reaction],
      "#e": [...repliesSet, ...repostsSet, ...notes.map((note) => note.id)],
    })

    const prunedReactionEvents = reactionEvents.filter((note: NostrEvent) => {
      return note.content === "+" || note.content === "🤙" || note.content === "❤️"
    })

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
}

const getNostrEvents = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent[]> => {
  return new Promise((resolve) => {
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
}

export const subscribeToNostrEvents = (
  relays: Relay[],
  filter: NostrFilter,
  handleEvent: (NostrEvent, related: NostrEvent[], profiles: Record<string, NostrProfileEvent>) => void
): Sub[] => {
  let subscriptions = []
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

const getNostrEvent = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent> => {
  return new Promise((resolve) => {
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
}

export const publishNote = async (
  relays: Relay[],
  user: { pubkey: string; privateKey: string },
  kind: number,
  content = "",
  tags = []
): Promise<NostrNoteEvent> => {
  let event = {
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
  })
}

export const getProfile = async (
  relays: Relay[],
  pubkey: string
): Promise<{ profile: NostrProfile; contactList: NostrContactListEvent }> => {
  const profile = (await getNostrEvent(relays, {
    kinds: [nostrEventKinds.profile],
    authors: [pubkey],
  })) as NostrProfile

  const contactList = (await getNostrEvent(relays, {
    kinds: [nostrEventKinds.contactList],
    authors: [pubkey],
  })) as NostrContactListEvent

  return { profile, contactList }
}
