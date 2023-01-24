import React from "react"
import { View } from "react-native"
import { Divider } from "@ui-kitten/components"
import { useFocusEffect } from "@react-navigation/native"

import { useDispatch } from "store"
import { doPopulateNotificationsFeed } from "store/notesSlice"
import { useFeed } from "store/hooks"
import { Layout, Note, TopNavigation, Spinner, FlashList } from "components"

export function NotificationsScreen() {
  const dispatch = useDispatch()
  const { loading, notes } = useFeed("notifications")

  useFocusEffect(
    React.useCallback(() => {
      dispatch(doPopulateNotificationsFeed())
    }, [])
  )

  const renderNote = React.useCallback(({ item }) => <Note key={item} id={item} />, [])
  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation title="Notifications" alignment="center" />
      <Divider />

      <View style={{ flex: 1 }}>
        {loading && <Spinner />}

        {notes?.length > 0 && <FlashList data={notes} renderItem={renderNote} keyExtractor={keyExtractor} />}
      </View>
    </Layout>
  )
}
