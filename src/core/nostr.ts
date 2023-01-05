import { relayInit } from "nostr-tools"

export const relays = [
  "wss://relay.damus.io",
  "wss://nostr-relay.wlvs.space",
  // "wss://nostr.fmt.wiz.biz",
  // "wss://relay.nostr.bg",
  // "wss://nostr.oxtr.dev",
  // "wss://nostr.v0l.io",
]

const relayStatus = {}

const connectToRelay = async (relayEndpoint, successCallback) => {
  if (relayStatus[relayEndpoint]) {
    return
  }

  const relay = relayInit(relayEndpoint)
  await relay.connect()

  relay.on("connect", () => {
    relayStatus[relayEndpoint] = relay
    successCallback(relay)
  })
  relay.on("error", () => {
    console.log(`failed to connect to ${relay.url}`)
    relayStatus[relayEndpoint] = false
  })
}

export const initRelays = async () => {
  let connectedToOneRelay = false

  return new Promise((resolve) => {
    relays.forEach((relay) =>
      connectToRelay(relay, (relay) => {
        if (!connectedToOneRelay) {
          connectedToOneRelay = true
          resolve(relay)
        }
      })
    )
  })
}

export const getEventsForChannel = async (
  channelId?: string
): Promise<{ notes: NostrEvent[]; profiles: Record<string, NostrProfile> }> => {
  return new Promise(async (resolve) => {
    const notes = await getNostrEvents({ ...(channelId ? { "#e": [channelId] } : {}) })

    const profilePubkeysSet = new Set<string>()
    notes.forEach((message) => {
      profilePubkeysSet.add(message.pubkey)
    })

    const profilesEvents = await getNostrEvents({
      kinds: [0],
      authors: Array.from(profilePubkeysSet),
      limit: profilePubkeysSet.size,
    })

    const userProfileInfos = {}
    profilesEvents.forEach((profileEvent) => {
      const { content, ...userMetadata } = profileEvent
      let user = userMetadata

      try {
        const userProfileInfo = JSON.parse(content)
        user = { ...user, ...userProfileInfo }
      } catch (e) {}

      userProfileInfos[profileEvent.pubkey] = user
    })

    resolve({ notes, profiles: userProfileInfos })
  })
}

const getNostrEvents = async (filter?: NostrFilter): Promise<NostrEvent[]> => {
  return new Promise((resolve) => {
    const limit = filter?.limit || 10
    const events: NostrEvent[] = []

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
        events.push(nostrEvent)

        if (events.length === limit) {
          resolve(events)
          sub.unsub()
        }
      })

      sub.on("eose", () => {
        sub.unsub()
      })
    })
  })
}

export const getProfile = async (pubkey: string) => {
  return getNostrEvent({
    kinds: [0],
    authors: ["cbf904c0702a361911c46d79379a6a502bc3bd0b4c56d25389e62d3ebf4a7db8"],
  })
}

const getNostrEvent = async (filter?: NostrFilter): Promise<NostrEvent> => {
  return new Promise((resolve) => {
    const connectedRelays = relays.filter((relay) => relayStatus[relay])
    connectedRelays.forEach((relay) => {
      const relayObj = relayStatus[relay]
      console.log("relay", relayObj)

      const sub = relayObj.sub([filter])

      sub.on("event", (event) => {
        console.log("?event", event)
        const nostrEvent = <NostrEvent>event

        resolve(nostrEvent)
        sub.unsub()
      })

      sub.on("eose", () => {
        console.log("EOSE")
        sub.unsub()
      })
    })
  })
}
