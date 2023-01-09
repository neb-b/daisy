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
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "store"
import { updateProfilesByPubkey, updateContactListByPubkey } from "store/notesSlice"
import { updateUser } from "store/settingsSlice"
import { getProfile } from "core/nostr"
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools"
import * as secp from "@noble/secp256k1"
import { bech32 } from "bech32"

export const AuthScreen = ({ navigation, route }) => {
  const dispatch = useDispatch()
  const [enteringPrivateKey, setEnteringPrivateKey] = React.useState(false)
  const [privateKey, setPrivateKey] = React.useState("")
  const { reset } = navigation

  const handleSignup = () => {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] })
  }

  const fetchProfile = async (pubkey: string) => {
    const { profile, contactList } = await getProfile(pubkey)

    dispatch(updateProfilesByPubkey({ [pubkey]: profile }))
    dispatch(updateContactListByPubkey({ [pubkey]: contactList }))
    reset({ index: 0, routes: [{ name: "Home" }] })
  }

  const handlePrivateKeySubmit = () => {
    const { data } = nip19.decode(privateKey)
    const hexPrivateKey = data as string
    const hexPubkey = getPublicKey(hexPrivateKey)
    // const bytesPubkey = secp.utils.hexToBytes(hexPubkey)
    // const pubkey = bech32.encode("npub", bech32.toWords(bytesPubkey))
    dispatch(updateUser({ pubkey: hexPubkey, privateKey: hexPrivateKey }))
    fetchProfile(hexPubkey)
  }

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ padding: 16, width: "100%" }}>
          <Text category="h3" style={{ marginBottom: 24, textAlign: "center" }}>
            Daisy
          </Text>
          {!enteringPrivateKey && (
            <View style={{ flexDirection: "column" }}>
              <Button onPress={handleSignup}>Signup</Button>
              <Button appearance="ghost" onPress={() => setEnteringPrivateKey(true)}>
                Enter private key
              </Button>
            </View>
          )}
          {enteringPrivateKey && (
            <View>
              <Input
                label={(props) => <Text {...props}>Private Key</Text>}
                placeholder="xxxxxxxx"
                value={privateKey}
                onChangeText={(text) => setPrivateKey(text)}
              />
              <Button onPress={handlePrivateKeySubmit}>Submit</Button>
              <Button appearance="ghost" onPress={() => setEnteringPrivateKey(false)}>
                Cancel
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Layout>
  )
}
