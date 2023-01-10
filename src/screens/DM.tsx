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

import type { RootState } from "store"
// import { updateNotesAndProfiles, updateFeedByChannelId } from "store/notesSlice"
import { MessageInput } from "components/MessageInput"
import { Avatar } from "components/Avatar"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const DMScreen = ({ navigation }) => {
  return null
  //   const dispatch = useDispatch()
  //   const notesState = useSelector((state: RootState) => state.notes)
  //   const { notesById, feedByChannelId, loading } = notesState

  // const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={() => navigation.goBack()} />
  // const ProfileAction = () => (
  //   <TopNavigationAction
  //     icon={(props) => <Avatar {...props} picture={user.picture} pubkey={user.pubkey} />}
  //     onPress={() => navigation.navigate("Profile", { pubkey: user.pubkey })}
  //   />
  // )

  // return (
  //   <Layout style={{ flex: 1 }}>
  //     <SafeAreaView style={{ flex: 1 }}>
  //       <TopNavigation
  //         title={user.name || user.pubkey.slice(0, 8)}
  //         alignment="center"
  //         accessoryLeft={BackAction}
  //         accessoryRight={ProfileAction}
  //       />

  //       <View style={{ flex: 1 }}>
  //         <FlatList
  //           inverted
  //           data={messages}
  //           renderItem={({ item: dm }) => {
  //             const isMine = dm.author.id === 1

  //             return (
  //               <View
  //                 style={{
  //                   paddingLeft: 10,
  //                   paddingRight: 15,
  //                   paddingTop: 5,
  //                   paddingBottom: 5,
  //                 }}
  //               >
  //                 <View
  //                   style={{
  //                     marginTop: 10,
  //                     padding: 10,
  //                     borderRadius: 10,
  //                     backgroundColor: isMine ? "#3E517A" : "#11151C",
  //                     alignSelf: isMine ? "flex-end" : "flex-start",
  //                   }}
  //                 >
  //                   <Text>{dm.content.slice(0, Math.floor(Math.random() * 100) + 10)}</Text>
  //                 </View>
  //               </View>
  //             )
  //           }}
  //           keyExtractor={(message) => message.id}
  //           contentContainerStyle={{ flexDirection: "column-reverse" }}
  //         />
  //       </View>
  //       <MessageInput />
  //     </SafeAreaView>
  //   </Layout>
  // )
}
