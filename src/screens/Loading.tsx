import React from "react"
import { View, Pressable, StyleSheet, SafeAreaView, FlatList, ScrollView } from "react-native"
import {
  Input,
  Button,
  Divider,
  TopNavigation,
  TopNavigationAction,
  Layout,
  Icon,
  Text,
} from "@ui-kitten/components"
import { initRelays } from "core/nostr"

export const LoadingScreen = ({ navigation, route }) => {
  const { reset } = navigation

  React.useEffect(() => {
    const startup = async () => {
      await initRelays()
      setTimeout(() => {
        reset({
          index: 0,
          routes: [{ name: "Auth" }],
        })
      }, 2000)
    }

    startup()
  }, [reset])

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
