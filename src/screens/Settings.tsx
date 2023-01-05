import React from "react"
import { View, SafeAreaView, ScrollView, Modal, Pressable, FlatList } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "redux/store"
import { updateTheme } from "redux/settingsSlice"

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
} from "@ui-kitten/components"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.settings)

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={() => navigation.goBack()} />

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Settings" alignment="center" accessoryLeft={BackAction} />
        <Divider />
        <ScrollView>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontWeight: "600", fontSize: 18 }}>Dark Mode</Text>
              <Toggle
                checked={theme === "dark" ? true : false}
                onChange={(newVal) => {
                  dispatch(updateTheme(newVal === true ? "dark" : "light"))
                }}
              />
            </View>
          </View>
          <Divider />
        </ScrollView>
      </SafeAreaView>
    </Layout>
  )
}
