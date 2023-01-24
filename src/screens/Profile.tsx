import React from "react"
import { View, ImageBackground, Dimensions } from "react-native"
import { Button, Divider, Text, useTheme } from "@ui-kitten/components"
import { FlashList } from "@shopify/flash-list"
import { nip19 } from "nostr-tools"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"

import { Layout, Avatar, TopNavigation, Note, Spinner, Link } from "components"
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
  const [applyNavigationBlur, setApplyNavigationBlur] = React.useState(false)
  const profileContent = profile?.content
  const isFollowing = contactList?.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey)?.length > 0
  const npub = nip19.npubEncode(pubkey)
  const isMe = user?.pubkey === pubkey
  const bannerSize = 130

  React.useEffect(() => {
    dispatch(doFetchProfile(pubkey))
    dispatch(doPopulateProfileFeed(pubkey))
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
              marginTop: -48,
              borderWidth: 3,
              borderColor: theme["color-basic-400"],
              backgroundColor: theme["color-basic-400"],
              height: 96,
              width: 96,
              borderRadius: 96 / 2,
            }}
          >
            <Avatar pubkey={pubkey} size={90} />
          </View>
          {isMe ? (
            <Button
              appearance="outline"
              // @ts-expect-error
              onPress={() => navigation.navigate("ProfileEdit")}
              style={{
                backgroundColor: theme["background-color-basic-1"],
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              appearance={isFollowing ? "outline" : "primary"}
              style={{ marginBottom: "auto" }}
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

  const keyExtractor = React.useCallback((item) => (typeof item !== "string" ? "header" : item), [])

  const handleScroll = ({ nativeEvent }) => {
    const scrollY = nativeEvent.contentOffset.y

    if (scrollY >= bannerSize - 16) {
      setApplyNavigationBlur(true)
    } else {
      setApplyNavigationBlur(false)
    }
  }

  return (
    <Layout>
      <View style={{ position: "absolute", flex: 1, height: bannerSize, width: "100%" }}>
        <ImageBackground
          source={require("../../assets/banner.png")}
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
          backgroundColor: applyNavigationBlur ? "red" : "transparent",
        }}
      />

      <View style={{ flex: 1, position: "relative", zIndex: 3 }}>
        <FlashList
          removeClippedSubviews={true}
          estimatedItemSize={190}
          data={[header, ...(loading ? [] : notes)]}
          renderItem={renderNote}
          keyExtractor={keyExtractor}
          onScroll={handleScroll}
        />

        {loading && <Spinner />}
      </View>
    </Layout>
  )
}
