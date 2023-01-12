import React from "react"
import { View } from "react-native"
import { Input, Button, Divider, TopNavigation, TopNavigationAction, Icon, Text } from "@ui-kitten/components"

import { Layout } from "components/Layout"
import { Avatar } from "components/Avatar"
import { useDispatch } from "store"
import { useUser, useProfile, useContactList } from "store/hooks"
import { doToggleFollow } from "store/notesSlice"

const BackIcon = (props) => <Icon {...props} name="arrow-back" />

export const ProfileScreen = ({ navigation, route }) => {
  const {
    params: { pubkey },
  } = route
  const dispatch = useDispatch()
  const user = useUser()
  const profile = useProfile(pubkey)
  const contactList = useContactList(user?.pubkey)
  const profileContent = profile?.content

  const isFollowing = contactList?.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey)?.length > 0

  const navigateBack = () => {
    navigation.goBack()
  }

  const handleToggleFollow = () => {
    const newFollowState = !isFollowing
    dispatch(doToggleFollow(pubkey, newFollowState))
  }

  const BackAction = () => <TopNavigationAction icon={BackIcon} onPress={navigateBack} />

  return (
    <Layout>
      <TopNavigation title="Profile" alignment="center" accessoryLeft={BackAction} />
      <Divider />
      <View style={{ padding: 20 }}>
        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
          <Avatar picture={profileContent?.picture} pubkey={pubkey} size={100} />
          <Button
            appearance={isFollowing ? "outline" : "primary"}
            style={{ marginBottom: "auto" }}
            onPress={handleToggleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        </View>
        {profileContent?.name && (
          <Text style={{ fontWeight: "bold", fontSize: 32, marginTop: 24 }}>{profileContent.name}</Text>
        )}
        {profileContent?.about && <Text style={{ marginTop: 12, fontSize: 16 }}>{profileContent.about}</Text>}

        <Text style={{ marginTop: 24 }}>pubkey: {pubkey}</Text>
      </View>
    </Layout>
  )
}
