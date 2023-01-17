import React from "react"
import { View } from "react-native"
import { Button, Divider, Text, Spinner } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"
import { nip19 } from "nostr-tools"

import { Layout } from "components/Layout"
import { Avatar } from "components/Avatar"
import { Note } from "components/Note"
import { TopNavigation } from "components/TopNavigation"
import { useDispatch } from "store"
import { useUser, useProfile, useContactList, useProfileNotes } from "store/hooks"
import { doFetchProfile, doFetchProfileNotes, doToggleFollow } from "store/notesSlice"

export function ProfileScreen({ route }) {
  const {
    params: { pubkey },
  } = route
  const dispatch = useDispatch()
  const user = useUser()
  const profile = useProfile(pubkey)
  const contactList = useContactList(user?.pubkey)
  const { notes, loading } = useProfileNotes(pubkey)
  const profileContent = profile?.content
  const isFollowing = contactList?.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey)?.length > 0
  const npub = nip19.npubEncode(pubkey)

  React.useEffect(() => {
    dispatch(doFetchProfile(pubkey))
    dispatch(doFetchProfileNotes(pubkey))
  }, [pubkey])

  const handleToggleFollow = () => {
    dispatch(doToggleFollow(pubkey))
  }

  const renderNote = React.useCallback(({ item }) => {
    if (typeof item !== "string") {
      return item
    }

    return <Note id={item} />
  }, [])

  const header = (
    <>
      <View style={{ padding: 16, paddingTop: 0, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Avatar pubkey={pubkey} size={75} />
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
      <TopNavigation alignment="center" hideProfileLink />

      <View style={{ flex: 1 }}>
        <FlashList
          estimatedItemSize={190}
          data={[header, ...(loading ? [] : notes)]}
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
