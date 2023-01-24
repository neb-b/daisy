import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"
import type { Sub } from "nostr-tools"

import {
  getProfile,
  getNostrEvents,
  getEventsFromPubkeys,
  getEventsForPubkey,
  publishNote,
  nostrEventKinds,
  getReplies,
} from "core/nostr"
import { noteMentionRegex } from "utils/note"

export interface NotesState {
  loading: boolean
  notesById: Record<string, NostrNoteEvent | NostrRepostEvent>
  profilesByPubkey: Record<string, NostrProfile>
  contactListsByPubkey: Record<string, NostrContactListEvent>
  feedsByIdOrPubkey: Record<string, string[]>
  feedsByPubkey: Record<string, string[]>
  loadingByIdOrPubkey: Record<string, boolean>
  reactionsByNoteId: Record<string, NostrReactionEvent[]>
}

const initialState = {
  notesById: {},
  profilesByPubkey: {},
  feedsByIdOrPubkey: {},
  contactListsByPubkey: {},
  loadingByIdOrPubkey: {},
  reactionsByNoteId: {},
} as NotesState

export const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    updateNotesById(state, action: PayloadAction<Record<string, NostrNoteEvent | NostrRepostEvent>>) {
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

export const doPopulateNotificationsFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState } = getState()

  const filter = {
    "#p": [settingsState.user.pubkey],
    kinds: [nostrEventKinds.note, nostrEventKinds.repost],
  }

  dispatch(doPopulateFeed("notifications", filter))
}

export const doPopulateFollowingFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState, notes: notesState } = getState()
  const { contactListsByPubkey } = notesState
  const contactList = contactListsByPubkey[settingsState.user.pubkey]
  const pubkeys = [settingsState.user.pubkey, ...contactList.tags.map((tag) => tag[1])]

  const filter = {
    authors: pubkeys,
    kinds: [nostrEventKinds.note, nostrEventKinds.repost],
  }

  dispatch(doPopulateFeed("following", filter))
}

export const doPopulateProfileFeed =
  (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const filter = {
      authors: [pubkey],
      kinds: [nostrEventKinds.note, nostrEventKinds.repost],
    }

    dispatch(doPopulateFeed(pubkey, filter))
  }

const doPopulateFeed =
  (feedId: string, filter: NostrFilter) => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      settings: settingsState,
      notes: { feedsByIdOrPubkey, notesById },
    } = getState()

    const { relaysByUrl, relaysLoadingByUrl } = settingsState
    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    const currentNotesById = Object.assign({}, notesById)
    const currentFeed = feedsByIdOrPubkey[feedId] || []

    let latestNoteInFeed
    for (var i = 0; i < currentFeed.length; i++) {
      const noteId = currentFeed[i]
      const note = currentNotesById[noteId]

      if (!note) {
        return
      }

      if (!latestNoteInFeed) {
        latestNoteInFeed = note
      } else {
        if (latestNoteInFeed.created_at > note.created_at) {
          latestNoteInFeed = note
        }
      }
    }

    const updatedFilter = latestNoteInFeed
      ? {
          ...filter,
          since: latestNoteInFeed.created_at,
        }
      : filter

    dispatch(updateloadingByIdOrPubkey({ [feedId]: true }))

    const events = await getNostrEvents(relays, updatedFilter)

    const profilePubkeySet = new Set<string>()
    const repostIdSet = new Set<string>()
    const mentionsSet = new Set<string>()

    let reposts = []
    events.forEach((event: unknown) => {
      const note = event as NostrNoteEvent | NostrRepostEvent

      const mentions = note.content.match(noteMentionRegex) || []
      for (var i = 0; i < mentions.length; i++) {
        const mention = mentions[i]
        const tagIndex = mention.match(/#\[([0-9]+)]/)[1]
        const tag = note.tags[tagIndex]
        if (tag && tag[0] === "e") {
          mentionsSet.add(tag[1])
          break
        }
      }

      // Find users that need to be fetched
      profilePubkeySet.add(note.pubkey)
      note.tags.forEach((tag) => {
        if (tag[0] === "p") {
          profilePubkeySet.add(tag[1])
        }
      })

      if (note.kind === nostrEventKinds.repost) {
        const repost = event as NostrRepostEvent
        const parentNoteIdFromRepost = repost.tags.find((tag) => tag[0] === "e")?.[1]

        try {
          const repostedEvent = JSON.parse(repost.content)
          profilePubkeySet.add(repostedEvent.pubkey)
          reposts = [...reposts, repostedEvent]
        } catch (e) {
          // No data encoded in the repost event
          // Need to fetch it separately
          if (!events.find((event) => event.id === parentNoteIdFromRepost)) {
            repostIdSet.add(parentNoteIdFromRepost)
          }
        }
      }
    })

    dispatch(
      updateNotesById([...events, ...reposts].reduce((acc, note) => ({ ...acc, [note.id]: note }), {}))
    )

    let additionalNotes = []
    if (repostIdSet.size > 0 || mentionsSet.size > 0) {
      const combinedSet = new Set([...repostIdSet, ...mentionsSet])
      additionalNotes = await getNostrEvents(relays, {
        kinds: [nostrEventKinds.note],
        ids: Array.from(combinedSet),
        limit: combinedSet.size,
      })

      additionalNotes.forEach((repost) => {
        profilePubkeySet.add(repost.pubkey)
      })
    }

    const profiles = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.profile],
      authors: Array.from(profilePubkeySet),
      limit: profilePubkeySet.size,
    })

    dispatch(
      updateProfilesByPubkey(profiles.reduce((acc, profile) => ({ ...acc, [profile.pubkey]: profile }), {}))
    )
    dispatch(
      updateNotesById({
        ...additionalNotes.reduce((acc, note) => ({ ...acc, [note.id]: note }), {}),
      })
    )

    dispatch(updatefeedsByIdOrPubkey({ [feedId]: events.map((note) => note.id) }))
    dispatch(doFetchReactionsForNotes([...events, ...reposts, ...additionalNotes].map((note) => note.id)))
    dispatch(updateloadingByIdOrPubkey({ [feedId]: false }))
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

    let newReactionsByNoteId = Object.assign({}, reactionsByNoteId)
    reactions.forEach((note: unknown) => {
      const reaction = note as NostrReactionEvent

      const noteIdReactionIsFor = reaction.tags.find((tag) => tag[0] === "e")?.[1]
      if (newReactionsByNoteId[noteIdReactionIsFor] === undefined) {
        newReactionsByNoteId[noteIdReactionIsFor] = [reaction]
      } else {
        newReactionsByNoteId = {
          ...newReactionsByNoteId,
          noteIdReactionIsFor: [...newReactionsByNoteId[noteIdReactionIsFor], reaction],
        }
      }
    })

    dispatch(updateReactionsByNoteId(newReactionsByNoteId))
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
      relaysLoadingByUrl,
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

    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    const note = await publishNote(relays, { pubkey, privateKey }, kind, content, tags)

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
      relaysLoadingByUrl,
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

    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    await publishNote(relays, { pubkey, privateKey }, nostrEventKinds.contactList, "", newTags)

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
      relaysLoadingByUrl,
    } = settingsState

    if (!pubkey || !privateKey) {
      console.log("no user found")
      return
    }

    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    const profileResponse = (await publishNote(
      relays,
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
