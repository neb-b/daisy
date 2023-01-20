import React from "react"
import { View, SafeAreaView } from "react-native"
import { getPublicKey, nip19 } from "nostr-tools"
import { Input, Button, Layout, Text } from "@ui-kitten/components"
import * as secp from "@noble/secp256k1"

import { useDispatch } from "store"
import { useUser } from "store/hooks"
import { updateUser } from "store/settingsSlice"

export function AuthScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const user = useUser()
  const [enteringPrivateKey, setEnteringPrivateKey] = React.useState(false)
  const [privateKey, setPrivateKey] = React.useState("")
  const [error, setError] = React.useState("")

  const handlePrivateKeySubmit = () => {
    setError("")
    try {
      let validPrivateKey: string
      let validPubkey: string

      if (privateKey.startsWith("nsec")) {
        const { data } = nip19.decode(privateKey)
        const hexPrivateKey = data as string
        const hexPubkey = getPublicKey(hexPrivateKey)
        validPrivateKey = hexPrivateKey
        validPubkey = hexPubkey
      } else {
        if (secp.utils.isValidPrivateKey(privateKey)) {
          const hexPrivateKey = privateKey
          const hexPubkey = getPublicKey(hexPrivateKey)
          validPrivateKey = hexPrivateKey
          validPubkey = hexPubkey
        } else {
          throw new Error("Invalid private key")
        }
      }

      dispatch(updateUser({ pubkey: validPubkey, privateKey: validPrivateKey }))
    } catch (e) {
      setError("Invalid private key")
    }
  }

  React.useEffect(() => {
    if (user.privateKey) {
      reset({ index: 0, routes: [{ name: "Home" }] })
    }
  }, [reset, user.privateKey])

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ padding: 16, width: "100%" }}>
          <Text category="h1" style={{ fontSize: 48, textAlign: "center" }}>
            {enteringPrivateKey ? "Login" : "Daisy"}
          </Text>
          {!enteringPrivateKey && (
            <Text category="h4" style={{ textAlign: "center", marginBottom: 24 }}>
              A Nostr Client
            </Text>
          )}
          {!enteringPrivateKey && (
            <View style={{ flexDirection: "column" }}>
              {/* <Button onPress={handleSignup} style={{ marginBottom: 8 }}>
                Signup
              </Button> */}
              <Button onPress={() => setEnteringPrivateKey(true)}>Enter private key</Button>
            </View>
          )}
          {enteringPrivateKey && (
            <View style={{ marginTop: 24 }}>
              <Input
                autoComplete="off"
                autoCapitalize="none"
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
          {error && <Text style={{ color: "red" }}>{error}</Text>}
        </View>
      </SafeAreaView>
    </Layout>
  )
}
