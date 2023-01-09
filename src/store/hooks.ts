import { useSelector } from "react-redux"
import { useDispatch } from "./index"
import type { RootState } from "./index"
import { initRelays } from "./settingsSlice"

export const useInitRelays = () => {
  const dispatch = useDispatch()
  return () => dispatch(initRelays())
}

export const useUser = () => {
  const { user } = useSelector((state: RootState) => state.settings)

  return user
}

export const useRelays = () => {
  const { relays } = useSelector((state: RootState) => state.settings)

  return relays
}
