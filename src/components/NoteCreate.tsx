import React from "react"
import { View, ScrollView } from "react-native"
import { Input, Button, Divider, TopNavigation, Text } from "@ui-kitten/components"

import { Layout, Note } from "components"
import { useDispatch } from "store"
import { doPublishNote } from "store/notesSlice"
import { useNote } from "store/hooks"
import { nostrEventKinds } from "core/nostr"

type Props = {
  closeModal: () => void
  id?: string
}

export const NoteCreate: React.FC<Props> = ({ closeModal, id }) => {
  const dispatch = useDispatch()
  const [content, setContent] = React.useState("")
  const note = useNote(id)

  function RightAccessory() {
    return (
      <Button appearance="ghost" onPress={closeModal}>
        <Text>Cancel</Text>
      </Button>
    )
  }

  const handlePublish = () => {
    dispatch(doPublishNote({ content, kind: nostrEventKinds.note, replyId: id, onSuccess: closeModal }))
  }

  return (
    <Layout>
      <View style={{ flex: 1 }}>
        <TopNavigation title="New Note" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {note && <Note id={id} isSimple />}
          <View style={{ flex: 1, paddingRight: 16, paddingLeft: 16 }}>
            <Text style={{ marginBottom: 8, marginTop: 16 }}>Reply</Text>
            <Input
              autoCapitalize="none"
              multiline
              placeholder="hello world..."
              value={content}
              onChangeText={(newContent) => setContent(newContent)}
            />
            <Button style={{ marginTop: 16, borderRadius: 10 }} onPress={handlePublish}>
              Publish
            </Button>
          </View>
        </ScrollView>
      </View>
    </Layout>
  )
}
