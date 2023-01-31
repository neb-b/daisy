import React from "react"
import { View, Pressable, Dimensions } from "react-native"
import { Text, Divider, useTheme, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"
import { nip19 } from "nostr-tools"

import { useNote, useProfile } from "store/hooks"
import { timeSince, fullDateString } from "utils/time"
import { Avatar, NoteContent, NoteActions, Nip05Badge } from "components"

type Props = {
  threadId?: string
  insideThread?: boolean
  id: string
  style?: object
  hideActions?: boolean
  hideAvatar?: boolean
}

export const Note: React.FC<Props> = ({
  id,
  style = {},
  threadId,
  insideThread = false,
  hideActions = false,
  hideAvatar = false,
}) => {
  const navigation = useNavigation()
  const note = useNote(id)
  const profile = useProfile(note?.pubkey)
  const theme = useTheme()
  const profileContent = profile?.content
  const isHighlightedNote = id === threadId

  // @ts-expect-error
  const onNavigate = React.useCallback(() => navigation.push("Thread", { id }), [id])

  if (!note) return null

  return (
    <>
      <View
        style={{
          flexDirection: "column",
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: theme["background-basic-color-1"],
          ...style,
        }}
      >
        {note.repostedBy && <RepostAuthor pubkey={note.repostedBy} />}

        <Pressable onPress={onNavigate}>
          <View style={{ flexDirection: "row", alignItems: isHighlightedNote ? "center" : "flex-start" }}>
            {!hideAvatar && (
              <View style={{ alignItems: "center" }}>
                <Avatar pubkey={note.pubkey} />
                {insideThread && <Divider style={{ width: 1, flex: 1, marginBottom: -24, marginTop: 8 }} />}
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <NoteAuthor
                pubkey={note.pubkey}
                isHighlightedNote={isHighlightedNote}
                note={note}
                profileContent={profileContent}
              />

              {!isHighlightedNote && note.replyingToProfiles?.length > 0 && (
                <ReplyText author={note.pubkey} pubkeysOrProfiles={note.replyingToProfiles} />
              )}

              {!isHighlightedNote && (
                <>
                  <NoteContent note={note} />
                  {!hideActions && <NoteActions id={note.id} />}
                </>
              )}
            </View>
          </View>
          {isHighlightedNote && (
            <View style={{ marginTop: 8, paddingBottom: 8 }}>
              <NoteContent note={note} size="large" />

              <Text appearance="hint" style={{ fontSize: 14, marginTop: 32 }}>
                {fullDateString(note.created_at)}
              </Text>
              <Divider style={{ marginTop: 16, marginBottom: 8 }} />
              {!hideActions && <NoteActions id={note.id} size="large" />}
            </View>
          )}
        </Pressable>
      </View>
      {!hideActions && !insideThread && <Divider />}
    </>
  )
}

function ReplyText({ pubkeysOrProfiles, author }) {
  const renderReply = React.useCallback((pubkeyOrProfile: string | NostrProfile, index: number) => {
    let name
    if (typeof pubkeyOrProfile === "string") {
      name = nip19.npubEncode(pubkeyOrProfile).slice(0, 8)
    } else {
      const profile = pubkeyOrProfile
      const replyToSelf = profile?.pubkey === author

      name = replyToSelf
        ? "self"
        : pubkeyOrProfile?.content?.name || nip19.npubEncode(pubkeyOrProfile?.pubkey).slice(0, 6)
    }

    if (index === 0) {
      return name
    }

    if (index === 1) {
      if (pubkeysOrProfiles.length === 2) {
        return ` & ${name}`
      }
      return `, ${name}`
    }

    if (index === 2) {
      return `, & ${name}`
    }
  }, [])

  return (
    <Text appearance="hint" style={{ fontSize: 12 }}>
      Replying to {pubkeysOrProfiles.map(renderReply).join("")}
    </Text>
  )
}

function RepostAuthor({ pubkey }) {
  const navigation = useNavigation()
  const theme = useTheme()
  const profile = useProfile(pubkey)
  const repostAuthor = profile?.content?.name || profile?.content?.display_name || pubkey.slice(0, 6)

  const handleRepostPress = React.useCallback(() => {
    // @ts-expect-error
    navigation.navigate("Profile", {
      pubkey,
    })
  }, [pubkey])

  return (
    <Pressable onPress={handleRepostPress}>
      <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 24, marginBottom: 8 }}>
        <Icon name="flip-2-outline" style={{ height: 16, width: 16, tintColor: theme["color-basic-600"] }} />
        <Text appearance="hint" style={{ marginLeft: 8 }}>
          {repostAuthor}
        </Text>
        <Nip05Badge pubkey={pubkey} style={{ marginLeft: 2 }} />
        <Text appearance="hint" style={{ marginLeft: 4 }}>
          Boosted
        </Text>
      </View>
    </Pressable>
  )
}

const NoteAuthor = ({ pubkey, profileContent, isHighlightedNote, note }) => {
  return (
    <>
      <View style={{ flexDirection: "row" }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, fontWeight: "bold", maxWidth: Dimensions.get("window").width - 116 }}
        >
          {profileContent?.display_name || profileContent?.name || nip19.npubEncode(note.pubkey).slice(0, 8)}{" "}
          {!isHighlightedNote && profileContent?.name && profileContent?.display_name && (
            <Text
              appearance="hint"
              style={{
                fontSize: 14,
                marginLeft: 4,
              }}
            >
              @{profileContent?.name}
            </Text>
          )}
        </Text>
        <Nip05Badge pubkey={pubkey} style={{ marginLeft: 2 }} />

        {!isHighlightedNote && (
          <Text appearance="hint" style={{ fontSize: 14, marginLeft: 4 }}>
            {timeSince(note.created_at)}
          </Text>
        )}
      </View>

      {isHighlightedNote && profileContent?.name && (
        <Text appearance="hint" style={{ fontSize: 14, marginBottom: 4, flex: 1 }}>
          @{profileContent?.name}
        </Text>
      )}
    </>
  )
}
