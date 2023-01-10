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

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
