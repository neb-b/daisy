import { useSelector } from "react-redux"
import { nostrEventKinds } from "core/nostr"

import type { RootState } from "./index"
import {
  selectUser,
  selectRelaysByUrl,
  selectRelaysLoadingByUrl,
  selectHasRelayConnection,
  makeSelectProfileByPubkey,
  makeSelectContactListByPubkey,
  makeSelectNoteByNoteId,
  makeSelectSubscriptionByFeedId,
  makeSelectUserHasRepostedByNoteId,
  makeSelectRepostCountByNoteId,
  makeSelectionReactionsByNoteId,
  makeSelectUserHasReactedToNoteId,
  makeSelectFeedById,
  makeSelectThreadByNoteId,
  makeSelectNip05ByPubkey,
} from "./selectors"

export const useProfile = (pubkey?: string) => {
  const profile = useSelector(makeSelectProfileByPubkey(pubkey))
  return profile
}

export const useUser = () => {
  const user = useSelector(selectUser)
  return user
}

export const useContactList = (pubkey?: string) => {
  const contactList = useSelector(makeSelectContactListByPubkey(pubkey))
  return contactList
}

export const useFeed = (feedIdOrPubkey: string) => {
  const feed = useSelector(makeSelectFeedById(feedIdOrPubkey))
  return feed
}

export const useThread = (noteId: string) => {
  const thread = useSelector(makeSelectThreadByNoteId(noteId))
  return thread
}

export const useNote = (
  noteId: string
): (NostrNoteEvent | NostrRepostEvent) & {
  repostedBy?: string
  replyingToProfiles?: (NostrProfileEvent | string)[]
} => {
  const note = useSelector(makeSelectNoteByNoteId(noteId))
  return note
}

export const useReactions = (noteId: string) => {
  const reactions = useSelector(makeSelectionReactionsByNoteId(noteId))
  const liked = useSelector(makeSelectUserHasReactedToNoteId(noteId))

  return { reactions, liked }
}

export const useReposted = (noteId: string) => {
  const userHasReposted = useSelector(makeSelectUserHasRepostedByNoteId(noteId))
  const repostCount = useSelector(makeSelectRepostCountByNoteId(noteId))

  return { repostedCount: repostCount, reposted: userHasReposted }
}

export const useRelaysByUrl = () => {
  const relaysByUrl = useSelector(selectRelaysByUrl)
  return relaysByUrl
}

export const useRelaysLoadingByUrl = () => {
  const relaysLoadingByUrl = useSelector(selectRelaysLoadingByUrl)
  return relaysLoadingByUrl
}

export const useHasRelayConnection = () => {
  const hasConnection = useSelector(selectHasRelayConnection)
  return hasConnection
}

export const useSubscriptionsByFeedId = (feedId) => {
  const subscriptions = useSelector(makeSelectSubscriptionByFeedId(feedId))
  return subscriptions
}

export const useNip05 = (pubkey: string) => {
  const nip05 = useSelector(makeSelectNip05ByPubkey(pubkey))

  return nip05
}
