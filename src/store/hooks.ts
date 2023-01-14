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
  const notes = [...prunedReplies, noteId]
    .map((id) => notesById[id])
    .sort((a, b) => a.created_at - b.created_at)
    .map((note) => note.id)

  return { notes: notes, loading }
}

export const useNote = (
  noteId: string
): (NostrNoteEvent | NostrRepostEvent) & {
  repostedBy?: string
  reply?: NostrNoteEvent | NostrRepostEvent
} => {
  const { notesById } = useSelector((state: RootState) => state.notes)
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

  const replyId = note.tags.find((tag) => tag[0] === "e")?.[1]
  const reply = notesById[replyId]
  if (replyId) {
    return {
      ...note,
      reply,
    }
  }

  return note
}

export const useReactions = (noteId: string) => {
  const { reactionsByNoteId } = useSelector((state: RootState) => state.notes)
  const { user } = useSelector((state: RootState) => state.settings)

  const reactions = reactionsByNoteId[noteId] || []
  let liked = false

  reactions.forEach((reaction) => {
    if (reaction.pubkey === user.pubkey) {
      liked = true
    }
  })

  return { reactions, liked }
}

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
