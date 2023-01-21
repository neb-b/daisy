import React from "react"
import { Image as BaseImage } from "react-native"
import { useTheme } from "@ui-kitten/components"

export const Image = React.memo(({ src, style = {} }: { src: string; style?: {} }) => {
  const theme = useTheme()

  return (
    <BaseImage
      resizeMode="contain"
      source={{ uri: src }}
      style={{
        width: undefined,
        height: undefined,
        flex: 1,
        alignSelf: "stretch",
        borderRadius: 10,
        backgroundColor: theme["color-basic-1000"],
        ...style,
      }}
    />
  )
})
