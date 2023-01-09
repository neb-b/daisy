import { View, Pressable } from "react-native"
import { Text } from "@ui-kitten/components"

import { useSelector } from "react-redux"

import type { RootState } from "store"
import { Avatar } from "./Avatar"
import { timeSince } from "../utils/time"

export const NoteItem = ({ id, navigation, style = {} }) => {
  const { profilesByPubkey, notesById } = useSelector((state: RootState) => state.notes)
  const note = notesById[id]
  const profile = profilesByPubkey[note?.pubkey]
  const profileContent = profile?.content

  // console.log("note", note)

  let reply
  if (note?.tags.length > 1) {
    // todo: figure out tags
    // will this always be a reply?
    const possibleReplyTag = note.tags[1]

    if (possibleReplyTag && possibleReplyTag[0] === "e") {
      const replyId = possibleReplyTag[1]
      reply = notesById[replyId]

      if (reply) {
        reply.user = profilesByPubkey[reply.pubkey]
      }
    }
  }

  return (
    <View
      style={{
        flexDirection: "column",
        marginBottom: 10,
        ...style,
      }}
    >
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
          {reply && (
            <View
              style={{
                paddingLeft: 10,
                borderLeftWidth: 1,
                borderLeftColor: "#ddd",
                marginBottom: 10,
                marginTop: 10,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                {reply?.name || reply?.pubkey.slice(0, 6) || "unknown user"}
              </Text>
              <Text style={{ marginTop: 5 }}>
                {reply.content.length > 45 ? `${reply.content.slice(0, 45)}...` : reply.content}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 20, marginTop: 5, paddingRight: 13, flexWrap: "wrap" }}>
            {note.content}
          </Text>
        </View>
      </View>
    </View>
  )
}
