import React from "react"
import { View, SafeAreaView, FlatList, Pressable } from "react-native"
import { Divider, TopNavigation, Layout, Icon, TopNavigationAction } from "@ui-kitten/components"

import { Note } from "components/Note"
import { MessageInput } from "components/MessageInput"
import { useThread, useNote } from "store/hooks"
import { doFetchReplies } from "store/notesSlice"
import { useDispatch } from "store"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  const dispatch = useDispatch()
  const thread = useThread(id)
  const note = useNote(id)
  // const replyTags = note?.reply?.tags.reduce((tag, acc) => {
  //   if (tag[0] === "e") {
  //     acc.push(tag[1])
  //   }

  //   return acc
  // }, [])

  // replyTags.push(id)

  // const stringifiedReplyTags = replyTags?.join(",")
  React.useEffect(() => {
    // const splitReplyTags = stringifiedReplyTags?.split(",")
    // console.log("split", splitReplyTags)
    dispatch(doFetchReplies([id]))
  }, [
    id,
    // stringifiedReplyTags
  ])

  const navigateBack = () => {
    navigation.goBack()
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Thread" alignment="center" accessoryLeft={BackAction} />
        <Divider />

        <View style={{ flex: 1 }}>
          <FlatList
            data={thread}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate("Thread", { id: item })}
                style={{
                  paddingLeft: 10,
                  paddingRight: 15,
                  paddingTop: 10,
                }}
              >
                <Note isThread navigation={navigation} key={item} id={item} />
              </Pressable>
            )}
            keyExtractor={(item) => item}
          />
        </View>

        <MessageInput />
      </SafeAreaView>
    </Layout>
  )
}
