import React from "react"
import { View } from "react-native"
import { Divider, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"
import { useFocusEffect } from "@react-navigation/native"

import { useDispatch } from "store"
import { doFetchNotifications } from "store/notesSlice"
import { useFeed } from "store/hooks"
import { Layout, Note, TopNavigation } from "components"

export function NotificationsScreen() {
  const dispatch = useDispatch()
  const { loading, notes } = useFeed("notifications")
  const showLoading = loading && notes.length === 0

  useFocusEffect(
    React.useCallback(() => {
      dispatch(doFetchNotifications())
    }, [])
  )

  const renderNote = React.useCallback(({ item }) => <Note key={item} id={item} />, [])
  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation title="Notifications" alignment="center" />
      <Divider />

      {showLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!showLoading && notes?.length > 0 && (
        <FlashList estimatedItemSize={190} data={notes} renderItem={renderNote} keyExtractor={keyExtractor} />
      )}
    </Layout>
  )
}
