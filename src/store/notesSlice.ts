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

// const noteWithMention  = {
//   content: "Welcome to the nostr family 🔮⚡️ This should be helpful: #[2]",
//   created_at: 1674514887,
//   id: "e444b0bfe7bdb0da9c580908e5ece6bbfb0764f527ca8ab72d6dac06d48f5694",
//   kind: 1,
//   pubkey: "b93049a6e2547a36a7692d90e4baa809012526175546a17337454def9ab69d30",
//   replyingToProfiles: ["136c80140d71cad202d9d493b19fbe77f4314ce4a57e2a1e4f82842861262d31"],
//   sig: "d5413a4cc707dde88993f2beb229897faf171b100a8135ba7e11c9130fe6faa82de64158e652dbc4b0178355f4c757f10b7583a5dbd479cbc01c328750e3cb82",
//   tags: [
//     ["e", "3ab90aa420bff4d5181e3741af51c80f935be1b4afc5d916641cb518b62a4850"],
//     ["p", "136c80140d71cad202d9d493b19fbe77f4314ce4a57e2a1e4f82842861262d31"],
//     ["e", "5222361b78833d775dfb6a47e6dc0b5fbc761c4c11e34ce0315f5dd4bec0a318"],
//   ],
// }

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

const doPopulateFeed =
  (feedId: string, filter: NostrFilter) => async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState, notes: notesState } = getState()

    const { relaysByUrl, relaysLoadingByUrl } = settingsState
    const relays = Object.values(relaysByUrl).filter(
      (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
    )

    dispatch(updateloadingByIdOrPubkey({ [feedId]: true }))

    const events = await getNostrEvents(relays, filter)

    const profilePubkeySet = new Set<string>()
    const repostIdSet = new Set<string>()

    let reposts = []
    events.forEach((event: unknown) => {
      const note = event as NostrNoteEvent | NostrRepostEvent

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

    let additionalReposts = []
    if (repostIdSet.size > 0) {
      additionalReposts = await getNostrEvents(relays, {
        kinds: [nostrEventKinds.note],
        ids: Array.from(repostIdSet),
      })

      additionalReposts.forEach((repost) => {
        profilePubkeySet.add(repost.pubkey)
      })
    }

    console.log("fetching profiles")
    const profiles = await getNostrEvents(relays, {
      kinds: [nostrEventKinds.profile],
      authors: Array.from(profilePubkeySet),
      limit: profilePubkeySet.size,
    })
    console.log("fetched profiles: ", profiles.length)

    dispatch(
      updateProfilesByPubkey(profiles.reduce((acc, profile) => ({ ...acc, [profile.pubkey]: profile }), {}))
    )
    dispatch(updatefeedsByIdOrPubkey({ [feedId]: events.map((note) => note.id) }))
    dispatch(updateloadingByIdOrPubkey({ [feedId]: false }))
    dispatch(doFetchReactionsForNotes([...events, ...reposts].map((note) => note.id)))
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

export const doFetchRepliesInThread =
  (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      settings: settingsState,
      notes: { notesById },
    } = getState()

    dispatch(updateloadingByIdOrPubkey({ [noteId]: true }))

    const note = notesById[noteId]
    const replyIds = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])

    const { notes, related, profiles } = await getReplies(Object.values(settingsState.relaysByUrl), [
      noteId,
      ...replyIds,
    ])

    dispatch(updateloadingByIdOrPubkey({ [noteId]: false }))

    if (!notes.length) {
      return
    }

    const fetched = [...notes, ...related]

    dispatch(updateNotesAndProfiles({ notes: fetched, profiles }))
    dispatch(doFetchReactionsForNotes(fetched.map((note) => note.id)))
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
