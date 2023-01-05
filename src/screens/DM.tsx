import React from "react"
import { StyleSheet, View, SafeAreaView, FlatList } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import {
  Input,
  Button,
  Divider,
  TopNavigation,
  Layout,
  Icon,
  Text,
  TopNavigationAction,
} from "@ui-kitten/components"
import { messages } from "redux/test-messages"

import type { RootState } from "redux/store"
import { updateNotesAndProfiles, updateFeedByChannelId } from "redux/notesSlice"
import { getEventsForChannel } from "core/nostr"
import { MessageInput } from "components/MessageInput"
import { Avatar } from "components/Avatar"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

const user = {
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
}

export const DMScreen = ({ navigation }) => {
  //   const dispatch = useDispatch()
  //   const notesState = useSelector((state: RootState) => state.notes)
  //   const { notesById, feedByChannelId, loading } = notesState

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={() => navigation.goBack()} />
  const ProfileAction = () => (
    <TopNavigationAction
      icon={(props) => <Avatar {...props} picture={user.picture} pubkey={user.pubkey} />}
      onPress={() => navigation.navigate("Profile", { pubkey: user.pubkey })}
    />
  )

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation
          title={user.name || user.pubkey.slice(0, 8)}
          alignment="center"
          accessoryLeft={BackAction}
          accessoryRight={ProfileAction}
        />

        <View style={{ flex: 1 }}>
          <FlatList
            inverted
            data={messages}
            renderItem={({ item: dm }) => {
              const isMine = dm.author.id === 1

              return (
                <View
                  style={{
                    paddingLeft: 10,
                    paddingRight: 15,
                    paddingTop: 5,
                    paddingBottom: 5,
                  }}
                >
                  <View
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: isMine ? "#3E517A" : "#11151C",
                      alignSelf: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    <Text>{dm.content.slice(0, Math.floor(Math.random() * 100) + 10)}</Text>
                  </View>
                </View>
              )
            }}
            keyExtractor={(message) => message.id}
            contentContainerStyle={{ flexDirection: "column-reverse" }}
          />
        </View>
        <MessageInput />
      </SafeAreaView>
    </Layout>
  )
}
