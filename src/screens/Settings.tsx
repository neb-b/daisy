import React from "react"
import { View, ScrollView, Pressable, Alert, Modal } from "react-native"
import { Button, Text, useTheme, Icon, Divider, Input, Toggle } from "@ui-kitten/components"
import { nip19 } from "nostr-tools"
import * as Clipboard from "expo-clipboard"

import { useDispatch } from "store"
import { useUser, useRelaysByUrl, useRelaysLoadingByUrl } from "store/hooks"
import { logout, doToggleRelay, doRemoveRelay } from "store/settingsSlice"
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
      <ScrollView style={{ paddingTop: 16, paddingLeft: 8, paddingRight: 8, paddingBottom: 16 }}>
        <RelayManagement />

        {user.pubkey && user.privateKey && (
          <>
            <SettingsCard title="Public Account ID" value={nip19.npubEncode(user.pubkey)} />
            <SettingsCard
              title="Secret Account Login Key"
              value={nip19.nsecEncode(user.privateKey)}
              isHidden
            />
          </>
        )}

        <View style={{ marginTop: 32, marginBottom: 64 }}>
          <Button appearance="ghost" onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </Layout>
  )
}

function SettingsCard({ title, value, isHidden = false }) {
  const [copied, setCopied] = React.useState(false)
  const theme = useTheme()
  const [hideText, setHideText] = React.useState(isHidden)

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
      <View
        style={{
          backgroundColor: theme["background-basic-color-2"],
          padding: 16,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: isHidden ? 0 : 10,
          borderBottomRightRadius: isHidden ? 0 : 10,
        }}
      >
        <Pressable onPress={copyToClipboard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text
                style={{
                  fontSize: hideText ? 36 : undefined,
                  lineHeight: hideText ? 24 : undefined,
                  marginBottom: hideText ? -12 : undefined,
                }}
              >
                {hideText ? "•••••••••••••••" : value}
              </Text>
            </View>
            <Icon
              name={copied ? "checkmark-outline" : "copy-outline"}
              style={{ height: 20, width: 20, tintColor: theme["color-primary-500"] }}
            />
          </View>
        </Pressable>
      </View>
      {isHidden && (
        <>
          <Divider style={{ backgroundColor: theme["background-basic-color-3"] }} />
          <View
            style={{
              flex: 1,
              backgroundColor: theme["background-basic-color-2"],
              padding: 16,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text>Hide login key</Text>

              <Toggle checked={hideText} onChange={() => setHideText(!hideText)} />
            </View>
          </View>
        </>
      )}
    </View>
  )
}

const RelayManagement = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const relaysLoadingByUrl = useRelaysLoadingByUrl()
  const relaysByUrl = useRelaysByUrl()
  const [addingRelay, setAddingRelay] = React.useState(false)
  const [draftRelay, setDraftRelay] = React.useState("")

  const relayLength = Object.values(relaysByUrl).length
  const validDraftRelay = draftRelay.match(/wss:\/\/(\w|.)+/)

  const handleRelayToggle = (relay) => {
    Alert.alert("Update relay", relay.url, [
      {
        text: relay.status === 1 ? `Disconnect` : "Connect",
        onPress: () => dispatch(doToggleRelay(relay.url)),
      },
      {
        text: "Remove from list",
        onPress: () => dispatch(doRemoveRelay(relay.url)),
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const handleAddRelay = () => {
    const relayUrl = draftRelay.trim()
    if (!relayUrl) {
      return
    }

    dispatch(doToggleRelay(relayUrl))
  }

  React.useEffect(() => {
    setAddingRelay(false)
    setDraftRelay("")
  }, [relayLength])

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text appearance="hint" style={{ fontWeight: "400", fontSize: 16, paddingLeft: 16, marginBottom: 8 }}>
          Relays
        </Text>
        <Button
          style={{ marginRight: -5 }}
          accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
          appearance="ghost"
          onPress={() => setAddingRelay(true)}
        ></Button>
      </View>
      <View style={{ backgroundColor: theme["background-basic-color-2"], borderRadius: 10 }}>
        {Object.values(relaysByUrl).map((relay, i) => {
          const connected = relay.status === 1
          const loading = relaysLoadingByUrl[relay.url]

          const iconProps = connected
            ? {
                name: "checkmark-outline",
                fill: theme["color-success-500"],
              }
            : loading
            ? {
                name: "alert-circle-outline",
                fill: theme["color-warning-500"],
              }
            : {
                name: "alert-circle-outline",
                fill: theme["color-danger-500"],
              }

          return (
            <Pressable key={relay.url} onPress={() => handleRelayToggle(relay)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", margin: 16 }}>
                <Text>
                  {relay.url}
                  {loading ? "..." : ""}
                </Text>
                <Icon height={20} width={20} {...iconProps} />
              </View>
              {i !== relayLength - 1 && (
                <Divider style={{ backgroundColor: theme["background-basic-color-3"] }} />
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
              accessoryRight={
                <Button appearance="ghost" onPress={() => setAddingRelay(false)}>
                  <Text>Cancel</Text>
                </Button>
              }
            />
            <Divider />

            <View style={{ flex: 1, paddingRight: 16, paddingLeft: 16, paddingTop: 16 }}>
              <Input
                autoFocus
                spellCheck={false}
                autoCorrect={false}
                label="Relay url"
                autoCapitalize="none"
                placeholder="wss://test.relay.nostr"
                value={draftRelay}
                onChangeText={(newContent) => setDraftRelay(newContent)}
              />
              <Button
                disabled={!validDraftRelay}
                style={{ marginTop: 16, borderRadius: 10 }}
                onPress={handleAddRelay}
              >
                Add
              </Button>
            </View>
          </Layout>
        </Modal>
      )}
    </View>
  )
}
