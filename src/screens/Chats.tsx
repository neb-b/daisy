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

const CHATS = [
  {
    id: "xxxxxx",
    name: "Nostr",
    picture: "",
    lastMessage: "This was the last message...",
  },
  {
    id: "a5907c0345361b22d235d309b2b95e0bbae8fb697266ef5d8c36929fd8b5fcc5",
    pubkey: "734a6ebf69189f6bd01a673c236c9c62620266f0cb18916d133892c26433bb2a",
    created_at: 1671602757,
    kind: 0,
    tags: [],
    sig: "588395768cd3c31ef16bc0b9cce077719875d85407bb16523f2bdf11310ba1fefd6aa378637c2022531ebf3707da1ecf85c140648b0550e4323a3f4f731bdac5",
    lud06: "LNURL1DP68GURN8GHJ7MR9VAJKUEPWD3HXY6T5WVHXXMMD9AKXUATJD3CZ7CTSDYHHVVF0D3H82UNV9UENQVP4XVEWV755",
    name: "DuckWillow",
    about: "Water, Land, Bitcoin. ",
    picture: "https://logodownload.org/wp-content/uploads/2017/06/bitcoin-logo-0-1-2048x2048.png",
  },
]

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
        <FlatList
          data={CHATS}
          keyExtractor={(item) => item.id}
          renderItem={({ item: chat }) => {
            const isDM = chat.kind === 0
            return (
              <>
                <Pressable
                  key={chat.id}
                  onPress={() => navigation.navigate(isDM ? "DM" : "Channel")}
                  style={{ padding: 10, flexDirection: "row", alignItems: "center" }}
                >
                  <View>
                    {chat?.picture ? (
                      <Avatar size={60} picture={chat?.picture} pubkey={chat.pubkey} />
                    ) : (
                      <View
                        style={{
                          height: 60,
                          width: 60,
                          borderRadius: 60 / 2,
                          backgroundColor: "#ffecb3",
                          padding: 10,
                        }}
                      >
                        <Icon name="cube-outline" fill="#FFBF00" />
                      </View>
                    )}
                  </View>

                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontWeight: "bold" }}>{chat.name}</Text>
                    {chat.lastMessage && <Text style={{}}>{chat.lastMessage}</Text>}
                  </View>
                </Pressable>
                <Divider />
              </>
            )
          }}
          keyExtractor={(message) => message.id}
          contentContainerStyle={{ flexDirection: "column-reverse" }}
        />

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
