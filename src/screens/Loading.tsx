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
      reset({
        index: 0,
        routes: [
          { name: "Home" },
          // {
          //   name: "Profile",
          //   params: { pubkey: "cbf904c0702a361911c46d79379a6a502bc3bd0b4c56d25389e62d3ebf4a7db8" },
          // },
        ],
      })
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
