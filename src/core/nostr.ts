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
  "wss://nostr-relay.wlvs.space",
  // "wss://nostr.fmt.wiz.biz",
  "wss://relay.nostr.bg",
  "wss://nostr.oxtr.dev",
  "wss://nostr.v0l.io",
]

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
  pubkeys: string[]
): Promise<{ notes: NostrEvent[]; profiles: Record<string, NostrProfileEvent> }> => {
  return new Promise(async (resolve) => {
    const notes = await getNostrEvents({
      authors: pubkeys,
      kinds: [1],
    })

    const profilePubkeysSet = new Set<string>()
    notes.forEach((message) => {
      profilePubkeysSet.add(message.pubkey)
    })

    const profilesEvents = (await getNostrEvents({
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
  pubkeys: string[]
  // handleEvent: (NostrEvent) => void
): (() => void) => {
  const unsub = subscribeToNostrEvents(
    {
      authors: pubkeys,
      kinds: [1],
      since: Date.now() / 1000,
    },
    (event) => {
      console.log("new event", event)
    }
  )

  return unsub
}

const getNostrEvents = async (filter?: NostrFilter): Promise<NostrEvent[]> => {
  return new Promise((resolve) => {
    const limit = filter?.limit || 5
    const eventsById: Record<string, NostrEvent> = {}
    let fetchedCount = 0

    const connectedRelays = relays.filter((relay) => relayStatus[relay])
    connectedRelays.forEach((relay) => {
      const relayObj = relayStatus[relay]

      const sub = relayObj.sub([
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
        }
      })

      sub.on("eose", () => {
        sub.unsub()
      })
    })
  })
}

const subscriptions = {}
const subscribeToNostrEvents = (filter: NostrFilter, handleEvent: (NostrEvent) => void): (() => void) => {
  const connectedRelays = relays.filter((relay) => relayStatus[relay])
  connectedRelays.forEach((relay) => {
    const relayObj = relayStatus[relay]
    const sub = relayObj.sub([filter])
    subscriptions[relay] = sub

    sub.on("event", handleEvent)

    sub.on("eose", () => {
      console.log("getNostrEvents eose: ", relay)
      subscriptions[relay] = null
      sub.unsub()
    })
  })

  return () => {
    Object.values(subscriptions).forEach((sub: { unsub: () => void }) => sub.unsub())
  }
}

const getNostrEvent = async (filter?: NostrFilter): Promise<NostrEvent> => {
  return new Promise((resolve) => {
    const connectedRelays = relays.filter((relay) => relayStatus[relay])
    connectedRelays.forEach((relay) => {
      const relayObj = relayStatus[relay]

      const sub = relayObj.sub([filter])

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
  pubkey: string
): Promise<{ profile: NostrProfile; contactList: NostrContactListEvent }> => {
  const profile = (await getNostrEvent({
    kinds: [nostrEventKinds.profile],
    authors: [pubkey],
  })) as NostrProfile

  const contactList = (await getNostrEvent({
    kinds: [nostrEventKinds.contactList],
    authors: [pubkey],
  })) as NostrContactListEvent

  return { profile, contactList }
}
