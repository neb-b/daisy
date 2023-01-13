import React from "react"
import { Modal, Pressable, View, Text } from "react-native"
import { Button, Divider, TopNavigation, Icon, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { useDispatch } from "store"
import { doPopulateFollowingFeed } from "store/notesSlice"
import { useFeed } from "store/hooks"
import { Layout } from "components/Layout"
import { Note } from "components/Note"
import { NewNote } from "components/NewNote"

export const FollowingFeedScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const [creatingNote, setCreatingNote] = React.useState(false)
  const { loading, notes } = useFeed("following")

  React.useEffect(() => {
    dispatch(doPopulateFollowingFeed())
  }, [])

  const renderNote = React.useCallback(
    ({ item }) => (
      <Pressable onPress={() => navigation.navigate("Thread", { id: item })} style={{}}>
        <Note navigation={navigation} key={item} id={item} />
      </Pressable>
    ),
    []
  )

  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation title="Feed" alignment="center" />
      <Divider />

      {loading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!loading && notes?.length > 0 && (
        <FlashList estimatedItemSize={190} data={notes} renderItem={renderNote} keyExtractor={keyExtractor} />
      )}

      <Button
        onPress={() => setCreatingNote(true)}
        style={{ position: "absolute", bottom: 16, right: 16, height: 50, width: 50, borderRadius: 50 / 2 }}
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
