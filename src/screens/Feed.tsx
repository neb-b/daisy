import React from "react"
import { StyleSheet, View, SafeAreaView, FlatList, Modal, Pressable } from "react-native"
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

import type { RootState } from "redux/store"
import { updateNotesAndProfiles, updateFeedByChannelId } from "redux/notesSlice"
import { getEventsForChannel } from "core/nostr"

import { NoteItem } from "components/Note"
import { NewNote } from "components/NewNote"

export const FeedScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const { notes: notesState, settings: settingsState } = useSelector((state: RootState) => state)
  const { profilesByPubkey, loading } = notesState
  const [creatingNote, setCreatingNote] = React.useState(false)

  const profilePubkey = settingsState.pub
  const profile = profilesByPubkey[profilePubkey]

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Feed" alignment="center" />
        <Divider />
        {loading && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Loading...</Text>
          </View>
        )}

        <Button
          onPress={() => setCreatingNote(true)}
          style={{ position: "absolute", bottom: 8, right: 8, height: 50, width: 50, borderRadius: 50 / 2 }}
          accessoryLeft={(props) => <Icon name="plus-outline" {...props} />}
        />
      </SafeAreaView>

      {creatingNote && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setCreatingNote(false)
          }}
        >
          <NewNote closeModal={() => setCreatingNote(false)} />
        </Modal>
      )}
    </Layout>
  )
}
