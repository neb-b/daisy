import { View, Pressable } from "react-native"
import { Text, Divider } from "@ui-kitten/components"

import { useNote, useProfile } from "store/hooks"
import { timeSince, fullDateString } from "utils/time"
import { isImage, urlRegex } from "utils/url"
import { Image } from "./Image"
import { Avatar } from "./Avatar"

type Props = {
  isThread?: boolean
  id: string
  navigation: any
  style?: object
}

export const Note: React.FC<Props> = ({ id, navigation, style = {}, isThread = false }) => {
  const note = useNote(id)
  const profile = useProfile(note?.pubkey)
  const profileContent = profile?.content
  const replyProfile = useProfile(note?.reply?.pubkey)
  const replyProfileContent = replyProfile?.content

  if (!note) return null

  return (
    <>
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
          <Pressable
            onPress={() =>
              navigation.navigate("Profile", {
                pubkey: note.pubkey,
              })
            }
          >
            <Avatar picture={profileContent?.picture} pubkey={note.pubkey} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {profileContent?.name || note.pubkey.slice(0, 6)}
              </Text>
              {!isThread && (
                <Text appearance="hint" style={{ fontSize: 16, marginLeft: 4 }}>
                  {timeSince(note.created_at)}
                </Text>
              )}
            </View>

            {note.reply && (
              <Text appearance="hint" style={{ fontSize: 12 }}>
                Replying to {replyProfileContent?.name || note.reply.pubkey.slice(0, 6) || "unknown user"}
              </Text>
            )}

            <View style={{ marginTop: 5, paddingRight: 13, flexDirection: "row", flexWrap: "wrap" }}>
              {note.content.split(urlRegex).map((text) => {
                if (isImage(text)) {
                  return (
                    <View key={text} style={{ width: "100%", height: 200 }}>
                      <Image src={text} />
                    </View>
                  )
                }

                return (
                  <Text key={text} style={{ fontSize: 16, flexWrap: "wrap" }}>
                    {text}
                  </Text>
                )
              })}
            </View>

            {isThread && <Text style={{}}>{fullDateString(note.created_at)}</Text>}
          </View>
        </View>
      </View>
      <Divider />
    </>
  )
}

const RepostAuthor = ({ pubkey }) => {
  const profile = useProfile(pubkey)
  const repostAuthor = profile?.content?.name || pubkey.slice(0, 6)

  return (
    <View>
      {/* <Icon name="flip-2-outline" styled={{ height: 32, width: 32 }} /> */}
      <Text style={{ marginLeft: 4, marginBottom: 4 }}>{repostAuthor} reposted</Text>
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
