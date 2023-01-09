import React from "react"
import { SafeAreaView } from "react-native"
import { Layout, Text } from "@ui-kitten/components"
import { useInitRelays, useUser, useRelays } from "store/hooks"

export const LoadingScreen = ({ navigation, route }) => {
  useInitRelays()
  const user = useUser()
  const relays = useRelays()
  const hasRelays = relays.length > 0

  console.log("LoadingScreen: hasRelays", hasRelays)
  console.log("user", user)

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
