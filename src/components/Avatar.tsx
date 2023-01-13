import { View, Image, Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { useProfile, useUser } from "store/hooks"

type Props = {
  pubkey: string
  size?: number
}

export const Avatar: React.FC<Props> = ({ pubkey, size = 40, ...rest }) => {
  const { navigate } = useNavigation()
  const note = useProfile(pubkey)
  const picture = note?.content?.picture

  return (
    <Pressable
      onPress={() =>
        navigate("Profile", {
          pubkey,
        })
      }
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size ? size / 2 : 10,
          backgroundColor: "black",
          ...rest,
        }}
      >
        <Image
          source={{
            uri: picture || `https://www.gravatar.com/avatar/${pubkey}?s=128&d=retro`,
          }}
          style={{ height: size, width: size, borderRadius: size ? size / 2 : 10, resizeMode: "stretch" }}
        />
      </View>
    </Pressable>
  )
}
