import React from "react"
import { View, SafeAreaView, FlatList, Pressable } from "react-native"
import { Divider, TopNavigation, Layout, Icon, TopNavigationAction } from "@ui-kitten/components"

import { Note } from "components/Note"
import { MessageInput } from "components/MessageInput"
import { useThread } from "store/hooks"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  const threadIds = useThread(id)

  const thread = [...threadIds, id]

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
                <Note hideReply navigation={navigation} key={item} id={item} />
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
