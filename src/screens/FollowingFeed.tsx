import React from "react"
import { FlatList, Modal, Pressable } from "react-native"
import { Button, Divider, TopNavigation, Icon } from "@ui-kitten/components"

import { useDispatch } from "store"
import { doPopulateFollowingFeed } from "store/notesSlice"
import { useFeed } from "store/hooks"
import { Layout } from "components/Layout"
import { NoteItem } from "components/Note"
import { NewNote } from "components/NewNote"

export const FollowingFeedScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const [creatingNote, setCreatingNote] = React.useState(false)
  const followingFeed = useFeed("following")

  React.useEffect(() => {
    dispatch(doPopulateFollowingFeed())
  }, [])

  return (
    <Layout>
      <TopNavigation title="Feed" alignment="center" />
      <Divider />

      {followingFeed?.length > 0 && (
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
