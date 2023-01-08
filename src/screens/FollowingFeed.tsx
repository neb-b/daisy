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

import type { RootState } from "state/store"
import { updateNotesAndProfiles, updateFeedByChannelId } from "state/notesSlice"
import { getEventsFromContactList, subscribeToContactList } from "core/nostr"

import { NoteItem } from "components/Note"
import { NewNote } from "components/NewNote"

export const FollowingFeedScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const { notes: notesState, settings: settingsState } = useSelector((state: RootState) => state)
  const { profilesByPubkey, feedByChannelId, contactListByPubkey, loading } = notesState
  const [creatingNote, setCreatingNote] = React.useState(false)

  const followingFeed = feedByChannelId["following"] || []
  const profilePubkey = settingsState.user.pubkey
  const profile = profilesByPubkey[profilePubkey]
  const contactList = contactListByPubkey[profilePubkey]?.tags.map((tag) => tag[1])

  console.log("logged in: ", profilePubkey)

  const stringifiedContactList = JSON.stringify(contactList)
  React.useEffect(() => {
    const fetchNotes = async () => {
      if (!contactList) {
        return
      }

      const jsonContactList = JSON.parse(stringifiedContactList)
      const { notes, profiles } = await getEventsFromContactList(jsonContactList)
      dispatch(updateNotesAndProfiles({ notes, profiles }))
      dispatch(updateFeedByChannelId({ following: notes.map((note) => note.id) }))

      const unsub = subscribeToContactList(jsonContactList)
      return () => unsub()
    }

    fetchNotes()
  }, [stringifiedContactList])

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

        {followingFeed.length > 0 && (
          <FlatList
            data={followingFeed}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate("Thread", { id: item })}
                style={{
                  paddingLeft: 10,
                  paddingRight: 15,
                  paddingTop: 10,
                }}
              >
                <NoteItem navigation={navigation} key={item} id={item} />
              </Pressable>
            )}
            keyExtractor={(item) => item}
          />
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
