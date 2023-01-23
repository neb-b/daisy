import React from "react"
import { AppState } from "react-native"

import { useDispatch } from "store"
import { useContactList, useUser, useSubscriptions } from "store/hooks"
import { doSubscribeToRelays, unsubscribeFromRelays } from "store/subscriptionsSlice"

type MyAppState = "active" | "background" | "inactive"

// Handle following/notifications subscriptions
// Close and reopen subscriptions when relay count changes
export const NostrRelayHandler = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const subscriptions = useSubscriptions()

  const appState = React.useRef(AppState.currentState)
  const [appVisible, setAppVisible] = React.useState(appState.current === "active")
  const contactList = useContactList(user.pubkey)

  const hasContactList = contactList?.tags?.length > 0

  console.log("subscriptions", subscriptions)

  React.useEffect(() => {
    if (hasContactList) {
      dispatch(doSubscribeToRelays("following"))
    }
  }, [hasContactList])

  React.useEffect(() => {
    if (!hasContactList) {
      return
    }

    const subscription = AppState.addEventListener("change", (nextAppState: MyAppState) => {
      if (!appVisible && nextAppState === "active") {
        // App has come to the foreground
      } else if (appVisible && (nextAppState === "inactive" || nextAppState === "background")) {
        // App leaving
        // Unsub
      }

      appState.current = nextAppState
      setAppVisible(appState.current === "active")
    })

    return () => {
      subscription.remove()
    }
  }, [appVisible, setAppVisible, hasContactList])
}
