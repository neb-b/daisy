import React from "react"
import { View, Pressable } from "react-native"
import { Divider, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"
import { nip19 } from "nostr-tools"

import { Note } from "components/Note"
import { MessageInput } from "components/MessageInput"
import { TopNavigation } from "components/TopNavigation"
import { Layout } from "components/Layout"
import { useThread, useNote, useProfile } from "store/hooks"
import { doFetchRepliesInThread, doPublishNote } from "store/notesSlice"
import { useDispatch } from "store"
import { nostrEventKinds } from "core/nostr"

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  const dispatch = useDispatch()
  const { notes, loading } = useThread(id)
  const note = useNote(id)
  const [replyDraft, setReplyDraft] = React.useState("")
  const noteAuthor = useProfile(note?.pubkey)

  React.useEffect(() => {
    dispatch(doFetchRepliesInThread(id))
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
    dispatch(
      doPublishNote({
        kind: nostrEventKinds.note,
        content: text,
        onSuccess: () => setReplyDraft(""),
        replyId: id,
      })
    )
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

      <MessageInput
        onSubmit={handleSubmit}
        value={replyDraft}
        onChangeText={setReplyDraft}
        label={`Reply to ${noteAuthor?.content?.name || nip19(nip19.npubEncode(note?.pubkey))}`}
      />
    </Layout>
  )
}
