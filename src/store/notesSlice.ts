import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"
import type { Sub } from "nostr-tools"

import {
  getProfile,
  getNostrEvents,
  getEventsFromPubkeys,
  getEventsForPubkey,
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
  initialState,
  reducers: {
    updateNotesById(state, action: PayloadAction<Record<string, NostrNoteEvent>>) {
      state.notesById = { ...state.notesById, ...action.payload }
    },

    updateProfilesByPubkey(state, action: PayloadAction<Record<string, NostrProfile>>) {
      state.profilesByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },

    updateContactListsByPubkey(state, action: PayloadAction<Record<string, NostrContactListEvent>>) {
      state.contactListsByPubkey = { ...state.contactListsByPubkey, ...action.payload }
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
    settings: { relaysByUrl, relaysLoadingByUrl },
    notes: { profilesByPubkey },
  } = getState()

  const hasProfile = profilesByPubkey[pubkey]

  dispatch(updateloadingByIdOrPubkey({ [pubkey]: true }))

  const relays = Object.values(relaysByUrl).filter(
    (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
  )

  if (!hasProfile) {
    const { profile, contactList } = await getProfile(relays, pubkey)
    dispatch(updateProfilesByPubkey({ [pubkey]: profile }))
    dispatch(updateContactListsByPubkey({ [pubkey]: contactList }))
  }
}

export const doFetchProfileNotes = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl, relaysLoadingByUrl },
  } = getState()

  dispatch(updateloadingByIdOrPubkey({ [pubkey]: true }))

  const relays = Object.values(relaysByUrl).filter((relay) => relaysLoadingByUrl[relay.url] !== true)

  const { notes, profiles, related } = await getEventsFromPubkeys(relays, [pubkey], 20)

  dispatch(
    updateNotesAndProfiles({
      notes: [...notes, ...related],
      profiles,
    })
  )
  dispatch(updatefeedsByIdOrPubkey({ [pubkey]: Array.from(new Set(notes.map((note) => note.id))) }))
  dispatch(updateloadingByIdOrPubkey({ [pubkey]: false }))
  dispatch(doFetchReactionsForNotes([...notes, ...related].map((note) => note.id)))
}

export const doPopulateFollowingFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const { contactListsByPubkey } = notesState
  const contactList = contactListsByPubkey[settingsState.user.pubkey]
  const pubkeys = [settingsState.user.pubkey, ...contactList.tags.map((tag) => tag[1])]

  dispatch(updateloadingByIdOrPubkey({ following: true }))

  const { relaysByUrl, relaysLoadingByUrl } = settingsState
  const relays = Object.values(relaysByUrl).filter(
    (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
  )

  const { notes, profiles, related } = await getEventsFromPubkeys(relays, pubkeys)

  dispatch(
    updateNotesAndProfiles({
      notes: [...notes, ...related],
      profiles,
    })
  )

  dispatch(updatefeedsByIdOrPubkey({ following: Array.from(new Set(notes.map((note) => note.id))) }))
  dispatch(updateloadingByIdOrPubkey({ following: false }))

  const filter = {
    authors: pubkeys,
    kinds: [nostrEventKinds.note, nostrEventKinds.repost, nostrEventKinds.reaction],
    since: Math.floor(Date.now() / 1000),
  }

  const subscriptions = subscribeToNostrEvents(
    relays,
    filter,
    (note: NostrEvent, related?: NostrEvent[], profiles?: Record<string, NostrProfile>) => {
      if (note.kind === nostrEventKinds.reaction) {
        const { reactionsByNoteId } = getState().notes
        const noteIdReactionIsFor = note.tags.find((tag) => tag[0] === "e")?.[1]
        const currentReactions = reactionsByNoteId[noteIdReactionIsFor] || []

        // @ts-expect-error
        return dispatch(updateReactionsByNoteId({ [noteIdReactionIsFor]: [...currentReactions, note] }))
      }

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

  // After everything is setup, fetch reactions for the notes in the feed
  dispatch(doFetchReactionsForNotes([...notes, ...related].map((note) => note.id)))
}

export const doFetchReactionsForNotes =
  (noteIds: string[]) => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      settings: settingsState,
      notes: { reactionsByNoteId },
    } = getState()

    const { relaysByUrl, relaysLoadingByUrl } = settingsState
    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    const reactions = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.reaction],
      "#e": noteIds,
    })

    const newReactionsByNoteId = Object.assign({}, reactionsByNoteId)
    reactions.forEach((note: unknown) => {
      const reaction = note as NostrReactionEvent

      const noteIdReactionIsFor = reaction.tags.find((tag) => tag[0] === "e")?.[1]
      if (newReactionsByNoteId[noteIdReactionIsFor] === undefined) {
        newReactionsByNoteId[noteIdReactionIsFor] = [reaction]
      } else {
        newReactionsByNoteId[noteIdReactionIsFor].push(reaction)
      }
    })

    dispatch(updateReactionsByNoteId(newReactionsByNoteId))
  }

