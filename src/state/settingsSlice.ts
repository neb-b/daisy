import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

type theme = "light" | "dark" | "system"

export interface SettingsState {
  theme: theme
  user: {
    pubkey?: string
    privateKey?: string
  }
}

const initialState = {
  theme: "dark",
  user: {},
} as SettingsState

export const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    updateTheme(state, action: PayloadAction<theme>) {
      state.theme = action.payload
    },
    updateUser(state, action: PayloadAction<SettingsState["user"]>) {
      state.user = action.payload
    },
  },
})

export const { updateTheme, updateUser } = settingsSlice.actions
