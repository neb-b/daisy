import { View, Image } from "react-native"

type Props = {
  picture?: string
  pubkey: string
  size?: number
}

export const Avatar: React.FC<Props> = ({ picture, pubkey, size = 30, ...rest }) => {
  return (
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
  )
}
