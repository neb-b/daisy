import React from "react"
import { View, SafeAreaView, Modal, Pressable, FlatList } from "react-native"
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
import { NewChat } from "components/NewChat"
import { Avatar } from "components/Avatar"

export const ChatsScreen = ({ navigation }) => {
  const [creatingNewChat, setCreatingNewChat] = React.useState(false)

  const RightAccessory = () => (
    <TopNavigationAction
      icon={(props) => <Icon {...props} name="plus-circle-outline" />}
      onPress={() => setCreatingNewChat(true)}
    />
  )
  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Chats" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        {creatingNewChat && (
          <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
              setCreatingNewChat(false)
            }}
          >
            <NewChat closeModal={() => setCreatingNewChat(false)} />
          </Modal>
        )}
      </SafeAreaView>
    </Layout>
  )
}
