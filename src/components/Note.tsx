import React from "react"
import { View, Linking, Pressable } from "react-native"
import { Text, Divider, Button, useTheme, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { useNote, useProfile } from "store/hooks"
import { timeSince } from "utils/time"
import { isImage, isUrl, urlRegex } from "utils/url"
import { Image } from "./Image"
import { Avatar } from "./Avatar"

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
                {note.content.split(urlRegex).map((text, i) => {
                  if (isImage(text)) {
                    return (
                      <View key={i} style={{ width: "100%", height: 150 }}>
                        <Image src={text} />
                      </View>
                    )
                  }

                  if (isUrl(text)) {
                    return (
                      <Button
                        appearance="ghost"
                        key={i}
                        onPress={() => Linking.openURL(text)}
                        style={{ padding: 0 }}
                      >
                        {text}
                      </Button>
                    )
                  }

                  return (
                    <Text key={i} style={{ fontSize: 16, flexWrap: "wrap" }}>
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
