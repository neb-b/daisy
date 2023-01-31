import React from "react"
import { View } from "react-native"
import { Divider, Spinner } from "@ui-kitten/components"
import { useFocusEffect } from "@react-navigation/native"

import { Note, Layout, TopNavigation, FlashList } from "components"
import { useThread } from "store/hooks"
import { doSubscribeToThread, doUnsubscribeFromRelaysForId } from "store/subscriptionsSlice"
import { useDispatch } from "store"

export function ThreadScreen({ route }) {
  const {
    params: { id },
  } = route
  const dispatch = useDispatch()
  const { notes, loading } = useThread(id)
  const indexOfHighlightedNote = notes.indexOf(id)

  useFocusEffect(
    React.useCallback(() => {
      dispatch(doSubscribeToThread(id))

      return () => dispatch(doUnsubscribeFromRelaysForId(id))
    }, [id])
  )

  const renderNote = React.useCallback(
    ({ item, index }) => (
      <Note threadId={id} key={item} id={item} insideThread={index < indexOfHighlightedNote} />
    ),
    [id, indexOfHighlightedNote]
  )

  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation hideProfileLink title="Thread" alignment="center" />
      <Divider />

      {loading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!loading && (
        <View style={{ flex: 1, marginBottom: 16 }}>
          <FlashList
            estimatedItemSize={190}
            data={notes}
            renderItem={renderNote}
            keyExtractor={keyExtractor}
          />
        </View>
      )}
    </Layout>
  )
}
