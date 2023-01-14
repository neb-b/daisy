import React from "react"
import { View, Linking, Pressable } from "react-native"
import { Text, Divider, Button, useTheme, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { useNote, useProfile } from "store/hooks"
import { timeSince } from "utils/time"
import { isImage, isUrl, isMention, noteOrUrlRegex } from "utils/note"
import { Image } from "./Image"
import { Avatar } from "./Avatar"
import { Link } from "./Link"
import { Mention } from "./Mention"

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
  const replyProfile = useProfile(note?.reply?.pubkey)
  const replyProfileContent = replyProfile?.content

  if (!note) return null
  // console.log("note", note)

  const xx = {
    content: "#[1] pls implement video hosting feature 😇🙏",
    created_at: 1673672900,
    id: "ff3f8de3548346da6e94d4e3f9f66a2257e8e7bf0c7157434a2eade2d9f9c83a",
    kind: 1,
    pubkey: "1577e4599dd10c863498fe3c20bd82aafaf829a595ce83c5cf8ac3463531b09b",
    reply: {
      content: "When bitcoin pumps only memes allowed😈",
      created_at: 1673672784,
      id: "c0ffb627a163c826ab3d6898148db645c8c39ada8c5503f4accbf1dabf17895d",
      kind: 1,
      pubkey: "1577e4599dd10c863498fe3c20bd82aafaf829a595ce83c5cf8ac3463531b09b",
      sig: "226253cee90a180611c948db764186e45d440d2bf7e7db75a24e471906eb6f6314463308a01e63c81a97094d0eb5c56bc0a778c83f2b970c45ccbedfdd160381",
      tags: [],
    },
    sig: "c1ee54257974f3ac93b24bd3ec31ecfae940ef8ff00931f26c5ef395e8538988fa38f8c8062876e108eac731bbb168435648a0f05dd2bc4f7c0f868a4e9fe75e",
    tags: [
      ["e", "c0ffb627a163c826ab3d6898148db645c8c39ada8c5503f4accbf1dabf17895d"],
      ["p", "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"],
    ],
  }

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
            <View style={{ flex: 1, marginLeft: 5 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {profileContent?.name || note.pubkey.slice(0, 6)}
                </Text>

                <Text appearance="hint" style={{ fontSize: 16, marginLeft: 4 }}>
                  {timeSince(note.created_at)}
                </Text>
              </View>

              {note.reply && (
                <Text appearance="hint" style={{ fontSize: 12 }}>
                  Replying to {replyProfileContent?.name || note.reply.pubkey.slice(0, 6) || "unknown user"}
                </Text>
              )}

              <View style={{ marginTop: 5, paddingRight: 13, flexDirection: "row", flexWrap: "wrap" }}>
                {note.content.split(noteOrUrlRegex).map((text, i) => {
                  if (typeof text === "undefined") {
                    return <React.Fragment key={i} />
                  }

                  if (isImage(text)) {
                    return (
                      <View key={i} style={{ width: "100%", height: 150 }}>
                        <Image src={text} />
                      </View>
                    )
                  }

                  if (isUrl(text)) {
                    return <Link key={text} label={text} src={text} />
                  }

                  if (isMention(text)) {
                    const tagIndex = text.match(/#\[(\d)\]/)[1]
                    const tag = note.tags[tagIndex]

                    return <Mention key={i} tag={tag} />
                  }

                  return (
                    <Text
                      key={i}
                      style={{
                        fontSize: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {text}
                    </Text>
                  )
                })}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
      <Divider />
    </>
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

// let reply
// if (note?.tags.length > 1) {
//   // todo: figure out tags
//   // will this always be a reply?
//   const possibleReplyTag = note.tags[1]

//   if (possibleReplyTag && possibleReplyTag[0] === "e") {
//     const replyId = possibleReplyTag[1]
//     reply = notesById[replyId]

//     if (reply) {
//       reply.user = profilesByPubkey[reply.pubkey]
//     }
//   }
// }
