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
      .map((noteId) => notesById[noteId])
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

  const searchForReplies = (acc: string[], noteId: string) => {
    const note = notesById[noteId]

    if (!note) {
      return acc
    }

    const tags = note.tags || []
    const replyIds = tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])

    if (replyIds.length > 0) {
      acc.push(noteId)
      acc.push(...replyIds.reduce(searchForReplies, []))
    } else {
      acc.push(noteId)
    }

    return acc
  }

  const originalEventReplies = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
  const associatedReplies = originalEventReplies.reduce(searchForReplies, [])

  const prunedReplies = Array.from(new Set(associatedReplies))
  const notes = [...originalEventReplies, ...prunedReplies, noteId]
    .reduce((acc, id) => {
      if (notesById[id]) {
        return [...acc, notesById[id]]
      }

      return acc
    }, [])
    .sort((a, b) => a.created_at - b.created_at)
    .map((note) => note.id)

  return { notes, loading }
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
  for (var i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (note.kind === nostrEventKinds.repost) {
      const isMe = note.pubkey === user.pubkey
      const isNoteMatch = note.tags.find((tag) => tag[0] === "e")?.[1] === noteId

      if (isMe && isNoteMatch) {
        reposted = true
        break
      }
    }
  }

  return reposted
}

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
