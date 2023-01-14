import React from "react"
import { View } from "react-native"
import { Text } from "@ui-kitten/components"

import { isImage, isUrl, isMention, noteOrUrlRegex } from "utils/note"
import { Image } from "./Image"
import { Link } from "./Link"
import { Mention } from "./Mention"

type Props = {
  note: NostrNoteEvent | NostrRepostEvent
}

export const NoteContent: React.FC<Props> = ({ note }) => {
  if (!note) return null

  return (
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
  )
}
