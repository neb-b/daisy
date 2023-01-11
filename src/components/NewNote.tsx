import React from "react"
import { View, ScrollView } from "react-native"
import { Input, Button, Divider, TopNavigation, Text } from "@ui-kitten/components"

import { Layout } from "components/Layout"
import { useDispatch } from "store"
import { doPublishNote } from "store/notesSlice"

type Props = {
  closeModal: () => void
}

export const NewNote: React.FC<Props> = ({ closeModal }) => {
  const dispatch = useDispatch()
  const [content, setContent] = React.useState("")

  const RightAccessory = () => (
    <Button appearance="ghost" onPress={closeModal}>
      <Text>Cancel</Text>
    </Button>
  )

  const handlePublish = () => {
    dispatch(doPublishNote(content, closeModal))
  }

  return (
    <Layout>
      <View style={{ flex: 1 }}>
        <TopNavigation title="New Note" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, padding: 10 }}>
            <Text style={{ marginBottom: 5 }}>Message</Text>
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
