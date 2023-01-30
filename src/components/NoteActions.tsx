import React from "react"
import { View, Pressable, Share, Modal, Alert } from "react-native"
import { useTheme, Icon, Text } from "@ui-kitten/components"

import { NoteCreate } from "components"
import { nostrEventKinds } from "core/nostr"
import { useDispatch } from "store"
import { useNote, useReactions, useReposted } from "store/hooks"
import { doPublishNote, doLike } from "store/notesSlice"

type Props = {
  isThread?: boolean
  id: string
  style?: object
  size?: "small" | "large"
}

export const NoteActions: React.FC<Props> = ({ id, size = "small" }) => {
  const note = useNote(id)
  const { reactions, liked } = useReactions(id)
  const { repostedCount, reposted } = useReposted(id)
  const theme = useTheme()
  const dispatch = useDispatch()
  const [creatingNote, setCreatingNote] = React.useState(false)

  const defaultColor = theme["color-basic-600"]
  const interactedColor = theme["color-primary-500"]
  const isLarge = size === "large"
  const iconSize = isLarge ? 20 : 18

  const iconProps = {
    height: iconSize,
    width: iconSize,
    fill: defaultColor,
  }

  const handleReply = () => setCreatingNote(true)

  const handleShare = async () => {
    try {
      await Share.share({
        message: `https://snort.social/e/${id}`,
      })
    } catch (error: any) {
      console.log("error sharing", error)
    }
  }

  const handleRepost = () => {
    Alert.alert("Boost", "Are you sure you want to boost this?", [
      {
        text: "Boost",
        onPress: () =>
          dispatch(
            doPublishNote({
              kind: nostrEventKinds.repost,
              content: JSON.stringify(note),
              repostOf: id,
            })
          ),
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const handleLike = () => {
    dispatch(doLike(id))
  }

  return (
    <>
      <View style={{ flexDirection: "row", marginTop: 16, marginRight: 8, justifyContent: "space-between" }}>
        <Pressable onPress={handleReply}>
          <Icon {...iconProps} name="message-circle-outline" />
        </Pressable>
        <Pressable style={{ flexDirection: "row", alignItems: "center" }} onPress={handleRepost}>
          <Icon {...iconProps} name="flip-2-outline" fill={reposted ? interactedColor : iconProps.fill} />
          {repostedCount > 0 && (
            <Text
              style={{
                color: reposted ? interactedColor : defaultColor,
                fontSize: isLarge ? 16 : 12,
                marginLeft: 8,
              }}
            >
              {repostedCount}
            </Text>
          )}
        </Pressable>
        <Pressable style={{ flexDirection: "row", alignItems: "center" }} onPress={handleLike}>
          <Icon
            {...iconProps}
            fill={liked ? interactedColor : iconProps.fill}
            name={liked ? "heart" : "heart-outline"}
          />
          {reactions > 0 && (
            <Text
              style={{
                color: liked ? interactedColor : defaultColor,
                fontSize: isLarge ? 16 : 12,
                marginLeft: 8,
              }}
            >
              {reactions}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={handleShare}>
          <Icon {...iconProps} name="share-outline" />
        </Pressable>
      </View>
      {creatingNote && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setCreatingNote(false)
          }}
        >
          <NoteCreate id={id} closeModal={() => setCreatingNote(false)} />
        </Modal>
      )}
    </>
  )
}
