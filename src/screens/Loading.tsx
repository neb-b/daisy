import React from "react"
import { SafeAreaView } from "react-native"
import { Layout, Text } from "@ui-kitten/components"
import { useUser, useRelayState } from "store/hooks"
import { useDispatch } from "store"
import { initRelays } from "store/settingsSlice"

export function LoadingScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const { pubkey } = useUser()
  const relays = useRelayState()
  const hasRelays = relays && Object.values(relays).find((relay) => typeof relay.on === "function")

  React.useEffect(() => {
    dispatch(initRelays())
  }, [dispatch])

  React.useEffect(() => {
    if (!hasRelays) {
      return
    }

    if (!pubkey) {
      return reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })
    }
  }, [hasRelays, pubkey, reset])

  React.useEffect(() => {
    if (hasRelays) {
      return reset({ index: 0, routes: [{ name: "Home" }] })
    }
  }, [reset, hasRelays])

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Layout style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Loading</Text>
        </Layout>
      </SafeAreaView>
    </Layout>
  )
}
