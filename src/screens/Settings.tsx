import React from "react"
import { View, SafeAreaView, ScrollView, Modal, Pressable, FlatList } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "state/store"
import { updateTheme } from "state/settingsSlice"

import {
  Input,
  Button,
  Divider,
  TopNavigation,
  TopNavigationAction,
  Layout,
  Icon,
  Text,
  Toggle,
  Card,
  useTheme,
} from "@ui-kitten/components"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.settings)

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Settings" alignment="center" />
        <ScrollView>
          {/* <SettingsCard title="Display">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontWeight: "600", fontSize: 18 }}>Dark Mode</Text>
              <Toggle
                checked={theme === "dark" ? true : false}
                onChange={(newVal) => {
                  dispatch(updateTheme(newVal === true ? "dark" : "light"))
                }}
              />
            </View>
          </SettingsCard> */}

          <SettingsCard title="Pubkey">
            <Text>{user.pubkey}</Text>
          </SettingsCard>
          <SettingsCard title="Private key">
            <Text>{user.privateKey}</Text>
          </SettingsCard>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  )
}

const SettingsCard = ({ title, children }) => {
  const theme = useTheme()
  return (
    <View style={{ marginLeft: 16, marginRight: 16, marginBottom: 16 }}>
      <Text style={{ fontWeight: "400", fontSize: 16, marginLeft: 16, marginBottom: 8 }}>{title}</Text>
      <Card style={{ backgroundColor: theme["background-basic-color-3"], borderRadius: 20 }}>{children}</Card>
    </View>
  )
}
