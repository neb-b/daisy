import React from "react"
import { View } from "react-native"
import {
  Input,
  Button,
  Divider,
  TopNavigation,
  TopNavigationAction,
  Layout,
  Icon,
  Text,
} from "@ui-kitten/components"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "state/store"
import { publishNote } from "core/nostr"

type Props = {
  closeModal: () => void
}

export const NewNote: React.FC<Props> = ({ closeModal }) => {
  const dispatch = useDispatch()
  const { settings: settingsState } = useSelector((state: RootState) => state)
  const [content, setContent] = React.useState("test publish from daisy 🤙")

  const RightAccessory = () => (
    <Button appearance="ghost" onPress={closeModal}>
      <Text>Cancel</Text>
    </Button>
  )

  const handlePublish = () => {
    publishNote(settingsState.user, {
      content,
    })
  }

  return (
    <Layout style={{ flex: 1 }}>
      <View>
        <TopNavigation title="New Note" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        <View style={{ padding: 10 }}>
          <Text style={{ marginBottom: 5 }}>Message</Text>
          <Input
            placeholder="hello world..."
            value={content}
            onChangeText={(newContent) => setContent(newContent)}
          />
          <Button style={{ marginTop: 16, borderRadius: 10 }} onPress={handlePublish}>
            Add
          </Button>
        </View>
      </View>
    </Layout>
  )
}
