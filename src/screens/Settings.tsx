import React from "react"
import { View, ScrollView, Pressable } from "react-native"
import { Button, Text, useTheme, Icon, Divider } from "@ui-kitten/components"
import { nip19 } from "nostr-tools"
import * as Clipboard from "expo-clipboard"

import { useDispatch } from "store"
import { useUser } from "store/hooks"
import { logout } from "store/settingsSlice"
import { TopNavigation } from "components/TopNavigation"
import { Layout } from "components/Layout"

export const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const user = useUser()

  const handleLogout = () => {
    dispatch(logout())
    navigation.reset({ index: 0, routes: [{ name: "Auth" }] })
  }

  return (
    <Layout>
      <TopNavigation title="Settings" alignment="center" />
      <Divider />
      <ScrollView style={{ paddingTop: 16, paddingLeft: 8, paddingRight: 8 }}>
        {user.pubkey && user.privateKey && (
          <>
            <SettingsCard title="Public Account ID" value={nip19.npubEncode(user.pubkey)} />
            <SettingsCard title="Secret Account Login Key" value={nip19.nsecEncode(user.privateKey)} />
          </>
        )}

        <View style={{ marginTop: 32 }}>
          <Button appearance="outline" onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </Layout>
  )
}

const SettingsCard = ({ title, value }) => {
  const [copied, setCopied] = React.useState(false)
  const theme = useTheme()

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(value)
    setCopied(true)
  }

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied, setCopied])

  return (
    <View style={{ marginBottom: 16 }}>
      <Text appearance="hint" style={{ fontWeight: "400", fontSize: 16, paddingLeft: 16, marginBottom: 8 }}>
        {title}
      </Text>
      <Pressable onPress={copyToClipboard}>
        <View style={{ backgroundColor: theme["background-basic-color-3"], padding: 16, borderRadius: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text>{value}</Text>
            </View>
            <Icon
              name={copied ? "checkmark-outline" : "copy-outline"}
              style={{ height: 20, width: 20, tintColor: theme["color-primary-500"] }}
            />
          </View>
        </View>
      </Pressable>
    </View>
  )
}
