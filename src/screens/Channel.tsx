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

import type { RootState } from "store"
import { updateNotesAndProfiles, updateFeedByChannelId } from "store/notesSlice"

import { NoteItem } from "components/Note"
import { MessageInput } from "components/MessageInput"

// const CHANNEL = "3561b3054737b1b126e607d574f230ca17ababe6ef803070e8967c3de607a620"
const CHANNEL = "25e5c82273a271cb1a840d0060391a0bf4965cafeb029d5ab55350b418953fbb"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ChannelScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const notesState = useSelector((state: RootState) => state.notes)
  const { notesById, feedByChannelId, loading } = notesState

  const notesInFeed = feedByChannelId[CHANNEL]?.map((id) => notesById[id]).sort(
    (a, b) => a.created_at - b.created_at
  )

  const navigateBack = () => {
    navigation.goBack()
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Channel" alignment="center" accessoryLeft={BackAction} />
        <Divider />

        {loading && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Loading...</Text>
          </View>
        )}
        {notesInFeed && notesInFeed.length > 0 && (
          <FlatList
            inverted
            data={notesInFeed}
            renderItem={({ item }) => {
              return (
                <View
                  style={{
                    paddingLeft: 10,
                    paddingRight: 15,
                    paddingTop: 5,
                    paddingBottom: 5,
                    // flexWrap: "wrap",
                  }}
                >
                  <NoteItem id={item.id} navigation={navigation} />
                </View>
              )
            }}
            keyExtractor={(message) => message.id}
            contentContainerStyle={{ flexDirection: "column-reverse" }}
          />
        )}

        <MessageInput />
      </SafeAreaView>
    </Layout>
  )
}
