import React from "react"
import * as SplashScreen from "expo-splash-screen"

import { useUser } from "store/hooks"
import { useDispatch } from "store"
import { initRelays } from "store/settingsSlice"

export function LoadingScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const { pubkey } = useUser()

  const hideSplashScreen = React.useCallback(async () => {
    await SplashScreen.hideAsync()
  }, [])

  React.useEffect(() => {
    dispatch(initRelays())
  }, [dispatch])

  React.useEffect(() => {
    if (pubkey) {
      reset({ index: 0, routes: [{ name: "Home" }] })
    } else {
      reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })
    }

    setTimeout(() => {
      hideSplashScreen()
    }, 1000)
  }, [pubkey, reset, hideSplashScreen])

  return null
}
