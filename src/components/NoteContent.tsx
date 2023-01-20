import React from "react"
import { View } from "react-native"
import { useTheme, Text } from "@ui-kitten/components"
import { LinkPreview } from "@flyerhq/react-native-link-preview"
import { URL } from "react-native-url-polyfill"

import { isImage, isUrl, isMention, noteOrUrlRegex, urlRegex } from "utils/note"
import { Image, Link, Mention } from "components"

type Props = {
  note: NostrNoteEvent | NostrRepostEvent
  size?: "small" | "large"
}

export const NoteContent: React.FC<Props> = ({ note, size = "small" }) => {
  const theme = useTheme()

  if (!note) return null

  const firstNoteUrl = note.content.match(urlRegex)?.find((url) => {
    if (isImage(url)) {
      return false
    }

    return true
  })

  let domain = ""
  if (firstNoteUrl) {
    const url = new URL(firstNoteUrl)
    domain = url.hostname
  }

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
          return <Link key={text + i} label={text} src={text} size={size} />
        }

        if (isMention(text)) {
          const tagIndex = text.match(/#\[([0-9]+)]/)[1]
          const tag = note.tags[tagIndex]

          return <Mention key={i} tag={tag} size={size} />
        }

        return (
          <Text
            key={i}
            style={{
              fontSize: size === "small" ? 16 : 20,
              flexWrap: "wrap",
            }}
          >
            {text}
          </Text>
        )
      })}

      {firstNoteUrl && (
        <LinkPreview
          text={firstNoteUrl}
          renderLinkPreview={(linkPreview) => {
            if (!linkPreview.previewData) {
              return null
            }

            return (
              <View
                style={{
                  backgroundColor: theme["background-basic-color-3"],
                  borderRadius: 10,
                  marginTop: 16,
                  width: "100%",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: 150,
                    borderTopRightRadius: 10,
                    borderTopLeftRadius: 10,
                  }}
                >
                  <Image
                    src={linkPreview.previewData?.image?.url}
                    style={{
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                </View>
                <View style={{ padding: 8, borderRadius: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>{linkPreview.previewData.title}</Text>
                  <Text style={{ paddingTop: 4, paddingBottom: 4 }}>{domain}</Text>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}
