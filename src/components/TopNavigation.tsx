import React from "react"
import { TopNavigationAction, TopNavigation as BaseTopNavigation, Icon } from "@ui-kitten/components"
import { useNavigation } from "@react-navigation/native"

import { useDispatch } from "store"
import { useUser } from "store/hooks"
import { doFetchProfile } from "store/notesSlice"
import { Avatar } from "components"

type Props = {
  title?: string
  hideProfileLink?: boolean
  alignment: string
  hideBack?: boolean
  accessoryRight?: React.ReactNode
}

export const TopNavigation = ({ title, hideProfileLink, hideBack, ...rest }: Props) => {
  const dispatch = useDispatch()
  const { goBack } = useNavigation()
  const { pubkey } = useUser()
  const user = useUser()

  React.useEffect(() => {
    if (pubkey) {
      // dispatch(doFetchProfile(pubkey))
    }
  }, [pubkey])

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

  return <BaseTopNavigation accessoryLeft={accessoryLeft} title={title} alignment="center" {...rest} />
}
