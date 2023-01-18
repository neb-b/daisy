import React from "react"
import { useProfile } from "store/hooks"
import { nip19 } from "nostr-tools"
import { Link } from "components"

const UserMention = ({ pubkey }) => {
  const profile = useProfile(pubkey)
  const name = profile?.content?.name || nip19.npubEncode(pubkey).slice(0, 9)

  return <Link src={`p:${pubkey}`} label={`@${name}`} />
}

const NoteMention = ({ id }) => {
  return <Link src={`e:${id}`} label={`@${nip19.noteEncode(id)}`} />
}

export const Mention = ({ tag }) => {
  const isUserMention = tag[0] === "p"
  const isNoteMention = tag[0] === "e"

  if (isUserMention) {
    return <UserMention pubkey={tag[1]} />
  }
  if (isNoteMention) {
    return <NoteMention id={tag[1]} />
  }

  return null
}
