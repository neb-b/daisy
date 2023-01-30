import React from "react"
import { View } from "react-native"
import type { FlexStyle } from "react-native"
import { Text, Icon, useTheme } from "@ui-kitten/components"

import { useDispatch } from "store"
import { useProfile, useNip05 } from "store/hooks"
import { doFetchNip05 } from "store/profilesSlice"

type Props = {
  pubkey: string
  includeDomain?: boolean
  style?: FlexStyle
}

export const Nip05Badge: React.FC<Props> = ({ pubkey, includeDomain = false, style = {} }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const nip05ForPubkey = useNip05(pubkey)
  const profile = useProfile(pubkey)
  const profileNip05 = profile?.content?.nip05

  React.useEffect(() => {
    // If null, it's already been fetched and returned nothing
    if (!profileNip05 || nip05ForPubkey || nip05ForPubkey === null) {
      return
    }

    if (nip05ForPubkey === undefined) {
      dispatch(doFetchNip05(pubkey))
    }
  }, [profileNip05, nip05ForPubkey])

  if (!nip05ForPubkey) {
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
        <Text style={{ color: theme["color-success-300"] }}>{profileNip05.split("@")[1]}</Text>
      )}
    </View>
  )
}
