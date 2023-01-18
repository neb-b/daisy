import React from "react"
import { SafeAreaView } from "react-native"
import { Layout, Text } from "@ui-kitten/components"
import { useUser, useHasRelayConnection } from "store/hooks"
import { useDispatch } from "store"
import { initRelays } from "store/settingsSlice"

export function LoadingScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const { pubkey } = useUser()
  const hasRelayConnection = useHasRelayConnection()

  React.useEffect(() => {
    dispatch(initRelays())
  }, [dispatch])

  React.useEffect(() => {
    if (!hasRelayConnection) {
      return
    }

    if (!pubkey) {
      return reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })
    }
  }, [hasRelayConnection, pubkey, reset])

  React.useEffect(() => {
    if (hasRelayConnection) {
      return reset({ index: 0, routes: [{ name: "Home" }] })
    }
  }, [reset, hasRelayConnection])

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
