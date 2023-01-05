import { configureStore } from "@reduxjs/toolkit"
import { notesSlice } from "./notesSlice"
import { settingsSlice } from "./settingsSlice"
import type { NotesState } from "./notesSlice"
import type { SettingsState } from "./settingsSlice"

export interface RootState {
  notes: NotesState
  settings: SettingsState
}

export const store = configureStore({
  reducer: {
    notes: notesSlice.reducer,
    settings: settingsSlice.reducer,
  },
})
