import { Pressable, Linking } from "react-native"
import { Text, useTheme } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

type Props = {
  label: string
  src: string
}

export const Link = ({ label, src }: Props) => {
  const theme = useTheme()
  const navigation = useNavigation()

  const handleLinkPress = () => {
    if (src.startsWith("p:")) {
      const pubkey = src.slice(2)
      // @ts-expect-error
      navigation.navigate("Profile", { pubkey })
    } else if (src.startsWith("e:")) {
      const id = src.slice(2)
      // @ts-expect-error
      navigation.navigate("Thread", { id })
    } else {
      Linking.openURL(src)
    }
  }

  return (
    <Pressable onPress={handleLinkPress}>
      <Text style={{ color: theme["color-primary-500"] }}>{label}</Text>
    </Pressable>
  )
}
