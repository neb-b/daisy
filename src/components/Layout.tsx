import React from "react"
import { View } from "react-native"
import { Layout as KittensLayout } from "@ui-kitten/components"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export const Layout = ({ children }) => {
  const insets = useSafeAreaInsets()

  return (
    <KittensLayout style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>{children}</View>
    </KittensLayout>
  )
}
