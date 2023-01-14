import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"
import type { Sub } from "nostr-tools"

import {
  getProfile,
  getEventsFromPubkeys,
  subscribeToNostrEvents,
  publishNote,
  nostrEventKinds,
  getReplies,
} from "core/nostr"

// TODO: store reactions/replies by id of the note they're reacting to?
export interface NotesState {
  loading: boolean
  notesById: Record<string, NostrNoteEvent | NostrRepostEvent>
  profilesByPubkey: Record<string, NostrProfile>
  contactListsByPubkey: Record<string, NostrContactListEvent>
  feedsByIdOrPubkey: Record<string, string[]>
  feedsByPubkey: Record<string, string[]>
  loadingByIdOrPubkey: Record<string, boolean>
  subscriptionsById: Record<string, Sub[]>
  reactionsByNoteId: Record<string, NostrReactionEvent[]>
}

const initialState = {
  notesById: {},
  profilesByPubkey: {},
  feedsByIdOrPubkey: {},
  contactListsByPubkey: {},
  loadingByIdOrPubkey: {},
  subscriptionsById: {},
  reactionsByNoteId: {},
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

    updatefeedsByIdOrPubkey(state, action: PayloadAction<Record<string, string[]>>) {
      state.feedsByIdOrPubkey = { ...state.feedsByIdOrPubkey, ...action.payload }
    },

    addNoteToFeedById(state, action: PayloadAction<{ feedId: string; noteId: string }>) {
      const { feedId, noteId } = action.payload

      const currentFeed = state.feedsByIdOrPubkey[feedId]
      const currentFeedSet = new Set(currentFeed)
      currentFeedSet.add(noteId)

      state.feedsByIdOrPubkey[feedId] = Array.from(currentFeedSet)
    },
    updateloadingByIdOrPubkey(state, action: PayloadAction<Record<string, boolean>>) {
      state.loadingByIdOrPubkey = { ...state.loadingByIdOrPubkey, ...action.payload }
    },
    updateSubscriptionsById(state, action: PayloadAction<Record<string, Sub[]>>) {
      state.subscriptionsById = { ...state.subscriptionsById, ...action.payload }
    },
    updateReactionsByNoteId(state, action: PayloadAction<Record<string, NostrReactionEvent[]>>) {
      state.reactionsByNoteId = { ...state.reactionsByNoteId, ...action.payload }
    },
  },
})

export const {
  updateNotesById,
  updateProfilesByPubkey,
  updateContactListsByPubkey,
  updateNotesAndProfiles,
  updatefeedsByIdOrPubkey,
  addNoteToFeedById,
  updateloadingByIdOrPubkey,
  updateSubscriptionsById,
  updateReactionsByNoteId,
} = notesSlice.actions

export const doFetchProfile = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relays },
    notes: { profilesByPubkey },
  } = getState()

  const hasProfile = profilesByPubkey[pubkey]

  dispatch(updateloadingByIdOrPubkey({ [pubkey]: true }))

  if (!hasProfile) {
    const { profile, contactList } = await getProfile(relays, pubkey)
    dispatch(updateProfilesByPubkey({ [pubkey]: profile }))
    dispatch(updateContactListsByPubkey({ [pubkey]: contactList }))
  }

  const { notes, profiles, related, reactions } = await getEventsFromPubkeys(relays, [pubkey])

  dispatch(
    updateNotesAndProfiles({
      notes: [...notes, ...related],
      profiles,
    })
  )
  dispatch(updatefeedsByIdOrPubkey({ [pubkey]: Array.from(new Set(notes.map((note) => note.id))) }))
  dispatch(updateloadingByIdOrPubkey({ [pubkey]: false }))
  dispatch(updateReactionsByNoteId(reactions))
}

