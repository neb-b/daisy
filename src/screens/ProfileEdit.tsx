import React from "react"
import { ScrollView } from "react-native"
import { Button, Input } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { Layout } from "components/Layout"
import { TopNavigation } from "components/TopNavigation"
import { useDispatch } from "store"
import { useUser, useProfile } from "store/hooks"
import { doUpdateProfile } from "store/notesSlice"

export function ProfileEditScreen() {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const user = useUser()
  const profile = useProfile(user.pubkey)
  const profileContent = profile?.content || {}
  const [draftUser, setDraftUser] = React.useState<NostrProfileContent>(profileContent)

  const handleChange = (key: string, value: string) => {
    setDraftUser({ ...draftUser, [key]: value })
  }

  const handleSubmit = () => {
    dispatch(
      doUpdateProfile(draftUser, () => {
        navigation.goBack()
      })
    )
  }

  const inputStyle = {
    marginBottom: 24,
  }

  return (
    <Layout>
      <TopNavigation alignment="center" title="Edit Profile" hideProfileLink />

      <ScrollView style={{ flex: 1, paddingTop: 24, paddingBottom: 128, paddingLeft: 8, paddingRight: 8 }}>
        {[
          { label: "Display Name", key: "display_name" },
          { label: "Handle", key: "name" },
          { label: "Bio", key: "about", multiline: true },
          { label: "Profile Picture", key: "picture" },
          { label: "Banner Picture", key: "banner" },
          { label: "Website", key: "website" },
          { label: "NIP-05 Verification", key: "nip05" },
          { label: "Lightning Address", key: "lud06" },
        ].map((inputProps) => (
          <Input
            key={inputProps.key}
            {...inputProps}
            value={draftUser[inputProps.key]}
            onChangeText={(newText) => {
              handleChange(inputProps.key, newText)
            }}
            style={inputStyle}
          />
        ))}
        <Button style={{ marginBottom: 64 }} onPress={handleSubmit}>
          Save
        </Button>
      </ScrollView>
    </Layout>
  )
}
