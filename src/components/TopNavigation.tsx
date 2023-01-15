import React from "react"
import { TopNavigationAction, TopNavigation as BaseTopNavigation, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { useUser } from "store/hooks"
import { Avatar } from "components/Avatar"

type Props = { title?: string; hideProfileLink?: boolean; alignment: string }

export function TopNavigation({ title, hideProfileLink }: Props) {
  const user = useUser()
  const { goBack } = useNavigation()

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
  const accessoryLeft = hideProfileLink ? backAction : profileLink

  return <BaseTopNavigation accessoryLeft={accessoryLeft} title={title} alignment="center" />
}
