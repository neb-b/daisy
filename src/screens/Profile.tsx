import React from "react"
import { View, Pressable } from "react-native"
import {
  Button,
  Divider,
  TopNavigation,
  TopNavigationAction,
  Icon,
  Text,
  Spinner,
} from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"

import { convertHexPubkey } from "core/nostr"
import { Layout } from "components/Layout"
import { Avatar } from "components/Avatar"
import { Note } from "components/Note"
import { useDispatch } from "store"
import { useUser, useProfile, useContactList, useFeed } from "store/hooks"
import { doFetchProfile, doToggleFollow } from "store/notesSlice"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ProfileScreen = ({ navigation, route }) => {
  const {
    params: { pubkey },
  } = route
  const dispatch = useDispatch()
  const user = useUser()
  const profile = useProfile(pubkey)
  const contactList = useContactList(user?.pubkey)
  const { notes, loading } = useFeed(pubkey)
  const hasProfile = !!profile
  const profileContent = profile?.content
  const isFollowing = contactList?.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey)?.length > 0
  const npub = convertHexPubkey(pubkey)

  React.useEffect(() => {
    dispatch(doFetchProfile(pubkey))
  }, [hasProfile, pubkey])

  const handleToggleFollow = () => {
    const newFollowState = !isFollowing
    dispatch(doToggleFollow(pubkey, newFollowState))
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={() => navigation.goBack()} />

  const renderNote = React.useCallback(({ item }) => {
    if (typeof item !== "string") {
      return item
    }

    return (
      <Pressable onPress={() => navigation.navigate("Thread", { id: item })} style={{}}>
        <Note navigation={navigation} id={item} />
      </Pressable>
    )
  }, [])

  const header = (
    <>
      <View style={{ padding: 16, paddingTop: 0, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Avatar picture={profileContent?.picture} pubkey={pubkey} size={75} />
          <Button
            appearance={isFollowing ? "outline" : "primary"}
            style={{ marginBottom: "auto" }}
            onPress={handleToggleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        </View>
        {profileContent?.name && (
          <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 16 }}>{profileContent.name}</Text>
        )}
        <Text style={{ fontSize: 16, marginTop: 4 }}>{npub.slice(0, 24)}...</Text>
        {profileContent?.about && (
          <Text style={{ marginTop: 8, fontSize: 16, lineHeight: 16 }}>{profileContent.about}</Text>
        )}
      </View>
      <Divider />
    </>
  )

  const keyExtractor = React.useCallback((item) => (typeof item !== "string" ? "header" : item), [])

  return (
    <Layout>
      <TopNavigation alignment="center" accessoryLeft={BackAction} />

      <View style={{ flex: 1 }}>
        <FlashList
          estimatedItemSize={190}
          data={[header, ...notes]}
          renderItem={renderNote}
          keyExtractor={keyExtractor}
        />

        {loading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Spinner />
          </View>
        )}
      </View>
    </Layout>
  )
}
