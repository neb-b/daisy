import React from "react"
import { View, Pressable } from "react-native"
import { Divider, Text } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { Layout, TopNavigation } from "components"
import { useDispatch } from "store"
import { useDMs, useProfile } from "store/hooks"
import { doPopulateDMsFeed } from "store/notesSlice"

import { Avatar, FlashList } from "components"
import { NoteAuthor } from "components/Note"

export function DMsScreen() {
  const dispatch = useDispatch()
  const dms = useDMs()

  React.useEffect(() => {
    setTimeout(() => {
      dispatch(doPopulateDMsFeed())
    }, 2000)
  }, [])

  const renderNote = React.useCallback(({ item }) => <DMPreview key={item} dm={item} />, [])
  const keyExtractor = React.useCallback((item) => item.id, [])

  const dmPreviews = Object.keys(dms)
    .map((pubkey) => {
      const firstDmForPubkey = dms[pubkey][0]
      if (!firstDmForPubkey) {
        return null
      }

      return firstDmForPubkey
    })
    .filter(Boolean)

  return (
    <Layout>
      <TopNavigation title="Messages" alignment="center" />
      <Divider />

      <FlashList data={dmPreviews} renderItem={renderNote} keyExtractor={keyExtractor} />
    </Layout>
  )
}

const DMPreview = ({ dm }) => {
  const navigation = useNavigation()
  const profile = useProfile(dm.pubkey)
  const profileContent = profile?.content

  const handleNavigate = React.useCallback(() => {
    // @ts-expect-error
    navigation.navigate("DM", { pubkey: dm.pubkey })
  }, [dm.pubkey, navigation])

  return (
    <Pressable onPress={handleNavigate}>
      <View style={{ flexDirection: "row", flex: 1, alignItems: "center", padding: 16, overflow: "hidden" }}>
        <Avatar pubkey={dm.pubkey} marginRight={8} />
        <View style={{ paddingRight: 4 }}>
          <NoteAuthor pubkey={dm.pubkey} profileContent={profileContent} note={dm} />
          <Text numberOfLines={1}>{dm.content}</Text>
        </View>
      </View>
    </Pressable>
  )
}
