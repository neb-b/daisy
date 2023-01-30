import { useSelector } from "react-redux"
import { nostrEventKinds } from "core/nostr"
import type { RootState } from "./index"

export const useUser = () => {
  const { user } = useSelector((state: RootState) => state.settings)

  return user
}

export const useProfile = (pubkey?: string) => {
  const { profilesByPubkey } = useSelector((state: RootState) => state.notes)

  if (!pubkey) {
    return undefined
  }

  return profilesByPubkey[pubkey]
}

export const useContactList = (pubkey?: string) => {
  const { contactListsByPubkey } = useSelector((state: RootState) => state.notes)

  if (!pubkey) {
    return undefined
  }

  return contactListsByPubkey[pubkey]
}

export const useFeed = (feedIdOrPubkey: string) => {
  const { feedsByIdOrPubkey, notesById, loadingByIdOrPubkey } = useSelector((state: RootState) => state.notes)
  const loading = loadingByIdOrPubkey[feedIdOrPubkey]

  const feed = feedsByIdOrPubkey[feedIdOrPubkey]

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
}

export const useProfileNotes = (pubkey: string) => {
  const { feedsByIdOrPubkey, notesById, loadingByIdOrPubkey } = useSelector((state: RootState) => state.notes)
  const loading = loadingByIdOrPubkey[pubkey]

  const feed = feedsByIdOrPubkey[pubkey]

  if (!feed) {
    return { notes: [], loading }
  }

  return {
    loading,
    notes: feed
      .reduce((acc, noteId) => {
        const note = notesById[noteId]

        if (note.kind === nostrEventKinds.repost || note.pubkey === pubkey) {
          // Only push note ids that I'm the author of
          return [...acc, note]
        }

        return acc
      }, [])
      .sort((a, b) => b.created_at - a.created_at)
      .map((note) => note.id),
  }
}

export const useThread = (noteId: string) => {
  const { notesById, loadingByIdOrPubkey } = useSelector((state: RootState) => state.notes)
  const note = notesById[noteId]
  const loading = loadingByIdOrPubkey[noteId]

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
      // console.log("hasDirectReply", directReplyNote)
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

  // console.log("\n???", repliesBetweenHighlightedNoteAndTopLevelNote)

  return {
    notes: [
      rootNoteId,
      ...repliesBetweenHighlightedNoteAndTopLevelNote.map((note) => note.id),
      // noteId,
      ...repliesToHighlightedNote,
    ],
    loading,
  }
}

export const useNote = (
  noteId: string
): (NostrNoteEvent | NostrRepostEvent) & {
  repostedBy?: string
  replyingToProfiles?: (NostrProfileEvent | string)[]
} => {
  const { notesById, profilesByPubkey } = useSelector((state: RootState) => state.notes)
  const note = notesById[noteId]

  if (!note) {
    return
  }

  // TODO: handle reposts of replies
  if (note.kind === 6) {
    const repostedId = note.tags.find((tag) => tag[0] === "e")?.[1]
    const repostedNote = notesById[repostedId]

    // console.log("repostedNote", repostedNote)
    if (!repostedNote) {
      return
    }

    return {
      repostedBy: note.pubkey,
      ...repostedNote,
    }
  }

  const replyingToPubkeys = note.tags.filter((tag) => tag[0] === "p").map((tag) => tag[1])
  const replyingToProfiles = replyingToPubkeys.map((pubkey) => profilesByPubkey[pubkey] || pubkey).slice(0, 3)

  if (replyingToProfiles.length > 0) {
    return {
      ...note,
      replyingToProfiles,
    }
  }

  return note
}

export const useReactions = (noteId: string) => {
  const {
    notes: { reactionsByNoteId },
    settings: { user },
  } = useSelector((state: RootState) => state)

  const reactions = reactionsByNoteId[noteId] || []
  let liked = false

  reactions.forEach((reaction) => {
    if (reaction.pubkey === user.pubkey) {
      liked = true
    }
  })

  return { reactions, liked }
}

export const useReposted = (noteId: string) => {
  const {
    notes: { notesById },
    settings: { user },
  } = useSelector((state: RootState) => state)

  const notes = Object.values(notesById)
  let reposted = false
  let count = 0

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (note.kind === nostrEventKinds.repost) {
      const isMe = note.pubkey === user.pubkey
      const isNoteMatch = note.tags.find((tag) => tag[0] === "e")?.[1] === noteId

      if (isNoteMatch) {
        count++
        if (isMe) {
          reposted = true
        }
      }
    }
  }

  return { repostedCount: count, reposted }
}

export const useRelaysByUrl = () => {
  const { relaysByUrl } = useSelector((state: RootState) => state.settings)

  return relaysByUrl
}

export const useRelaysLoadingByUrl = () => {
  const { relaysLoadingByUrl } = useSelector((state: RootState) => state.settings)

  return relaysLoadingByUrl
}

export const useHasRelayConnection = () => {
  const { relaysByUrl } = useSelector((state: RootState) => state.settings)

  return (
    relaysByUrl &&
    !!Object.values(relaysByUrl).find((relay) => relay.status === 1 && typeof relay.on === "function")
  )
}

export const useSubscriptionsByFeedId = (feedId) => {
  const { subscriptionsByFeedId } = useSelector((state: RootState) => state.subscriptions)

  return subscriptionsByFeedId[feedId] || []
}
