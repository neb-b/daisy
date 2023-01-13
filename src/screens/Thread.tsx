import React from "react"
import { View, Pressable } from "react-native"
import { Divider, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { Note } from "components/Note"
import { MessageInput } from "components/MessageInput"
import { TopNavigation } from "components/TopNavigation"
import { Layout } from "components/Layout"
import { useThread } from "store/hooks"
import { doFetchReplies, doPublishNote } from "store/notesSlice"
import { useDispatch } from "store"

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  const dispatch = useDispatch()
  const { notes, loading } = useThread(id)
  const [replyDraft, setReplyDraft] = React.useState("")

  React.useEffect(() => {
    dispatch(doFetchReplies([id]))
  }, [id])

  const renderNote = React.useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => navigation.navigate("Thread", { id: item })}
        style={{
          paddingLeft: 10,
          paddingRight: 15,
          paddingTop: 10,
        }}
      >
        <Note isThread key={item} id={item} />
      </Pressable>
    ),
    []
  )

  const keyExtractor = React.useCallback((item) => item, [])

  const handleSubmit = (text: string) => {
    dispatch(doPublishNote(text, () => setReplyDraft(""), id))
  }

  return (
    <Layout>
      <TopNavigation hideProfileLink title="Thread" alignment="center" />
      <Divider />

      {loading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!loading && (
        <View style={{ flex: 1, marginBottom: 16 }}>
          <FlashList
            estimatedItemSize={190}
            data={notes}
            renderItem={renderNote}
            keyExtractor={keyExtractor}
          />
        </View>
      )}

      <MessageInput onSubmit={handleSubmit} value={replyDraft} onChangeText={setReplyDraft} />
    </Layout>
  )
}
