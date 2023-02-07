import React from "react"
import { View, Dimensions } from "react-native"
import { Divider, Text, useTheme } from "@ui-kitten/components"

import { Layout, TopNavigation } from "components"
import { useDMs, useUser } from "store/hooks"

import { FlashList } from "components"

const MAX_DM_WIDTH = Dimensions.get("window").width * 0.8

export function DMScreen({ route }) {
  const {
    params: { pubkey },
  } = route

  const dms = useDMs()

  const dmsForPubkey = dms[pubkey] || []

  const renderNote = React.useCallback(({ item }) => <DM key={item} dm={item} />, [])
  const keyExtractor = React.useCallback((item) => item.id, [])

  return (
    <Layout>
      <TopNavigation title="DM" alignment="center" hideProfileLink />
      <Divider />

      <FlashList data={dmsForPubkey} renderItem={renderNote} keyExtractor={keyExtractor} />
    </Layout>
  )
}

const DM = ({ dm }) => {
  const user = useUser()
  const theme = useTheme()

  const isMine = dm?.pubkey === user.pubkey

  if (!dm) {
    return null
  }

  return (
    <View
      style={{
        backgroundColor: isMine ? theme["color-primary-500"] : theme["color-basic-900"],

        maxWidth: MAX_DM_WIDTH,
        padding: 16,
        borderRadius: 10,
        margin: 16,
      }}
    >
      <Text style={{ color: isMine ? theme["color-basic-900"] : theme["color-basic-100"] }}>
        {dm.content}
      </Text>
    </View>
  )
}
