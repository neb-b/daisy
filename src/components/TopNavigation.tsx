import React from "react"
import { View, Image } from "react-native"
import { TopNavigationAction, TopNavigation as BaseTopNavigation, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { useDispatch } from "store"
import { useUser, useHasRelayConnection } from "store/hooks"
import { doFetchProfile } from "store/notesSlice"
import { Avatar } from "components"

type Props = {
  title?: string
  hideProfileLink?: boolean
  alignment: string
  hideBack?: boolean
  accessoryRight?: React.ReactNode
  showLogo?: boolean
  style?: {}
}

export const TopNavigation = ({ title, hideProfileLink, hideBack, showLogo = false, style }: Props) => {
  const dispatch = useDispatch()
  const { goBack } = useNavigation()
  const { pubkey } = useUser()
  const user = useUser()
  const hasRelayConnection = useHasRelayConnection()

  React.useEffect(() => {
    if (pubkey && hasRelayConnection) {
      dispatch(doFetchProfile(pubkey))
    }
  }, [pubkey, hasRelayConnection])

  const navigateBack = () => {
    goBack()
  }

  const backAction = React.useCallback(
    () => (
      <TopNavigationAction icon={(props) => <Icon {...props} name="arrow-back" />} onPress={navigateBack} />
    ),
    []
  )
  const profileLink = React.useCallback(() => <Avatar pubkey={user.pubkey} size={35} />, [user.pubkey])
  const accessoryLeft = hideProfileLink ? (hideBack ? null : backAction) : profileLink
  const titleImage = React.useCallback(
    () =>
      showLogo ? (
        <View style={{ marginTop: -9 }}>
          <Image source={require("../../assets/icon.png")} style={{ height: 40, width: 40 }} />
        </View>
      ) : null,
    [showLogo]
  )

  return (
    <BaseTopNavigation
      alignment="center"
      accessoryLeft={accessoryLeft}
      title={title || titleImage}
      {...style}
    />
  )
}