export const unsubscribeFromFollowingFeed = () => (dispatch: AppDispatch, getState: GetState) => {
  const { notes: notesState } = getState()
  const { subscriptionsById } = notesState

  subscriptionsById.following.forEach((subscription) => {
    subscription.unsub()
  })

  dispatch(updateSubscriptionsById({ following: [] }))
}

export const doFetchNotifications = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState } = getState()

  dispatch(updateloadingByIdOrPubkey({ notifications: true }))

  const { user, relaysByUrl, relaysLoadingByUrl } = settingsState
  const relays = Object.values(relaysByUrl).filter(
    (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
  )

  const { notes, profiles, related } = await getEventsForPubkey(relays, user.pubkey, 30)

  dispatch(
    updateNotesAndProfiles({
      notes: [...notes, ...related],
      profiles,
    })
  )

  dispatch(updatefeedsByIdOrPubkey({ notifications: Array.from(new Set(notes.map((note) => note.id))) }))
  dispatch(updateloadingByIdOrPubkey({ notifications: false }))
  dispatch(doFetchReactionsForNotes([...notes, ...related].map((note) => note.id)))
}

export const doFetchRepliesInThread =
  (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      settings: settingsState,
      notes: { notesById },
    } = getState()

    dispatch(updateloadingByIdOrPubkey({ [noteId]: true }))

    const note = notesById[noteId]
    const replyIds = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])

    const { notes, related, profiles, reactions } = await getReplies(
      Object.values(settingsState.relaysByUrl),
      [noteId, ...replyIds]
    )

    dispatch(updateloadingByIdOrPubkey({ [noteId]: false }))

    if (!notes.length && !reactions.length) {
      return
    }

    const fetched = [...notes, ...related]

    dispatch(updateNotesAndProfiles({ notes: fetched, profiles }))
    dispatch(updateReactionsByNoteId(reactions))
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
    const {
      settings: settingsState,
      notes: { notesById },
    } = getState()
    const {
      user: { pubkey, privateKey },
      relaysByUrl,
    } = settingsState

    if (!pubkey || !privateKey) {
      console.log("no user found")
      return
    }

    const tags = []
    if (replyId) {
      tags.push(["e", replyId])

      const reply = notesById[replyId]
      if (reply?.pubkey) {
        tags.push(["p", reply.pubkey])
      }
    } else if (repostOf) {
      tags.push(["e", repostOf])
    }

    const note = await publishNote(Object.values(relaysByUrl), { pubkey, privateKey }, kind, content, tags)

    dispatch(updateNotesById({ [note.id]: note }))
    dispatch(addNoteToFeedById({ feedId: "following", noteId: note.id }))
    if (onSuccess) {
      onSuccess()
    }
  }

export const doToggleFollow =
  (newFollowPubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState, notes: notesState } = getState()
    const {
      user: { pubkey, privateKey },
      relaysByUrl,
    } = settingsState
    const { contactListsByPubkey } = notesState
    const contactList = contactListsByPubkey[pubkey]
    const isCurrentlyFollowing = contactList.tags.some((tag) => tag[1] === newFollowPubkey)

    if (!contactList) {
      console.log("unable to find contactList")
      return
    }

    if (!pubkey || !privateKey) {
      console.log("no user found")
      return
    }

    let newTags = contactList.tags.slice()

    if (isCurrentlyFollowing) {
      // remove from following
      newTags = newTags.filter((tag) => tag[1] !== newFollowPubkey)
    } else {
      newTags.push(["p", newFollowPubkey])
    }

    await publishNote(
      Object.values(relaysByUrl),
      { pubkey, privateKey },
      nostrEventKinds.contactList,
      "",
      newTags
    )

    // TODO: only dispatch state if we get success from publishNote
    // currently seeing the contact list be saved, but not received as success from relays after publish
    dispatch(
      updateContactListsByPubkey({
        [pubkey]: {
          ...contactList,
          tags: newTags,
        },
      })
    )
  }

export const doLike = (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const {
    user: { pubkey, privateKey },
    relaysByUrl,
  } = settingsState

  if (!pubkey || !privateKey) {
    console.log("no user found")
    return
  }

  await publishNote(Object.values(relaysByUrl), { pubkey, privateKey }, nostrEventKinds.reaction, "+", [
    ["e", noteId],
  ])
}

export const doUpdateProfile =
  (profile: NostrProfileContent, onSuccess: () => void) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState } = getState()
    const {
      user: { pubkey, privateKey },
      relaysByUrl,
    } = settingsState

    if (!pubkey || !privateKey) {
      console.log("no user found")
      return
    }

    const profileResponse = (await publishNote(
      Object.values(relaysByUrl),
      { pubkey, privateKey },
      nostrEventKinds.profile,
      JSON.stringify(profile)
    )) as unknown

    const updatedProfile = profileResponse as NostrProfile
    try {
      updatedProfile.content = JSON.parse(updatedProfile.content)
    } catch (e) {}

    dispatch(updateProfilesByPubkey({ [pubkey]: updatedProfile }))
    onSuccess()
  }
