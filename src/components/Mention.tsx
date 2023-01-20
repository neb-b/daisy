import React from "react"
import { useProfile } from "store/hooks"
import { nip19 } from "nostr-tools"
import { Link } from "components"

const UserMention = ({ pubkey, ...rest }) => {
  const profile = useProfile(pubkey)
  const name = profile?.content?.name || nip19.npubEncode(pubkey).slice(0, 9)

  return <Link src={`p:${pubkey}`} label={`@${name}`} {...rest} />
}

const NoteMention = ({ id }) => {
  return <Link src={`e:${id}`} label={`@${nip19.noteEncode(id)}`} />
}

export const Mention = ({ tag, ...rest }) => {
  const isUserMention = tag[0] === "p"
  const isNoteMention = tag[0] === "e"

  if (isUserMention) {
    return <UserMention pubkey={tag[1]} {...rest} />
  }
  if (isNoteMention) {
    return <NoteMention id={tag[1]} {...rest} />
  }

  return null
}
