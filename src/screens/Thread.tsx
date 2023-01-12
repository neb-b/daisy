import React from "react"
import { View, SafeAreaView, Pressable } from "react-native"
import { Divider, TopNavigation, Layout, Icon, TopNavigationAction, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { Note } from "components/Note"
import { MessageInput } from "components/MessageInput"
import { useThread } from "store/hooks"
import { doFetchReplies } from "store/notesSlice"
import { useDispatch } from "store"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ThreadScreen = ({ navigation, route }) => {
  const {
    params: { id },
  } = route
  const dispatch = useDispatch()
  const { notes, loading } = useThread(id)

  React.useEffect(() => {
    dispatch(doFetchReplies([id]))
  }, [id])

  const navigateBack = () => {
    navigation.goBack()
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  const renderNote = React.useCallback(
    ({ item }) => (
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
    ),
    []
  )

  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavigation title="Thread" alignment="center" accessoryLeft={BackAction} />
        <Divider />

        {loading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Spinner />
          </View>
        )}

        {!loading && (
          <View style={{ flex: 1 }}>
            <FlashList
              estimatedItemSize={190}
              data={notes}
              renderItem={renderNote}
              keyExtractor={keyExtractor}
            />
          </View>
        )}

        <MessageInput />
      </SafeAreaView>
    </Layout>
  )
}
