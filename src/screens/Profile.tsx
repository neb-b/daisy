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

import { useSelector } from "react-redux"

import type { RootState } from "redux/store"
import { Avatar } from "components/Avatar"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ProfileScreen = ({ navigation, route }) => {
  const {
    params: { pubkey },
  } = route
  const { profilesByPubkey } = useSelector((state: RootState) => state.notes)
  const profile = profilesByPubkey[pubkey]

  const navigateBack = () => {
    navigation.goBack()
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Profile" alignment="center" accessoryLeft={BackAction} />
        <Divider />
        <Layout style={styles.center}>
          <View style={{ padding: 20 }}>
            <Avatar picture={profile?.picture} pubkey={pubkey} size={100} />
            {profile.name && (
              <Text style={{ fontWeight: "bold", fontSize: 32, marginTop: 24 }}>{profile.name}</Text>
            )}
            {profile.about && <Text style={{ marginTop: 12, fontSize: 16 }}>{profile.about}</Text>}

            <Text style={{ marginTop: 24 }}>pubkey: {pubkey}</Text>
          </View>
        </Layout>
      </SafeAreaView>
    </Layout>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
  },
})
