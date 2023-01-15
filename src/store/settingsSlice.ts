import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Relay } from "nostr-tools"
import type { AppDispatch } from "store"
import { defaultRelays, connectToRelay } from "core/nostr"

type theme = "light" | "dark" | "system"

export interface SettingsState {
  theme: theme
  user: {
    pubkey?: string
    privateKey?: string
  }
  relays: Relay[]
}

const initialState = {
  theme: "dark",
  user: {},
  relays: [],
} as SettingsState

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateTheme(state, action: PayloadAction<theme>) {
      state.theme = action.payload
    },
    updateUser(state, action: PayloadAction<SettingsState["user"]>) {
      state.user = action.payload
    },
    updateRelays(state, action: PayloadAction<Relay[]>) {
      state.relays = action.payload
    },
    logout: (state) => {
      state.user = {}
    },
  },
})

export const { updateRelays, updateTheme, updateUser, logout } = settingsSlice.actions

// TODO: if a relay has an issue unusb and remove from store
export const initRelays = () => async (dispatch: AppDispatch) => {
  const promises = defaultRelays.map((relay) => connectToRelay(relay))
  const results = await Promise.all(promises)
  return dispatch(updateRelays(results.filter((relay) => relay.success).map((relay) => relay.relay)))
}
