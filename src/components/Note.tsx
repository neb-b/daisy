import React from "react"
import { View, Linking, Pressable } from "react-native"
import { Text, Divider, Button, useTheme, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"
import { nip19 } from "nostr-tools"

import { useNote, useProfile } from "store/hooks"
import { timeSince } from "utils/time"
import { isImage, isUrl, isMention, noteOrUrlRegex } from "utils/note"
import { Image } from "./Image"
import { Avatar } from "./Avatar"
import { Link } from "./Link"
import { Mention } from "./Mention"
import { NoteContent } from "./NoteContent"
import { NoteActions } from "./NoteActions"

type Props = {
  isThread?: boolean
  id: string
  style?: object
}

export const Note: React.FC<Props> = ({ id, style = {}, isThread = false }) => {
  const navigation = useNavigation()
  const note = useNote(id)
  const profile = useProfile(note?.pubkey)
  const profileContent = profile?.content

  if (!note) return null

  return (
    <>
      {/* @ts-expect-error */}
      <Pressable onPress={() => (isThread ? () => {} : navigation.navigate("Thread", { id }))} style={{}}>
        <View
          style={{
            flexDirection: "column",
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 8,
            paddingRight: 8,
            ...style,
          }}
        >
          {note.repostedBy && <RepostAuthor pubkey={note.repostedBy} />}

          <View style={{ flexDirection: "row" }}>
            <Avatar pubkey={note.pubkey} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {profileContent?.name || note.pubkey.slice(0, 6)}
                </Text>

                <Text appearance="hint" style={{ fontSize: 16, marginLeft: 4 }}>
                  {timeSince(note.created_at)}
                </Text>
              </View>

              {note.replyingToProfiles?.length > 0 && (
                <ReplyText pubkeysOrProfiles={note.replyingToProfiles} />
              )}

              <NoteContent note={note} />
              <NoteActions id={note.id} />
            </View>
          </View>
        </View>
      </Pressable>
      <Divider />
    </>
  )
}

const ReplyText = ({ pubkeysOrProfiles }) => {
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
            } else {
              return `, ${name}`
            }
          }

          if (index === 2) {
            return `, & ${name}`
          }
        })
        .join("")}
    </Text>
  )
}

const RepostAuthor = ({ pubkey }) => {
  const theme = useTheme()
  const profile = useProfile(pubkey)
  const repostAuthor = profile?.content?.name || pubkey.slice(0, 6)

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 8 }}>
      <Icon name="flip-2-outline" style={{ height: 16, width: 16, tintColor: theme["color-basic-600"] }} />
      <Text appearance="hint" style={{ marginLeft: 8 }}>
        {repostAuthor} reposted
      </Text>
    </View>
  )
}
