import React from "react"
import { AppState } from "react-native"

import { useDispatch } from "store"
import { useContactList, useUser, useRelaysByUrl } from "store/hooks"
import { doPopulateFollowingFeed } from "store/notesSlice"
import {
  doSubscribeToFollowing,
  doSubscribeToNotifications,
  doUnsubscribeFromRelaysForId,
} from "store/subscriptionsSlice"
import { doCycleRelays } from "store/settingsSlice"
import { usePrevious } from "utils/usePrevious"

type MyAppState = "active" | "background" | "inactive"

export const NostrRelayHandler = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const relaysByUrl = useRelaysByUrl()
  const appState = React.useRef(AppState.currentState)
  const [appVisible, setAppVisible] = React.useState(appState.current === "active")
  const contactList = useContactList(user.pubkey)
  const [hasPerformedInitialFetch, setHasPerformedInitialFetch] = React.useState(false)

  const hasContactList = contactList?.tags?.length > 0
  const relaysCount = Object.values(relaysByUrl).filter(
    (relay) => relay.status === 1 && typeof relay.on === "function"
  ).length
  const prevRelayCount = usePrevious(relaysCount)

  // React.useEffect(() => {
  //   if (hasContactList) {
  //     dispatch(doSubscribeToFollowing())
  //     dispatch(doSubscribeToNotifications())
  //   }
  //   return () => {
  //     dispatch(doUnsubscribeFromRelaysForId("following"))
  //     dispatch(doUnsubscribeFromRelaysForId("notifications"))
  //   }
  // }, [hasContactList, relaysCount])

  // React.useEffect(() => {
  //   if (!hasContactList || relaysCount === 0) {
  //     return
  //   }

  //   if (!hasPerformedInitialFetch && relaysCount > 0) {
  //     dispatch(doPopulateFollowingFeed())
  //     setHasPerformedInitialFetch(true)
  //     return
  //   }

  //   if (relaysCount > 0 && prevRelayCount === 0) {
  //     dispatch(doPopulateFollowingFeed())
  //   }
  // }, [hasContactList, relaysCount, prevRelayCount, hasPerformedInitialFetch, setHasPerformedInitialFetch])

  React.useEffect(() => {
    if (!hasContactList) {
      return
    }

    const subscription = AppState.addEventListener("change", (nextAppState: MyAppState) => {
      if (!appVisible && nextAppState === "active") {
        dispatch(doCycleRelays())
      }

      appState.current = nextAppState
      setAppVisible(appState.current === "active")
    })

    return () => {
      subscription.remove()
    }
  }, [appVisible, setAppVisible, hasContactList])
}
