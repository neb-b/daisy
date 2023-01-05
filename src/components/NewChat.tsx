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

type Props = {
  closeModal: () => void
}

export const NewChat: React.FC<Props> = ({ closeModal }) => {
  const RightAccessory = () => (
    <Button appearance="ghost" onPress={closeModal}>
      <Text>Cancel</Text>
    </Button>
  )

  return (
    <Layout style={{ flex: 1 }}>
      <View>
        <TopNavigation title="New Chat" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        <View style={{ padding: 10 }}>
          <Text style={{ marginBottom: 5 }}>Pubkey or Channel ID</Text>
          <Input placeholder="90cd76065485666..." />
          <Button style={{ marginTop: 16, borderRadius: 10 }}>Add</Button>
        </View>
      </View>
    </Layout>
  )
}
