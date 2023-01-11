import React from "react"
import { useSelector } from "react-redux"
import { useDispatch } from "./index"
import type { RootState } from "./index"

export const useUser = () => {
  const { user } = useSelector((state: RootState) => state.settings)

  return user
}

export const useProfile = (pubkey?: string) => {
  if (!pubkey) {
    return undefined
  }

  const { profilesByPubkey } = useSelector((state: RootState) => state.notes)
  return profilesByPubkey[pubkey]
}

export const useContactList = (pubkey?: string) => {
  if (!pubkey) {
    return undefined
  }

  const { contactListsByPubkey } = useSelector((state: RootState) => state.notes)
  return contactListsByPubkey[pubkey]
}

export const useFeed = (feedId: string) => {
  const { feedsById, notesById } = useSelector((state: RootState) => state.notes)
  const feed = feedsById[feedId]

  if (!feed) {
    return undefined
  }

  return feed
    .map((noteId) => notesById[noteId])
    .sort((a, b) => b.created_at - a.created_at)
    .map((note) => note.id)
}

export const useThread = (noteId: string) => {
  const notesById = useSelector((state: RootState) => state.notes.notesById)
  const note = notesById[noteId]

  // const note = {
  //   content: "Look closely. Specific key at the very bottom",
  //   created_at: 1673468678,
  //   id: "380b34c83bd9f44a7e1fe7c8940916e67305518799f9cf87915ea221af080a39",
  //   kind: 1,
  //   pubkey: "b93049a6e2547a36a7692d90e4baa809012526175546a17337454def9ab69d30",
  //   sig: "5de586a811442e8c03a26ca5054cbbb48f637132822ac2e214e7057ac3a6f00584cae83b9b46223344fe338bcfcc29ce0ef7b23bd43686210dd3a4e5261361f6",
  //   tags: [
  //     ["e", "577184dd8ff7bfd4eea1c7b32e22bd2283fb6720dfc2e8c330e3c2d4a3fdea0d", "wss://relay.damus.io"],
  //     ["e", "cf85866e3650864b4af9df5a34e8110d58e2686a7a964ce8aaa1ebec3c03dcbc"],
  //     ["p", "dc6e531596c52a218a6fae2e1ea359a1365d5eda02ec176c945ed06a9400ec72"],
  //     ["p", "5b0183ab6c3e322bf4d41c6b3aef98562a144847b7499543727c5539a114563e"],
  //   ],
  // }

  const otherNotesInThread = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
  console.log("otherNotesInThread", otherNotesInThread)
  return otherNotesInThread
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
