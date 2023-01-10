import React from "react"
import { useSelector } from "react-redux"
import { useDispatch } from "./index"
import type { RootState } from "./index"
import { initRelays } from "./settingsSlice"

export const useInitRelays = () => {
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(initRelays())
  }, [dispatch])
}

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

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
