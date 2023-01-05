import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface NotesState {
  loading: boolean
  notesById: Record<string, NostrNoteEvent>
  profilesByPubkey: Record<string, NostrProfileEvent>
  contactListByPubkey: Record<string, NostrContactListEvent>
  feedByChannelId: Record<string, string[]>
}

const initialState = {
  notesById: {},
  profilesByPubkey: {},
  feedByChannelId: {},
  contactListByPubkey: {},
  loading: false,
} as NotesState

export const notesSlice = createSlice({
  name: "notes",
  initialState: initialState,
  reducers: {
    updateNotesById(state, action: PayloadAction<Record<string, NostrNoteEvent>>) {
      state.notesById = { ...state.notesById, ...action.payload }
    },
    updateProfilesByPubkey(state, action: PayloadAction<Record<string, NostrProfileEvent>>) {
      state.profilesByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },
    updateContactListByPubkey(state, action: PayloadAction<Record<string, NostrContactListEvent>>) {
      state.contactListByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },
    updateNotesAndProfiles(
      state,
      action: PayloadAction<{ notes: NostrEvent[]; profiles: Record<string, NostrProfileEvent> }>
    ) {
      const { notes, profiles } = action.payload

      state.notesById = {
        ...state.notesById,
        ...notes.reduce((acc, note) => ({ ...acc, [note.id]: note }), {}),
      }
      state.profilesByPubkey = { ...state.profilesByPubkey, ...profiles }
      state.loading = false
    },
    updateFeedByChannelId(state, action: PayloadAction<Record<string, string[]>>) {
      state.feedByChannelId = { ...state.feedByChannelId, ...action.payload }
    },
  },
})

export const {
  updateNotesById,
  updateProfilesByPubkey,
  updateContactListByPubkey,
  updateNotesAndProfiles,
  updateFeedByChannelId,
} = notesSlice.actions
