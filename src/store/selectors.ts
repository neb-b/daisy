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

export const selectNip05ByPubkey = createSelector(selectProfiles, (profiles) => {
  return profiles.nip05ByPubkey
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

export const selectFeedsById = createSelector(selectNotes, (notes) => {
  return notes.feedsByIdOrPubkey
})

export const selectLoadingById = createSelector(selectNotes, (notes) => {
  return notes.loadingByIdOrPubkey
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

export const makeSelectNoteByNoteId = (noteId: string) =>
  createSelector(selectNotesById, selectProfilesByPubkey, (notesById, profilesByPubkey) => {
    const note = notesById[noteId]

    if (!note) {
      return
    }

    if (note.kind !== nostrEventKinds.repost) {
      // See if there are any replies
      // TODO: handle reposts of replies
      const replyingToPubkeys = note.tags.filter((tag) => tag[0] === "p").map((tag) => tag[1])
      const replyingToProfiles = replyingToPubkeys
        .map((pubkey) => profilesByPubkey[pubkey] || pubkey)
        .slice(0, 3)

      return {
        ...note,
        replyingToProfiles,
      }
    }

    const repostedId = note.tags.find((tag) => tag[0] === "e")?.[1]
    const repostedNote = notesById[repostedId]

    if (!repostedNote) {
      return
    }

    return {
      repostedBy: note.pubkey,
      ...repostedNote,
    }
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

export const makeSelectFeedById = (feedId: string) =>
  createSelector(selectFeedsById, selectNotesById, selectLoadingById, (feedsById, notesById, loadingById) => {
    const loading = loadingById[feedId]
    const feed = feedsById[feedId]

    if (!feed) {
      return { notes: [], loading }
    }

    return {
      loading,
      notes: feed
        .reduce((acc, noteId) => {
          const note = notesById[noteId]

          if (note) {
            return [...acc, note]
          }

          return acc
        }, [])
        .sort((a, b) => b.created_at - a.created_at)
        .map((note) => note.id),
    }
  })

export const makeSelectThreadByNoteId = (noteId: string) =>
  createSelector(selectNotesById, selectLoadingById, (notesById, loadingById) => {
    const note = notesById[noteId]
    const loading = loadingById[noteId]

    if (!note) {
      return { notes: [], loading }
    }

    let noteToDisplay = note
    if (note.kind === nostrEventKinds.repost) {
      const repostedId = note.tags.find((tag) => tag[0] === "e")?.[1]
      const repostedNote = notesById[repostedId]
      if (repostedNote) {
        noteToDisplay = repostedNote
      }
    }

    const highlightedNoteReplyIds = noteToDisplay.tags
      .slice()
      .filter((tag) => tag[0] === "e")
      .map((tag) => tag[1])

    const repliesToHighlightedNote = Object.values(notesById)
      .reduce((acc, noteFromNoteById) => {
        if (noteFromNoteById.kind === nostrEventKinds.reaction) {
          return acc
        }

        const noteTags = noteFromNoteById.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])

        if (noteTags.includes(noteToDisplay.id) && noteFromNoteById.kind !== nostrEventKinds.repost) {
          acc.push(noteFromNoteById)
        }

        return acc
      }, [])
      .sort((a, b) => a.created_at - b.created_at)
      .map((note) => note.id)

    if (!highlightedNoteReplyIds.length) {
      // This is a top level message
      // Get direct replies to this message
      return { notes: [noteToDisplay.id, ...repliesToHighlightedNote], loading }
    }

    if (highlightedNoteReplyIds.length === 1) {
      // The highlighted note is replying to the top of a thread
      // Get other replies to this highlighted note
      return {
        notes: [highlightedNoteReplyIds[0], noteToDisplay.id, ...repliesToHighlightedNote],
        loading,
      }
    }

    // This is a reply to a message in the middle of a thread
    // Get reply chain for this specific message
    const rootNoteId = highlightedNoteReplyIds[0]
    const directReplyId = highlightedNoteReplyIds[0]
    const directReplyNote = notesById[directReplyId]

    const travelUpThread = (note: NostrEvent) => {
      const replyIds = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])

      const topLevelReply = replyIds[0]
      const topLevelReplyNote = notesById[topLevelReply]
      const directReply = replyIds[1]
      const directReplyNote = notesById[directReply]

      if (!topLevelReplyNote || !directReplyNote) {
        return [note]
      }

      if (directReplyNote) {
        return [...travelUpThread(directReplyNote), note]
      } else {
        const topLevelReplyNote = notesById[topLevelReply]
        return [topLevelReplyNote, note]
      }
    }

    let repliesBetweenHighlightedNoteAndTopLevelNote = []
    if (directReplyNote) {
      repliesBetweenHighlightedNoteAndTopLevelNote = travelUpThread(note)
    }

    return {
      notes: [
        rootNoteId,
        ...repliesBetweenHighlightedNoteAndTopLevelNote.map((note) => note.id),
        ...repliesToHighlightedNote,
      ],
      loading,
    }
  })

export const makeSelectNip05ByPubkey = (pubkey: string) =>
  createSelector(
    selectNip05ByPubkey,
    (state: RootState) => makeSelectProfileByPubkey(pubkey)(state),
    (nip05ByPubkey, profile) => {
      if (!profile || !profile?.content.nip05) {
        return undefined
      }

      const nip05ForPubkey = nip05ByPubkey[pubkey]
      return nip05ForPubkey
    }
  )
