import React from "react"
import { View, ScrollView, Pressable, Modal } from "react-native"
import { Button, Text, useTheme, Icon, Divider } from "@ui-kitten/components"
import { nip19 } from "nostr-tools"
import * as Clipboard from "expo-clipboard"

import { useDispatch } from "store"
import { useUser, useRelaysByUrl, useRelaysLoadingByUrl } from "store/hooks"
import { logout, doToggleRelay } from "store/settingsSlice"
import { TopNavigation, Layout } from "components"

export function SettingsScreen({ navigation }) {
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
        <RelayManagement />

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

function SettingsCard({ title, value }) {
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

const RelayManagement = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const relaysLoadingByUrl = useRelaysLoadingByUrl()
  const relaysByUrl = useRelaysByUrl()
  const [addingRelay, setAddingRelay] = React.useState(false)

  const relayLength = Object.values(relaysByUrl).length

  const handleRelayToggle = (relayUrl) => {
    dispatch(doToggleRelay(relayUrl))
  }

  const rightAccessory = () => (
    <Button appearance="ghost" onPress={() => setAddingRelay(false)}>
      <Text>Cancel</Text>
    </Button>
  )

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text appearance="hint" style={{ fontWeight: "400", fontSize: 16, paddingLeft: 16, marginBottom: 8 }}>
          Relays
        </Text>
        <Button
          accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
          appearance="ghost"
          onPress={() => setAddingRelay(true)}
        ></Button>
      </View>
      <View style={{ backgroundColor: theme["background-basic-color-3"], borderRadius: 10 }}>
        {Object.values(relaysByUrl).map((relay, i) => {
          const connected = relay.status === 1
          const loading = relaysLoadingByUrl[relay.url]

          const iconProps = connected
            ? {
                name: "checkmark-outline",
                fill: theme["color-primary-500"],
              }
            : loading
            ? {
                name: "alert-circle-outline",
                fill: theme["color-warning-500"],
              }
            : {
                name: "alert-circle-outline",
                fill: theme["color-error-500"],
              }

          return (
            <Pressable key={relay.url} onPress={() => handleRelayToggle(relay.url)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", margin: 16 }}>
                <Text>
                  {relay.url}
                  {loading ? "..." : ""}
                </Text>
                <Icon height={20} width={20} {...iconProps} />
              </View>
              {i !== relayLength - 1 && (
                <Divider style={{ backgroundColor: theme["background-basic-color-4"] }} />
              )}
            </Pressable>
          )
        })}
      </View>

      {addingRelay && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setAddingRelay(false)
          }}
        >
          <Layout>
            <TopNavigation
              hideProfileLink
              hideBack
              title="Add Relay"
              alignment="center"
              accessoryRight={rightAccessory}
            />
            <Text>Add relay</Text>
          </Layout>
        </Modal>
      )}
    </View>
  )
}
