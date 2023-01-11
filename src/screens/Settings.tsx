import React from "react"
import { View, SafeAreaView, ScrollView } from "react-native"
import { useSelector } from "react-redux"
import { Button, TopNavigation, Layout, Icon, Text, Card, useTheme } from "@ui-kitten/components"
import { useDispatch } from "store"
import { useUser } from "store/hooks"
import { logout } from "store/settingsSlice"

export const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const user = useUser()

  const handleLogout = () => {
    dispatch(logout())
    navigation.reset({ index: 0, routes: [{ name: "Auth" }] })
  }

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Settings" alignment="center" />
        <ScrollView>
          <SettingsCard title="Pubkey">
            <Text>{user.pubkey}</Text>
          </SettingsCard>
          <SettingsCard title="Private key">
            <Text>{user.privateKey}</Text>
          </SettingsCard>
          <View style={{ marginTop: "auto", marginLeft: 16, marginRight: 16 }}>
            <Button appearance="outline" onPress={handleLogout}>
              Logout
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  )
}

const SettingsCard = ({ title, children }) => {
  const theme = useTheme()
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: "400", fontSize: 16, marginLeft: 16, marginBottom: 8 }}>{title}</Text>
      <Card style={{ backgroundColor: theme["background-basic-color-3"], borderRadius: 20 }}>{children}</Card>
    </View>
  )
}
