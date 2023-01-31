import React from "react"
import { View } from "react-native"
import { Divider } from "@ui-kitten/components"
import { useFocusEffect } from "@react-navigation/native"
import { useDispatch } from "store"

import { Layout, TopNavigation } from "components"

export function DMsScreen() {
  const dispatch = useDispatch()

  return (
    <Layout>
      <TopNavigation showLogo alignment="center" />
      <Divider />

      <View style={{ flex: 1 }}></View>
    </Layout>
  )
}
