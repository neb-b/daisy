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

  //
  // this probably needs recursion
  //

  const initialIdsToFind = new Set<string>([noteId])

  // find notes we have that are replies to this note
  Object.values(notesById).forEach((note) => {
    note.tags.forEach((tag) => {
      if (tag[0] === "e" && tag[1] === noteId) {
        initialIdsToFind.add(note.id)
      }
    })
  })

  // see if this note is a reply to anyone
  note.tags.find((tag) => {
    if (tag[0] === "e") {
      initialIdsToFind.add(tag[1])
    }
  })

  const secondaryRepliesToFind = new Set<string>()
  Array.from(initialIdsToFind).forEach((replyId) => {
    const reply = notesById[replyId]
    if (!reply) {
      return
    }
    reply.tags.find((tag) => {
      if (tag[0] === "e") {
        secondaryRepliesToFind.add(tag[1])
      }
    })
  })

  // This should keep going until it doesn't find any, recursively
  // I think

  const mergedReplies = new Set([...initialIdsToFind, ...secondaryRepliesToFind])

  // wtf lol
  Object.values(notesById).forEach((note) => {
    note.tags.forEach((tag) => {
      if (tag[0] === "e" && mergedReplies.has(tag[1])) {
        mergedReplies.add(note.id)
      }
    })
  })

  const notes = [...Array.from(mergedReplies)]
    .reduce((acc, replyId) => {
      const reply = notesById[replyId]
      if (!reply) {
        return acc
      }

      acc.push(reply)
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
