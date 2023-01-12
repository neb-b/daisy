import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"
import {
  getProfile,
  getEventsFromContactList,
  subscribeToContactList,
  publishNote,
  nostrEventKinds,
} from "core/nostr"

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

  // subscribeToContactList(settingsState.relays, contactList, (nostrEvent: NostrEvent) => {
  //   if (nostrEvent.kind === 1) {
  //     dispatch(
  //       updateNotesById({
  //         [nostrEvent.id]: nostrEvent,
  //       })
  //     )

  //     dispatch(addNoteToFeedById({ feedId: "following", noteId: nostrEvent.id }))
  //   }
  // })
}

export const doPublishNote =
  (content: string, onSuccess: () => void) => async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState } = getState()
    const { user } = settingsState

    if (!user.pubkey || !user.privateKey) {
      console.log("no user found")
      return
    }

    // @ts-expect-error
    const note = await publishNote(settingsState.relays, settingsState.user, nostrEventKinds.note, content)
    dispatch(updateNotesById({ [note.id]: note }))
    dispatch(addNoteToFeedById({ feedId: "following", noteId: note.id }))
    onSuccess()
  }

export const doToggleFollow =
  (pubkey: string, isFollowing: boolean) => async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState, notes: notesState } = getState()
    const { user, relays } = settingsState
    const { contactListsByPubkey } = notesState
    const contactList = contactListsByPubkey[user.pubkey]

    if (!contactList) {
      console.log("unable to find contactList")
      return
    }

    if (!user.pubkey || !user.privateKey) {
      console.log("no user found")
      return
    }

    let newTags = contactList.tags.slice()

    if (isFollowing) {
      newTags.push(["p", pubkey])
    } else {
      newTags = newTags.filter((tag) => tag[1] !== pubkey)
    }

    const resolvedContactList = await publishNote(
      relays,
      // @ts-expect-error
      user,
      nostrEventKinds.contactList,
      "",
      newTags
    )
    // @ts-expect-error
    dispatch(updateContactListsByPubkey({ [user.pubkey]: resolvedContactList }))
  }
