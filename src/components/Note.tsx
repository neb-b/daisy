import { View, Pressable } from "react-native"
import { Text, Icon } from "@ui-kitten/components"

import { useNote, useProfile } from "store/hooks"
import { Avatar } from "./Avatar"
import { timeSince } from "../utils/time"

export const NoteItem = ({ id, navigation, style = {} }) => {
  const note = useNote(id)
  const profile = useProfile(note?.pubkey)
  const profileContent = profile?.content

  if (!note) return null

  return (
    <View
      style={{
        flexDirection: "column",
        marginBottom: 10,
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
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {profileContent?.name || note.pubkey.slice(0, 6)}
          </Text>
          <Text>{timeSince(note.created_at)}</Text>
          <Text style={{ fontSize: 20, marginTop: 5, paddingRight: 13, flexWrap: "wrap" }}>
            {note.content}
          </Text>
        </View>
      </View>
    </View>
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
// {reply && (
//   <View
//     style={{
//       paddingLeft: 10,
//       borderLeftWidth: 1,
//       borderLeftColor: "#ddd",
//       marginBottom: 10,
//       marginTop: 10,
//     }}
//   >
//     <Text style={{ fontWeight: "bold" }}>
//       {reply?.name || reply?.pubkey.slice(0, 6) || "unknown user"}
//     </Text>
//     <Text style={{ marginTop: 5 }}>
//       {reply.content.length > 45 ? `${reply.content.slice(0, 45)}...` : reply.content}
//     </Text>
//   </View>
// )}
