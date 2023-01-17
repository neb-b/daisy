import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Relay } from "nostr-tools"
import type { AppDispatch, GetState } from "store"
import { defaultRelays, connectToRelay } from "core/nostr"

type theme = "light" | "dark" | "system"

export interface SettingsState {
  theme: theme
  user: {
    pubkey?: string
    privateKey?: string
  }
  relayState: Record<string, Relay>
}

const initialState = {
  theme: "dark",
  user: {},
  relayState: {},
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
    updateRelays(state, action: PayloadAction<Record<string, Relay>>) {
      state.relayState = { ...state.relayState, ...action.payload }
    },
    logout: (state) => {
      state.user = {}
    },
  },
})

export const { updateRelays, updateTheme, updateUser, logout } = settingsSlice.actions

// TODO: if a relay has an issue unusb and remove from store
export const initRelays = () => async (dispatch: AppDispatch, getState: GetState) => {
  const promises = defaultRelays.map((relay) => connectToRelay(relay))
  const results = await Promise.all(promises)
  const relayMap = results.reduce((acc, result) => {
    if (result.success) {
      acc[result.relay.url] = result.relay
    }
    return acc
  }, {})

  console.log("update relays", relayMap)
  return dispatch(updateRelays(relayMap))
}

export const doToggleRelay = (relayUrl: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relayState },
  } = getState()

  console.log("closing relay", relayUrl)
  const relay = relayState[relayUrl]
  await relay.close()
  dispatch(updateRelays({ [relayUrl]: relay }))
}
