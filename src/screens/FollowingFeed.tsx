import React from "react"
import { Modal, View } from "react-native"
import { Button, Divider, Icon, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { useDispatch } from "store"
import { doPopulateFollowingFeed } from "store/notesSlice"
import { useContactList, useFeed, useUser } from "store/hooks"
import { Layout, Note, NoteCreate, TopNavigation } from "components"

export function FollowingFeedScreen() {
  const dispatch = useDispatch()
  const [creatingNote, setCreatingNote] = React.useState(false)
  const { loading, notes } = useFeed("following")
  const user = useUser()

  const contactList = useContactList(user.pubkey)
  const hasContactList = contactList?.tags?.length > 0
  const showLoading = loading && notes.length === 0

  React.useEffect(() => {
    if (hasContactList) {
      dispatch(doPopulateFollowingFeed())
    }
  }, [hasContactList])

  const renderNote = React.useCallback(({ item }) => <Note key={item} id={item} />, [])
  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation title="Feed" alignment="center" />
      <Divider />

      {showLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!showLoading && notes?.length > 0 && (
        <FlashList estimatedItemSize={190} data={notes} renderItem={renderNote} keyExtractor={keyExtractor} />
      )}

      <Button
        onPress={() => setCreatingNote(true)}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          height: 50,
          width: 50,
          borderRadius: 50 / 2,
        }}
        accessoryLeft={({ style }: { style: object }) => {
          return (
            <Icon
              name="plus-outline"
              style={{
                ...style,
              }}
            />
          )
        }}
      />

      {creatingNote && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setCreatingNote(false)
          }}
        >
          <NoteCreate closeModal={() => setCreatingNote(false)} />
        </Modal>
      )}
    </Layout>
  )
}
