import { Pressable, Linking } from "react-native"
import { Text, useTheme } from "@ui-kitten/components"

type Props = {
  label: string
  src: string
}

export const Link = ({ label, src }: Props) => {
  const theme = useTheme()

  return (
    <Pressable onPress={() => Linking.openURL(src)}>
      <Text style={{ color: theme["color-primary-500"] }}>{label}</Text>
    </Pressable>
  )
}
