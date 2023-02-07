import React from "react"
import { View, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Input, Button, Divider, TopNavigation, Text } from "@ui-kitten/components"
import { bech32ToHex } from "utils/keys"

import { Layout } from "components"

type Props = {
  closeModal: () => void
  id?: string
}

export const Search: React.FC<Props> = ({ closeModal, id }) => {
  const navigation = useNavigation()
  const [content, setContent] = React.useState("")
  const isValidNpub = content.length === 63 && content.startsWith("npub")

  function RightAccessory() {
    return (
      <Button appearance="ghost" onPress={closeModal}>
        <Text>Cancel</Text>
      </Button>
    )
  }

  const navigateToUser = () => {
    const hexPubkey = bech32ToHex(content)

    if (hexPubkey) {
      closeModal()
      // @ts-expect-error
      navigation.navigate("Profile", { pubkey: hexPubkey })
    }
  }

  return (
    <Layout>
      <View style={{ flex: 1 }}>
        <TopNavigation title="Search" alignment="center" accessoryRight={RightAccessory} />
        <Divider />

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingRight: 16, paddingLeft: 16, marginTop: 16 }}>
            <Input
              label="Go to user"
              autoCapitalize="none"
              multiline
              placeholder="npub1..."
              value={content}
              onChangeText={(newContent) => setContent(newContent)}
            />
            <Button
              style={{ marginTop: 16, borderRadius: 10 }}
              onPress={navigateToUser}
              disabled={!isValidNpub}
            >
              <Text>Go</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    </Layout>
  )
}
