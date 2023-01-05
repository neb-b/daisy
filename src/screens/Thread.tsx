import React from "react"
import { StyleSheet, View, SafeAreaView, FlatList } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import {
  Input,
  Button,
  Divider,
  TopNavigation,
  Layout,
  Icon,
  Text,
  TopNavigationAction,
} from "@ui-kitten/components"

import { NoteItem } from "components/Note"
import { MessageInput } from "components/MessageInput"
//
const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  //

  const navigateBack = () => {
    navigation.goBack()
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Thread" alignment="center" accessoryLeft={BackAction} />
        <Divider />

        <View style={{ flex: 1 }}>
          <NoteItem id={id} navigation={navigation} style={{ padding: 16 }} />
          <Divider />
        </View>

        <MessageInput />
      </SafeAreaView>
    </Layout>
  )
}
