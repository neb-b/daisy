import React from "react"
import { View, Pressable } from "react-native"
import { Text, Divider, useTheme, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"
import { nip19 } from "nostr-tools"

import { useNote, useProfile } from "store/hooks"
import { timeSince, fullDateString } from "utils/time"
import { Avatar, NoteContent, NoteActions } from "components"

type Props = {
  threadId?: string
  insideThread?: boolean
  id: string
  style?: object
  hideActions?: boolean
}

export const Note: React.FC<Props> = ({
  id,
  style = {},
  threadId,
  insideThread = false,
  hideActions = false,
}) => {
  const navigation = useNavigation()
  const note = useNote(id)
  const profile = useProfile(note?.pubkey)
  const profileContent = profile?.content
  const isHighlightedNote = id === threadId

  if (!note) return null

  return (
    <>
      {/* @ts-expect-error */}
      <Pressable onPress={() => navigation.push("Thread", { id })}>
        <View
          style={{
            flexDirection: "column",
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
            ...style,
          }}
        >
          {note.repostedBy && <RepostAuthor pubkey={note.repostedBy} />}

          <View style={{ flexDirection: "row", alignItems: isHighlightedNote ? "center" : "flex-start" }}>
            <View style={{ alignItems: "center" }}>
              <Avatar pubkey={note.pubkey} />
              {insideThread && <Divider style={{ width: 1, flex: 1, marginBottom: -24, marginTop: 8 }} />}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                  {profileContent?.display_name || profileContent?.name || note.pubkey.slice(0, 6)}
                </Text>

                {!isHighlightedNote && profileContent?.name && profileContent?.display_name && (
                  <Text appearance="hint" style={{ fontSize: 14, marginLeft: 4 }}>
                    @{profileContent?.name}
                  </Text>
                )}

                {!isHighlightedNote && (
                  <Text appearance="hint" style={{ fontSize: 14, marginLeft: 4 }}>
                    {timeSince(note.created_at)}
                  </Text>
                )}
              </View>

              {isHighlightedNote && profileContent?.name && (
                <Text appearance="hint" style={{ fontSize: 14, marginBottom: 4 }}>
                  @{profileContent?.name}
                </Text>
              )}

              {!isHighlightedNote && note.replyingToProfiles?.length > 0 && (
                <ReplyText pubkeysOrProfiles={note.replyingToProfiles} />
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
        </View>
      </Pressable>
      {!hideActions && !insideThread && <Divider />}
    </>
  )
}

function ReplyText({ pubkeysOrProfiles }) {
  return (
    <Text appearance="hint" style={{ fontSize: 12 }}>
      Replying to{" "}
      {pubkeysOrProfiles
        .map((p, index) => {
          const name =
            typeof p === "string"
              ? nip19.npubEncode(p).slice(0, 8)
              : p.content.name || nip19.npubEncode(p.pubkey).slice(0, 6)

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
        })
        .join("")}
    </Text>
  )
}

function RepostAuthor({ pubkey }) {
  const theme = useTheme()
  const profile = useProfile(pubkey)
  const repostAuthor = profile?.content?.name || pubkey.slice(0, 6)

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 8 }}>
      <Icon name="flip-2-outline" style={{ height: 16, width: 16, tintColor: theme["color-basic-600"] }} />
      <Text appearance="hint" style={{ marginLeft: 8 }}>
        {repostAuthor} boosted
      </Text>
    </View>
  )
}
