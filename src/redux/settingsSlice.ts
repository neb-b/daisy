import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

type theme = "light" | "dark" | "system"

export interface SettingsState {
  theme: theme
  pub: string
  priv: string
}

const initialState = {
  theme: "dark",
  pub: "cbf904c0702a361911c46d79379a6a502bc3bd0b4c56d25389e62d3ebf4a7db8",
} as SettingsState

export const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    updateTheme(state, action: PayloadAction<theme>) {
      state.theme = action.payload
    },
  },
})

export const { updateTheme } = settingsSlice.actions
