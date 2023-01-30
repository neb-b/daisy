import { useSelector } from "react-redux"
import { createSelector } from "@reduxjs/toolkit"

import { nostrEventKinds } from "core/nostr"
import type { RootState } from "./index"

const selectNotes = (state: RootState) => state.notes
const selectProfiles = (state: RootState) => state.profiles
const selectSettings = (state: RootState) => state.settings
const selectSubscriptions = (state: RootState) => state.subscriptions

export const selectUser = createSelector(selectSettings, (settings) => {
  return settings.user
})

export const selectProfilesByPubkey = createSelector(selectProfiles, (profiles) => {
  const { profilesByPubkey } = profiles
  return profilesByPubkey
})

export const selectRelaysByUrl = createSelector(selectSettings, (settings) => {
  return settings.relaysByUrl
})

export const selectRelaysLoadingByUrl = createSelector(selectSettings, (settings) => {
  return settings.relaysLoadingByUrl
})

export const selectSubscriptionsByFeedId = createSelector(selectSubscriptions, (subscriptions) => {
  return subscriptions.subscriptionsByFeedId
})

export const selectContactListsByPubkey = createSelector(selectProfiles, (profiles) => {
  return profiles.contactListsByPubkey
})

export const selectNotesById = createSelector(selectNotes, (notes) => {
  return notes.notesById
})

export const selectReactionsById = createSelector(selectNotes, (notes) => {
  return notes.reactionsByNoteId
})

export const selectHasRelayConnection = createSelector(selectRelaysByUrl, (relaysByUrl) => {
  return !!Object.values(relaysByUrl).find((relay) => relay.status === 1 && typeof relay.on === "function")
})

export const makeSelectProfileByPubkey = (pubkey: string) =>
  createSelector(selectProfilesByPubkey, (profilesByPubkey) => {
    return profilesByPubkey[pubkey]
  })

export const makeSelectContactListByPubkey = (pubkey: string) =>
  createSelector(selectContactListsByPubkey, (contactListsByPubkey) => {
    return contactListsByPubkey[pubkey]
  })

export const makeSelectSubscriptionByFeedId = (feedId: string) =>
  createSelector(selectSubscriptionsByFeedId, (subscriptionsByFeedId) => {
    return subscriptionsByFeedId[feedId]
  })

export const makeSelectUserHasRepostedByNoteId = (noteId: string) =>
  createSelector(selectNotesById, selectUser, (notesById, user) => {
    const notes = Object.values(notesById)

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      if (note.kind === nostrEventKinds.repost) {
        const isMe = note.pubkey === user.pubkey
        const isNoteMatch = note.tags.find((tag) => tag[0] === "e")?.[1] === noteId

        if (isMe && isNoteMatch) {
          return true
        }
      }
    }

    return false
  })

export const makeSelectRepostCountByNoteId = (noteId: string) =>
  createSelector(selectNotesById, (notesById) => {
    const notes = Object.values(notesById)

    let count = 0
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      if (note.kind === nostrEventKinds.repost) {
        const isNoteMatch = note.tags.find((tag) => tag[0] === "e")?.[1] === noteId

        if (isNoteMatch) {
          count++
        }
      }
    }

    return count
  })

export const makeSelectionReactionsByNoteId = (noteId: string) =>
  createSelector(selectReactionsById, (reactionsByNoteId) => {
    return reactionsByNoteId[noteId]?.length || 0
  })

export const makeSelectUserHasReactedToNoteId = (noteId: string) =>
  createSelector(selectReactionsById, selectUser, (reactionsById, user) => {
    const reactions = reactionsById[noteId]
    if (!reactions) {
      return false
    }

    return reactions.some((reaction) => reaction.pubkey === user.pubkey)
  })
