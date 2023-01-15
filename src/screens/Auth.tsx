import React from "react"
import { View, SafeAreaView } from "react-native"
import { getPublicKey, nip19 } from "nostr-tools"
import { Input, Button, Layout, Text } from "@ui-kitten/components"

import { useDispatch } from "store"
import { doFetchProfile } from "store/notesSlice"
import { useUser, useProfile } from "store/hooks"
import { updateUser } from "store/settingsSlice"

export function AuthScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const user = useUser()
  const profile = useProfile(user?.pubkey)
  const [enteringPrivateKey, setEnteringPrivateKey] = React.useState(false)
  const [privateKey, setPrivateKey] = React.useState("")
  const hasProfile = Boolean(profile)

  const handleSignup = () => {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] })
  }

  const handlePrivateKeySubmit = () => {
    const { data } = nip19.decode(privateKey)
    const hexPrivateKey = data as string
    const hexPubkey = getPublicKey(hexPrivateKey)

    dispatch(updateUser({ pubkey: hexPubkey, privateKey: hexPrivateKey }))
    dispatch(doFetchProfile(hexPubkey))
  }

  React.useEffect(() => {
    if (hasProfile) {
      reset({ index: 0, routes: [{ name: "Home" }] })
    }
  }, [reset, hasProfile])

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ padding: 16, width: "100%" }}>
          <Text category="h1" style={{ marginBottom: 24, fontSize: 48, textAlign: "center" }}>
            {enteringPrivateKey ? "Login" : "Daisy"}
          </Text>
          {!enteringPrivateKey && (
            <View style={{ flexDirection: "column" }}>
              {/* <Button onPress={handleSignup} style={{ marginBottom: 8 }}>
                Signup
              </Button> */}
              <Button onPress={() => setEnteringPrivateKey(true)}>Enter private key</Button>
            </View>
          )}
          {enteringPrivateKey && (
            <View>
              <Input
                label={(props) => <Text {...props}>Private Key</Text>}
                placeholder="nsec..."
                value={privateKey}
                onChangeText={(text) => setPrivateKey(text)}
                style={{ marginBottom: 16 }}
              />
              <Button style={{ marginBottom: 8 }} onPress={handlePrivateKeySubmit}>
                Submit
              </Button>
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
