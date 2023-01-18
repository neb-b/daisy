import React from "react"
import { SafeAreaView } from "react-native"
import { Layout, Text } from "@ui-kitten/components"
import { useUser } from "store/hooks"
import { useDispatch } from "store"
import { initRelays } from "store/settingsSlice"

export function LoadingScreen({ navigation }) {
  const { reset } = navigation
  const dispatch = useDispatch()
  const { pubkey } = useUser()

  React.useEffect(() => {
    dispatch(initRelays())
  }, [dispatch])

  React.useEffect(() => {
    if (pubkey) {
      return reset({ index: 0, routes: [{ name: "Home" }] })
    }

    return reset({
      index: 0,
      routes: [{ name: "Auth" }],
    })
  }, [pubkey, reset])

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Layout style={{ flex: 1, alignItems: "center", justifyContent: "center" }}></Layout>
      </SafeAreaView>
    </Layout>
  )
}
