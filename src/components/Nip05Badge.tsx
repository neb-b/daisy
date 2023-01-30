import React from "react"
import { View } from "react-native"
import type { FlexStyle } from "react-native"
import { Text, Icon, useTheme } from "@ui-kitten/components"
import { useProfile } from "store/hooks"

type Props = {
  pubkey: string
  includeDomain?: boolean
  style?: FlexStyle
}

export const Nip05Badge: React.FC<Props> = ({ pubkey, includeDomain = false, style = {} }) => {
  const theme = useTheme()
  const profile = useProfile(pubkey)
  const profileContent = profile?.content

  if (!profileContent?.nip05) {
    return null
  }

  const wrapperStyle = {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    ...style,
  }

  return (
    // @ts-expect-error
    <View style={wrapperStyle}>
      <Icon
        name="checkmark-circle-2"
        width={16}
        height={16}
        fill={theme["color-success-300"]}
        style={{ marginRight: 4 }}
      />
      {includeDomain && (
        <Text style={{ color: theme["color-success-300"] }}>{profileContent.nip05.split("@")[1]}</Text>
      )}
    </View>
  )
}
