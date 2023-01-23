import React from "react"
import { AppState } from "react-native"

import { useDispatch } from "store"
import { useContactList, useUser, useRelaysByUrl } from "store/hooks"
import { doPopulateFollowingFeed } from "store/notesSlice"
import { doSubscribeToRelays, doUnsubscribeFromRelays } from "store/subscriptionsSlice"

type MyAppState = "active" | "background" | "inactive"

export const NostrRelayHandler = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const relaysByUrl = useRelaysByUrl()
  const appState = React.useRef(AppState.currentState)
  const [appVisible, setAppVisible] = React.useState(appState.current === "active")
  const contactList = useContactList(user.pubkey)

  const hasContactList = contactList?.tags?.length > 0
  const relaysCount = Object.values(relaysByUrl).filter(
    (relay) => relay.status === 1 && typeof relay.on === "function"
  ).length

  React.useEffect(() => {
    if (hasContactList) {
      dispatch(doSubscribeToRelays("following"))
      dispatch(doSubscribeToRelays("notifications"))
    }
    return () => {
      dispatch(doUnsubscribeFromRelays("following"))
      dispatch(doUnsubscribeFromRelays("notifications"))
    }
  }, [hasContactList, relaysCount])

  React.useEffect(() => {
    if (hasContactList) {
      dispatch(doPopulateFollowingFeed())
    }
  }, [hasContactList])

  React.useEffect(() => {
    if (!hasContactList) {
      return
    }

    const subscription = AppState.addEventListener("change", (nextAppState: MyAppState) => {
      if (!appVisible && nextAppState === "active") {
        // App has come to the foreground
        // TODO: determine if we need to reconnect to relays?
      } else if (appVisible && (nextAppState === "inactive" || nextAppState === "background")) {
        // App leaving
        // Unsub
        // close relays?
      }

      appState.current = nextAppState
      setAppVisible(appState.current === "active")
    })

    return () => {
      subscription.remove()
    }
  }, [appVisible, setAppVisible, hasContactList])
}
