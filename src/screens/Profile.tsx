import React from "react"
import { View, ImageBackground, Dimensions } from "react-native"
import { Button, Divider, Text, useTheme } from "@ui-kitten/components"
import { nip19 } from "nostr-tools"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"

import { Layout, Avatar, TopNavigation, Note, Spinner, Link, FlashList } from "components"
import { useDispatch } from "store"
import { useUser, useProfile, useContactList, useProfileNotes } from "store/hooks"
import { doFetchProfile, doPopulateProfileFeed, doToggleFollow } from "store/notesSlice"
import { noteOrUrlRegex, isUrl } from "utils/note"

const WINDOW_WIDTH = Dimensions.get("window").width

export function ProfileScreen({ route }) {
  const {
    params: { pubkey },
  } = route
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const theme = useTheme()
  const user = useUser()
  const profile = useProfile(pubkey)
  const contactList = useContactList(user?.pubkey)
  const { notes, loading } = useProfileNotes(pubkey)
  const [scroll, setScroll] = React.useState(0)
  const profileContent = profile?.content
  const isFollowing = contactList?.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey)?.length > 0
  const npub = nip19.npubEncode(pubkey)
  const isMe = user?.pubkey === pubkey
  const lastFourOfPubkey = pubkey?.slice(-4)
  const bannerUri = `https://media.nostr.band/thumbs/${lastFourOfPubkey}/${pubkey}-banner-600`

  React.useEffect(() => {
    dispatch(doFetchProfile(pubkey))
    dispatch(doPopulateProfileFeed(pubkey))
  }, [pubkey])

  const handleToggleFollow = React.useCallback(() => {
    dispatch(doToggleFollow(pubkey))
  }, [pubkey])

  const renderNote = React.useCallback(({ item }) => {
    if (typeof item !== "string") {
      return item
    }

    return <Note id={item} />
  }, [])

  const keyExtractor = React.useCallback((item) => (typeof item !== "string" ? "header" : item), [])

  const handleScroll = ({ nativeEvent }) => {
    const scrollY = nativeEvent.contentOffset.y
    setScroll(scrollY)
  }

  let avatarSize = 70
  if (scroll > 0) {
    avatarSize = avatarSize - scroll

    avatarSize = Math.max(45, avatarSize)
  }

  const bannerSize = 130
  const blurTopNavigation = scroll >= bannerSize - 48

  const handleProfileEditPress = React.useCallback(() => {
    // @ts-expect-error
    navigation.navigate("ProfileEdit")
  }, [])

  const header = (
    <>
      <View
        style={{
          padding: 16,
          paddingTop: 4,
          marginTop: bannerSize - 48,
          flex: 1,
          backgroundColor: theme["background-basic-color-1"],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              marginTop: -1 * (avatarSize - 45),
              borderColor: theme["color-basic-400"],
              backgroundColor: theme["color-basic-400"],
              borderWidth: 3,
              height: avatarSize + 6,
              width: avatarSize + 6,
              borderRadius: (avatarSize + 6) / 2,
            }}
          >
            <Avatar pubkey={pubkey} size={avatarSize} />
          </View>
          {isMe ? (
            <Button
              appearance="outline"
              onPress={handleProfileEditPress}
              style={{
                backgroundColor: theme["background-color-basic-1"],
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              appearance={isFollowing ? "outline" : "primary"}
              style={{
                marginBottom: "auto",
                backgroundColor: isFollowing ? theme["background-color-basic-1"] : undefined,
              }}
              onPress={handleToggleFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
        </View>
        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
          {profileContent?.display_name && (
            <Text style={{ fontWeight: "bold", fontSize: 18, marginRight: 8 }}>
              {profileContent.display_name}
            </Text>
          )}
          {profileContent?.name && (
            <Text
              appearance={profileContent.display_name ? "hint" : undefined}
              style={{ fontWeight: profileContent?.display_name ? undefined : "bold", fontSize: 16 }}
            >
              @{profileContent.name}
            </Text>
          )}
        </View>

        <Text appearance="hint" style={{ fontSize: 16, marginTop: 4 }}>
          {npub.slice(0, 24)}...
        </Text>

        {profileContent?.about && (
          <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap" }}>
            {profileContent.about.split(noteOrUrlRegex).map((text, i) => {
              if (typeof text === "undefined") {
                return <React.Fragment key={i} />
              }

              if (text === "\n") {
                // Force full width line break
                // This is weird because these text pieces are flex items inside a flex wrap container
                return <View key={i} style={{ width: WINDOW_WIDTH }} />
              }

              if (isUrl(text)) {
                return <Link key={text + i} label={text} src={text} />
              }

              return (
                <Text
                  key={i}
                  style={{
                    fontSize: 16,
                    flex: 0,
                  }}
                >
                  {text}
                </Text>
              )
            })}
          </View>
        )}
      </View>
      <Divider />
    </>
  )

  return (
    <Layout>
      <View style={{ position: "absolute", flex: 1, height: bannerSize, width: "100%" }}>
        <ImageBackground
          source={profileContent?.banner ? { uri: bannerUri } : require("../../assets/banner.png")}
          style={{ width: "100%", height: bannerSize }}
        >
          <LinearGradient
            colors={[theme["background-basic-color-1"], "transparent"]}
            style={{ height: bannerSize, width: "100%" }}
          ></LinearGradient>
        </ImageBackground>
      </View>
      <TopNavigation
        alignment="center"
        hideProfileLink
        style={{
          backgroundColor: blurTopNavigation ? "rgba(0,0,0,0.6)" : "transparent",
        }}
      />

      <View style={{ flex: 1, position: "relative", zIndex: 3 }}>
        <FlashList
          data={[header, ...(loading ? [] : notes)]}
          keyExtractor={keyExtractor}
          onScroll={handleScroll}
          renderItem={renderNote}
          scrollEnabled={notes.length > 0}
        />

        {loading && <Spinner />}
      </View>
    </Layout>
  )
}
