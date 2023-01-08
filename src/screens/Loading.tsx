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
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "state/store"
import { updateProfilesByPubkey, updateContactListByPubkey } from "state/notesSlice"
import { getProfile } from "core/nostr"
import { sleep } from "utils/sleep"

export const LoadingScreen = ({ navigation, route }) => {
  const dispatch = useDispatch()
  const { reset } = navigation
  const {
    user: { pubkey },
  } = useSelector((state: RootState) => state.settings)

  React.useEffect(() => {
    const startup = async () => {
      await initRelays()

      // figure out a better way to wait until connected to a relay
      await sleep(2000)

      if (!pubkey) {
        reset({
          index: 0,
          routes: [{ name: "Auth" }],
        })
      }

      const { profile, contactList } = await getProfile(pubkey)

      dispatch(updateProfilesByPubkey({ [pubkey]: profile }))
      dispatch(updateContactListByPubkey({ [pubkey]: contactList }))

      reset({
        index: 0,
        routes: [{ name: "Home" }],
      })
    }

    startup()
  }, [reset, pubkey])

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
