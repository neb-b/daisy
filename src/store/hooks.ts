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

  // const val = {
  //   content: "I thought it was an old school movie camera this whole time 😂",
  //   created_at: 1673501905,
  //   id: "fe2fc17a69b289f584d6cfe7569fbb8e9356317821daf2b8a4663d532ee8414b",
  //   kind: 1,
  //   pubkey: "dedf91f5c5eee3f3864eec34b28fc99c6a8cc44b250888ccf4d0d8d854f48d54",
  //   sig: "0b4618196940f17c3ba31ff8d55cdd1b462651053fa410d8157b8185d5f4735524c962414f59508c9b77f552c360f18bc03a8ca6eeeae2e54fe5716f2ba0418d",
  //   tags: [
  //     ["e", "76c666991c7b78ea0d7a5e469a44f9b135bc9b80a074960d527dcca4bb5efebd"],
  //     ["p", "bf2376e17ba4ec269d10fcc996a4746b451152be9031fa48e74553dde5526bce"],
  //   ],
  // }

  // const other = {
  //   content: "TIL this is a hug 🫂🤯",
  //   created_at: 1673495541,
  //   id: "76c666991c7b78ea0d7a5e469a44f9b135bc9b80a074960d527dcca4bb5efebd",
  //   kind: 1,
  //   pubkey: "bf2376e17ba4ec269d10fcc996a4746b451152be9031fa48e74553dde5526bce",
  //   sig: "5b832addd06d02bd3f83c1556fa1c408f2426f4ae435bc8020d9b3245d3c01579fbb932b5dd5e9cb97740f1c5f21c4ab8b9bcf0420cc4edcdadeba76739969f3",
  //   tags: [],
  // }
}

export const useNote = (
  noteId: string,
  ignoreReplies: boolean = false
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

  // Ignore replies
  // This may happen if we are already requesting a reply
  // Don't want to go forever
  if (!ignoreReplies) {
    const replyId = note.tags.find((tag) => tag[0] === "e")?.[1]
    const reply = notesById[replyId]
    if (replyId) {
      return {
        ...note,
        reply,
      }
    }
  }

  return note
}

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
