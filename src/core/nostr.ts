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

const nostrEventKinds = {
  profile: 0,
  note: 1,
  contactList: 3,
  reaction: 7,
}

export const defaultRelays = [
  "wss://relay.damus.io",
  // "wss://nostr-relay.wlvs.space",
  // "wss://nostr.fmt.wiz.biz",
  "wss://relay.nostr.bg",
  "wss://nostr.oxtr.dev",
  // "wss://nostr.v0l.io",
]

const GET_EVENTS_LIMIT = 50

export const connectToRelay = async (relayEndpoint): Promise<{ relay: Relay; success: boolean }> => {
  return new Promise(async (resolve) => {
    const relay = relayInit(relayEndpoint)
    await relay.connect()
    let connected = false

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

    setTimeout(() => {
      if (connected) return

      relay.close()
      return resolve({ relay, success: false })
    }, 1000)
  })
}

export const getEventsFromContactList = async (
  relays: Relay[],
  contactList: { tags: string[][] }
): Promise<{ notes: NostrEvent[]; profiles: Record<string, NostrProfileEvent> }> => {
  const pubkeys = contactList.tags.map((tag) => tag[1])

  return new Promise(async (resolve) => {
    const notes = await getNostrEvents(relays, {
      authors: pubkeys,
      kinds: [1],
    })

    const profilePubkeysSet = new Set<string>()
    notes.forEach((message) => {
      profilePubkeysSet.add(message.pubkey)
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

    resolve({ notes, profiles: userProfileInfos })
  })
}

export const subscribeToContactList = (
  relays,
  contactList: { tags: string[][] },
  handleEvent: (NostrEvent) => void
) => {
  const pubkeys = contactList.tags.map((tag) => tag[1])

  const unsub = subscribeToNostrEvents(
    relays,
    {
      authors: pubkeys,
      kinds: [1],
      since: Date.now() / 1000,
    },
    handleEvent
  )

  // TODO: return unsub
  // return unsub
}

const getNostrEvents = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent[]> => {
  return new Promise((resolve) => {
    const limit = filter?.limit || GET_EVENTS_LIMIT
    const eventsById: Record<string, NostrEvent> = {}
    let fetchedCount = 0
    let timedOut = false

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
          if (timedOut) {
            return
          }

          resolve(Array.from(Object.values(eventsById)))
          sub.unsub()
        }
      })

      sub.on("eose", () => {
        sub.unsub()
      })

      setTimeout(() => {
        // If a timeout happens, return what has been received so far
        if (fetchedCount === limit) return
        timedOut = true

        resolve(Array.from(Object.values(eventsById)))
        sub.unsub()
      }, 1000)
    })
  })
}

const subscribeToNostrEvents = (relays: Relay[], filter: NostrFilter, handleEvent: (NostrEvent) => void) => {
  relays.forEach((relay) => {
    const sub = relay.sub([{ ...filter }])

    sub.on("event", handleEvent)

    sub.on("eose", () => {
      console.log("getNostrEvents eose: ", relay)
      sub.unsub()
    })
  })

  // TODO: return unsubscribe function
  // return () => {
  //   Object.values(subscriptions).forEach((sub: { unsub: () => void }) => sub.unsub())
  // }
}

const getNostrEvent = async (relays: Relay[], filter?: NostrFilter): Promise<NostrEvent> => {
  return new Promise((resolve) => {
    relays.forEach((relay) => {
      const sub = relay.sub([{ ...filter }])

      sub.on("event", (event) => {
        const nostrEvent = <NostrEvent>event

        const { content: stringifedContent, ...rest } = nostrEvent
        const content = JSON.parse(stringifedContent)

        resolve({ content, ...rest })
        sub.unsub()
      })

      sub.on("eose", () => {
        console.log("getNostrEvent eose: ", relay)
        sub.unsub()
      })
    })
  })
}

export const publishNote = async (user, eventData): Promise<void> => {
  let event = {
    kind: 1,
    pubkey: user.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    ...eventData,
  }

  event.id = getEventHash(event)
  event.sig = signEvent(event, user.privateKey)

  const connectedRelays = relays.filter((relay) => relayStatus[relay])

  connectedRelays.forEach((relay) => {
    const relayObj = relayStatus[relay]
    const pub = relayObj.publish(event)
    pub.on("ok", () => {
      console.log(`${relayObj.url} has accepted our event`)
      relayObj.close()
    })
    pub.on("seen", () => {
      console.log(`we saw the event on ${relayObj.url}`)
      relayObj.close()
    })
    pub.on("failed", (reason) => {
      console.log(`failed to publish to ${relayObj.url}: ${reason}`)
      relayObj.close()
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
