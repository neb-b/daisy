import React from "react"
import { View, Image, Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Icon, useTheme } from "@ui-kitten/components"

import { useProfile } from "store/hooks"

type Props = {
  pubkey: string
  size?: number
}

export const Avatar: React.FC<Props> = ({ pubkey, size = 40, ...rest }) => {
  const navigation = useNavigation()
  const note = useProfile(pubkey)
  const theme = useTheme()
  const picture = note?.content?.picture
  const lastFourOfPubkey = pubkey?.slice(-4)

  const avatarUri = `https://media.nostr.band/thumbs/${lastFourOfPubkey}/${pubkey}-picture-64`

  const handlePress = React.useCallback(() => {
    // @ts-expect-error
    navigation.push("Profile", {
      pubkey,
    })
  }, [pubkey])

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size ? size / 2 : 10,
          backgroundColor: theme["color-basic-1000"],
          ...rest,
        }}
      >
        {picture ? (
          <Image
            source={{
              uri: picture, //avatarUri,
            }}
            style={{ height: size, width: size, borderRadius: size ? size / 2 : 10, resizeMode: "stretch" }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Icon
              height={25}
              width={25}
              name="person-outline"
              style={{ tintColor: theme["color-primary-300"] }}
            />
          </View>
        )}
      </View>
    </Pressable>
  )
}
