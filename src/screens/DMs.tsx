import React from "react"
import { View } from "react-native"
import { Divider } from "@ui-kitten/components"
import { useFocusEffect } from "@react-navigation/native"

import { Layout, TopNavigation } from "components"
import { useDispatch } from "store"
import { doPopulateDMsFeed } from "store/notesSlice"

export function DMsScreen() {
  const dispatch = useDispatch()

  React.useEffect(() => {
    setTimeout(() => {
      dispatch(doPopulateDMsFeed())
    }, 2000)
  }, [])

  return (
    <Layout>
      <TopNavigation title="Messages" alignment="center" />
      <Divider />

      <View style={{ flex: 1 }}></View>
    </Layout>
  )
}
