import React from "react"
import { View, Pressable, Share, Modal, Alert } from "react-native"
import { useTheme, Icon, Text } from "@ui-kitten/components"
import * as Haptics from "expo-haptics"

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
  const iconSize = isLarge ? 20 : 16

  const iconProps = {
    height: iconSize,
    width: iconSize,
    fill: defaultColor,
  }

  const haptic = React.useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const handleReply = React.useCallback(() => {
    haptic()
    setCreatingNote(true)
  }, [haptic, setCreatingNote])

  const handleShare = React.useCallback(async () => {
    haptic()

    try {
      await Share.share({
        message: `https://snort.social/e/${id}`,
      })
    } catch (error: any) {
      console.log("error sharing", error)
    }
  }, [id, haptic])

  const stringifiedNote = JSON.stringify(note)
  const handleRepost = React.useCallback(() => {
    haptic()

    Alert.alert("Boost", "Are you sure you want to boost this?", [
      {
        text: "Boost",
        onPress: () =>
          dispatch(
            doPublishNote({
              kind: nostrEventKinds.repost,
              content: stringifiedNote,
              repostOf: id,
            })
          ),
      },
      { text: "Cancel", style: "cancel" },
    ])
  }, [id, stringifiedNote, haptic])

  const handleLike = React.useCallback(() => {
    haptic()
    dispatch(doLike(id))
  }, [id, haptic])

  return (
    <>
      <View style={{ flexDirection: "row", marginTop: 12, marginRight: 8, justifyContent: "space-between" }}>
        <NoteActionPressable onPress={handleReply} style={{ marginLeft: -4 }}>
          <Icon {...iconProps} name="message-circle-outline" />
        </NoteActionPressable>
        <NoteActionPressable onPress={handleRepost}>
          <Icon {...iconProps} name="flip-2-outline" fill={reposted ? interactedColor : iconProps.fill} />
          {repostedCount > 0 && (
            <Text
              style={{
                color: reposted ? interactedColor : defaultColor,
                fontSize: isLarge ? 16 : 12,
                marginLeft: isLarge ? 8 : 4,
              }}
            >
              {repostedCount}
            </Text>
          )}
        </NoteActionPressable>
        <NoteActionPressable onPress={handleLike}>
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
                marginLeft: isLarge ? 8 : 4,
              }}
            >
              {reactions}
            </Text>
          )}
        </NoteActionPressable>
        <NoteActionPressable onPress={handleShare} style={{ marginRight: 8 }} hasCount={false}>
          <Icon {...iconProps} name="share-outline" />
        </NoteActionPressable>
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

const NoteActionPressable = ({ onPress, children, style = {}, hasCount = true }) => {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 4,
        minWidth: hasCount ? 40 : undefined,
        ...style,
      }}
      onPress={onPress}
    >
      {children}
    </Pressable>
  )
}