export const doPopulateFollowingFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const { contactListsByPubkey } = notesState
  const contactList = contactListsByPubkey[settingsState.user.pubkey]
  const pubkeys = [settingsState.user.pubkey, ...contactList.tags.map((tag) => tag[1])]

  dispatch(updateloadingByIdOrPubkey({ following: true }))

  const { notes, profiles, related, reactions } = await getEventsFromPubkeys(settingsState.relays, pubkeys)

  dispatch(
    updateNotesAndProfiles({
      notes: [...notes, ...related],
      profiles,
    })
  )

  dispatch(updateReactionsByNoteId(reactions))
  dispatch(updatefeedsByIdOrPubkey({ following: Array.from(new Set(notes.map((note) => note.id))) }))
  dispatch(updateloadingByIdOrPubkey({ following: false }))

  const filter = {
    authors: pubkeys,
    kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    since: Math.floor(Date.now() / 1000),
  }

  const subscriptions = subscribeToNostrEvents(
    settingsState.relays,
    filter,
    (note: NostrEvent, related: NostrEvent[], profiles: Record<string, NostrProfile>) => {
      dispatch(
        updateNotesAndProfiles({
          notes: [note, ...related],
          profiles,
        })
      )
      dispatch(addNoteToFeedById({ feedId: "following", noteId: note.id }))
    }
  )

  dispatch(updateSubscriptionsById({ following: subscriptions }))
}

export const unsubscribeFromFollowingFeed = () => (dispatch: AppDispatch, getState: GetState) => {
  const { notes: notesState } = getState()
  const { subscriptionsById } = notesState

  subscriptionsById.following.forEach((subscription) => {
    subscription.unsub()
  })

  dispatch(updateSubscriptionsById({ following: [] }))
}

export const doFetchReplies = (noteIds: string[]) => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState } = getState()

  const loadingState = noteIds.reduce((acc, noteId) => ({ ...acc, [noteId]: true }), {})
  dispatch(updateloadingByIdOrPubkey(loadingState))

  const replies = await getReplies(settingsState.relays, noteIds)
  const finishedLoadingState = noteIds.reduce((acc, noteId) => ({ ...acc, [noteId]: false }), {})
  dispatch(updateloadingByIdOrPubkey(finishedLoadingState))

  if (!replies.length) {
    return
  }

  const repliesMap = replies.reduce((acc, reply) => ({ ...acc, [reply.id]: reply }), {})

  dispatch(updateNotesById(repliesMap))
}

export const doPublishNote =
  ({
    content,
    kind,
    replyId,
    repostOf,
    onSuccess,
  }: {
    content: string
    kind: NostrEventKind
    replyId?: string
    repostOf?: string
    onSuccess?: () => void
  }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState } = getState()
    const { user } = settingsState

    if (!user.pubkey || !user.privateKey) {
      console.log("no user found")
      return
    }

    let tags = []
    if (replyId) {
      tags.push(["e", replyId])
    } else if (repostOf) {
      tags.push(["e", repostOf])
    }

    const note = await publishNote(
      settingsState.relays,
      // @ts-expect-error
      settingsState.user,
      kind,
      content,
      tags
    )

    dispatch(updateNotesById({ [note.id]: note }))
    dispatch(addNoteToFeedById({ feedId: "following", noteId: note.id }))
    if (onSuccess) {
      onSuccess()
    }
  }

export const doToggleFollow = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const { user, relays } = settingsState
  const { contactListsByPubkey } = notesState
  const contactList = contactListsByPubkey[user.pubkey]
  const isFollowing = contactList.tags.some((tag) => tag[1] === pubkey)

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
    newTags = newTags.filter((tag) => tag[1] !== pubkey)
  } else {
    newTags.push(["p", pubkey])
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

export const doLike = (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const {
    user: { pubkey, privateKey },
    relays,
  } = settingsState

  if (!pubkey || !privateKey) {
    console.log("no user found")
    return
  }

  const nostrEvent = (await publishNote(relays, { pubkey, privateKey }, nostrEventKinds.reaction, "🤙", [
    ["e", noteId],
  ])) as unknown

  const reaction = nostrEvent as NostrReactionEvent

  if (reaction.id) {
    const currentReactions = notesState.reactionsByNoteId[noteId] || []

    dispatch(updateReactionsByNoteId({ [noteId]: [...currentReactions, reaction] }))
  }
}
