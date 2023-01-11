import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"
import { getProfile, getEventsFromContactList, subscribeToContactList } from "core/nostr"

export interface NotesState {
  loading: boolean
  notesById: Record<string, NostrNoteEvent | NostrRepostEvent>
  profilesByPubkey: Record<string, NostrProfile>
  contactListsByPubkey: Record<string, NostrContactListEvent>
  feedsById: Record<string, string[]>
}

const initialState = {
  notesById: {},
  profilesByPubkey: {},
  feedsById: {},
  contactListsByPubkey: {},
  loading: false,
} as NotesState

export const notesSlice = createSlice({
  name: "notes",
  initialState: initialState,
  reducers: {
    updateNotesById(state, action: PayloadAction<Record<string, NostrNoteEvent>>) {
      state.notesById = { ...state.notesById, ...action.payload }
    },
    updateProfilesByPubkey(state, action: PayloadAction<Record<string, NostrProfile>>) {
      state.profilesByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },
    updateContactListsByPubkey(state, action: PayloadAction<Record<string, NostrContactListEvent>>) {
      // @ts-expect-error wtf
      state.contactListsByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },
    updateNotesAndProfiles(
      state,
      action: PayloadAction<{ notes: NostrEvent[]; profiles: Record<string, NostrProfile> }>
    ) {
      const { notes, profiles } = action.payload

      state.notesById = {
        ...state.notesById,
        ...notes.reduce((acc, note) => ({ ...acc, [note.id]: note }), {}),
      }
      state.profilesByPubkey = { ...state.profilesByPubkey, ...profiles }
      state.loading = false
    },
    updateFeedsById(state, action: PayloadAction<Record<string, string[]>>) {
      // TODO: handle pruning for other feed ids
      const { following } = action.payload
      const prunedFollowing = new Set(following)
      state.feedsById = { ...state.feedsById, following: Array.from(prunedFollowing) }
    },
    addNoteToFeedById(state, action: PayloadAction<{ feedId: string; noteId: string }>) {
      const { feedId, noteId } = action.payload

      const currentFeed = state.feedsById[feedId]
      const currentFeedSet = new Set(currentFeed)
      currentFeedSet.add(noteId)

      state.feedsById[feedId] = Array.from(currentFeedSet)
    },
  },
})

export const {
  updateNotesById,
  updateProfilesByPubkey,
  updateContactListsByPubkey,
  updateNotesAndProfiles,
  updateFeedsById,
  addNoteToFeedById,
} = notesSlice.actions

export const doFetchProfile = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relays },
  } = getState()

  const { profile, contactList } = await getProfile(relays, pubkey)

  dispatch(updateProfilesByPubkey({ [pubkey]: profile }))
  dispatch(updateContactListsByPubkey({ [pubkey]: contactList }))
}

export const doPopulateFollowingFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const { contactListsByPubkey } = notesState

  const contactList = contactListsByPubkey[settingsState.user.pubkey]

  const { notes, profiles } = await getEventsFromContactList(settingsState.relays, contactList)
  dispatch(updateNotesAndProfiles({ notes, profiles }))
  dispatch(updateFeedsById({ following: notes.map((note) => note.id) }))

  subscribeToContactList(settingsState.relays, contactList, (nostrEvent: NostrEvent) => {
    if (nostrEvent.kind === 1) {
      dispatch(
        updateNotesById({
          [nostrEvent.id]: nostrEvent,
        })
      )

      dispatch(addNoteToFeedById({ feedId: "following", noteId: nostrEvent.id }))
    }
  })
}
