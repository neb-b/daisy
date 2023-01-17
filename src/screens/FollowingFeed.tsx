import React from "react"
import { Modal, AppState, View } from "react-native"
import { Button, Divider, Icon, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { useDispatch } from "store"
import { doPopulateFollowingFeed, unsubscribeFromFollowingFeed } from "store/notesSlice"
import { useFeed } from "store/hooks"
import { Layout } from "components/Layout"
import { Note } from "components/Note"
import { NoteCreate } from "components/NoteCreate"
import { TopNavigation } from "components/TopNavigation"

type MyAppState = "active" | "background" | "inactive"

export function FollowingFeedScreen() {
  const dispatch = useDispatch()
  const [creatingNote, setCreatingNote] = React.useState(false)
  const { loading, notes } = useFeed("following")
  const appState = React.useRef(AppState.currentState)
  const [appVisible, setAppVisible] = React.useState(appState.current === "active")

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: MyAppState) => {
      if (!appVisible && nextAppState === "active") {
        // TODO: only fetch new notes instead of repopulating the whole feed
        // will need to detect if it was inactive or background I think
        dispatch(doPopulateFollowingFeed())
      } else if (appVisible && (nextAppState === "inactive" || nextAppState === "background")) {
        dispatch(unsubscribeFromFollowingFeed())
      }

      appState.current = nextAppState
      setAppVisible(appState.current === "active")
    })

    return () => {
      subscription.remove()
    }
  }, [appVisible, setAppVisible, dispatch])

  React.useEffect(() => {
    // dispatch(doPopulateFollowingFeed())
  }, [])

  const renderNote = React.useCallback(({ item }) => <Note key={item} id={item} />, [])
  const keyExtractor = React.useCallback((item) => item, [])

  return (
    <Layout>
      <TopNavigation title="Feed" alignment="center" />
      <Divider />

      {loading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </View>
      )}

      {!loading && notes?.length > 0 && (
        <FlashList estimatedItemSize={190} data={notes} renderItem={renderNote} keyExtractor={keyExtractor} />
      )}

      <Button
        onPress={() => setCreatingNote(true)}
        style={{ position: "absolute", bottom: 16, right: 16, height: 50, width: 50, borderRadius: 50 / 2 }}
        accessoryLeft={(props) => <Icon name="plus-outline" {...props} />}
      />

      {creatingNote && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setCreatingNote(false)
          }}
        >
          <NoteCreate closeModal={() => setCreatingNote(false)} />
        </Modal>
      )}
    </Layout>
  )
}
