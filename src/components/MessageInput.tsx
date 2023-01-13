import React from "react"
import { View } from "react-native"
import { Input, Button, Divider, Icon, useTheme } from "@ui-kitten/components"

type Props = {
  onSubmit: (value: string) => void
  value: string
  onChangeText: (value: string) => void
}

export const MessageInput = ({ onSubmit, value, onChangeText }: Props) => {
  const theme = useTheme()

  return (
    <View style={{ backgroundColor: theme["background-basic-color-3"] }}>
      <Divider />
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          padding: 10,
        }}
      >
        <Input
          autoCapitalize="none"
          multiline
          value={value}
          onChangeText={onChangeText}
          style={{ flex: 1, borderRadius: 20, minHeight: 40, marginRight: 8 }}
          placeholder="Send a reply..."
          textStyle={{ flex: 1, fontSize: 18 }}
        />
        <Button
          onPress={() => onSubmit(value)}
          style={{ height: 40, width: 40, borderRadius: 20 }}
          accessoryLeft={(props) => <Icon {...props} name="paper-plane-outline" />}
        />
      </View>
    </View>
  )
}
