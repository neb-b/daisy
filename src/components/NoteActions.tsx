import React from "react"
import { View, Pressable, Share } from "react-native"
import { useTheme, Icon, Text } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { nostrEventKinds } from "core/nostr"
import { useDispatch } from "store"
import { useNote, useReactions } from "store/hooks"
import { doPublishNote, doLike } from "store/notesSlice"

type Props = {
  isThread?: boolean
  id: string
  style?: object
}

export const NoteActions: React.FC<Props> = ({ id, style = {}, isThread = false }) => {
  const navigation = useNavigation()
  const note = useNote(id)
  const { reactions, liked } = useReactions(id)
  const theme = useTheme()
  const dispatch = useDispatch()
  const defaultColor = theme["color-basic-600"]
  const interactedColor = theme["color-primary-500"]

  const iconProps = {
    height: 16,
    width: 16,
    fill: defaultColor,
  }

  // @ts-expect-error
  const handleNavigate = () => navigation.navigate("Thread", { id })

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
    dispatch(
      doPublishNote({
        kind: nostrEventKinds.repost,
        content: JSON.stringify(note),
        repostOf: id,
      })
    )
  }

  const handleLike = () => {
    dispatch(doLike(id))
  }

  return (
    <View style={{ flexDirection: "row", marginTop: 16, marginRight: 16, justifyContent: "space-between" }}>
      {/* <Pressable onPress={handleNavigate}>
        <Icon {...iconProps} name="message-circle-outline" />
      </Pressable> */}
      <Pressable onPress={handleRepost}>
        <Icon {...iconProps} name="flip-2-outline" />
      </Pressable>
      <Pressable style={{ flexDirection: "row", alignItems: "center" }} onPress={handleLike}>
        <Icon
          {...iconProps}
          fill={liked ? interactedColor : iconProps.fill}
          name={liked ? "heart" : "heart-outline"}
        />
        {reactions.length > 0 && (
          <Text style={{ color: liked ? interactedColor : defaultColor, fontSize: 12, marginLeft: 8 }}>
            {reactions.length}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={handleShare}>
        <Icon {...iconProps} name="share-outline" />
      </Pressable>
    </View>
  )
}
