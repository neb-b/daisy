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
import type { RootState } from "redux/store"
import { updateProfilesByPubkey } from "redux/notesSlice"
import { getProfile } from "core/nostr"

export const AuthScreen = ({ navigation, route }) => {
  const dispatch = useDispatch()
  const [enteringPrivateKey, setEnteringPrivateKey] = React.useState(false)
  const [privateKey, setPrivateKey] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const { pub } = useSelector((state: RootState) => state.settings)
  const { reset } = navigation

  const handleSignup = () => {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] })
  }

  const handlePrivateKeySubmit = () => {}

  React.useEffect(() => {
    const init = async () => {
      if (pub) {
        const profile = (await getProfile(pub)) as NostrProfile
        dispatch(updateProfilesByPubkey({ [pub]: profile }))
        reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      }
    }

    init()
  }, [pub, dispatch])

  if (loading) {
    return <Layout style={{ flex: 1 }} />
  }

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ padding: 16, width: "100%" }}>
          <Text category="h3" style={{ marginBottom: 24, textAlign: "center" }}>
            [nostr-mobile]
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
                placeholder="npub1fieowrsnal"
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
