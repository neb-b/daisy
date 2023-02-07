import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import { nip04 } from "nostr-tools"
// import * as base64 from "@protobufjs/base64"
import * as secp from "@noble/secp256k1"
// import crypto from "isomorphic-webcrypto"
// import { decrypt } from "./nip04"
import base64 from "react-native-base64"
// import * as Crypto from "expo-crypto"
// import crypto from "react-native-crypto"
import crypto from "isomorphic-webcrypto"
import { Buffer } from "buffer/"
import { decrypt } from "react-native-aes-crypto"

import type { AppDispatch, GetState } from "store"
import { getNostrEvent, getNostrEvents, publishNote, nostrEventKinds } from "core/nostr"
import { noteMentionRegex } from "utils/note"
import { updateProfilesByPubkey } from "store/profilesSlice"
import { TextDecoder } from "text-encoding"

const utf8Decoder = new TextDecoder("utf-8")

export interface NotesState {
  loading: boolean
  notesById: Record<string, NostrNoteEvent | NostrRepostEvent>
  contactListsByPubkey: Record<string, NostrContactListEvent>
  feedsByIdOrPubkey: Record<string, string[]>
  feedsByPubkey: Record<string, string[]>
  loadingByIdOrPubkey: Record<string, boolean>
  reactionsByNoteId: Record<string, NostrReactionEvent[]>
  dmsByPubkey: Record<string, string[]>
}

const initialState = {
  notesById: {},
  feedsByIdOrPubkey: {},
  contactListsByPubkey: {},
  loadingByIdOrPubkey: {},
  reactionsByNoteId: {},
  dmsByPubkey: {},
} as NotesState

export const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    updateNotesById(state, action: PayloadAction<Record<string, NostrNoteEvent | NostrRepostEvent>>) {
      state.notesById = { ...state.notesById, ...action.payload }
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
    updateReactionsByNoteId(state, action: PayloadAction<Record<string, NostrReactionEvent[]>>) {
      state.reactionsByNoteId = { ...state.reactionsByNoteId, ...action.payload }
    },
    addDmForPubkey(state, action: PayloadAction<{ pubkey: string; id: string }>) {
      const { pubkey, id } = action.payload
      const currentIdsForPubkey = state.dmsByPubkey[pubkey] || []
      const currentIdsForPubkeySet = new Set(currentIdsForPubkey)
      currentIdsForPubkeySet.add(id)

      state.dmsByPubkey = { ...state.dmsByPubkey, [pubkey]: Array.from(currentIdsForPubkeySet) }
    },
  },
})

export const {
  updateNotesById,
  updatefeedsByIdOrPubkey,
  addNoteToFeedById,
  updateloadingByIdOrPubkey,
  updateReactionsByNoteId,
  addDmForPubkey,
} = notesSlice.actions

export const doFetchNote = (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl, relaysLoadingByUrl },
    notes: { notesById },
  } = getState()

  const relays = Object.values(relaysByUrl).filter(
    (relay) => relaysLoadingByUrl[relay.url] !== true && relay.status === 1
  )

  const note = notesById[noteId]

  if (note) {
    return
  }

  const filter = {
    ids: [noteId],
  }

  const event = await getNostrEvent(relays, filter)
  const noteEvent = event as NostrNoteEvent

  dispatch(updateNotesById({ [noteEvent.id]: noteEvent }))
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
  const { settings: settingsState, profiles: profilesState } = getState()
  const { contactListsByPubkey } = profilesState
  const contactList = contactListsByPubkey[settingsState.user.pubkey]
  const pubkeys = [settingsState.user.pubkey, ...contactList.tags.map((tag) => tag[1])]

  const filter = {
    authors: pubkeys,
    kinds: [nostrEventKinds.note, nostrEventKinds.repost],
  }

  dispatch(doPopulateFeed("following", filter))
}

export const doPopulateDMsFeed = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { settings: settingsState } = getState()

  const filter = {
    "#p": [settingsState.user.pubkey],
    kinds: [nostrEventKinds.dm],
  }

  dispatch(doPopulateFeed("dm", filter))
}

export const doPopulateThread = (noteId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    notes: { notesById },
  } = getState()

  const note = notesById[noteId]
  const replyIds = note.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
  const filteredReplyIds = replyIds.filter((id) => !notesById[id])

  const filter = {
    kinds: [nostrEventKinds.note],
    ids: filteredReplyIds,
    "#e": filteredReplyIds,
  }

  dispatch(doPopulateFeed(noteId, filter))
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

    const { pubkey, privateKey } = settingsState.user
    let reposts = []

    function getNormalizedX(key) {
      return key.slice(1, 33)
    }

    events.forEach(async (event: unknown) => {
      let note = event as NostrNoteEvent | NostrRepostEvent | NostrDMEvent

      if (note.kind === nostrEventKinds.dm) {
        try {
          console.log("\n")
          // const decoded = await nip04.decrypt(privateKey, pubkey, note.content)
          // note.content = decoded
          const data = note.content
          let [ctb64, ivb64] = data.split("?iv=")
          let key = secp.getSharedSecret(privateKey, "02" + pubkey)
          let normalizedKey = getNormalizedX(key)
          let cryptoKey = await crypto.subtle.importKey("raw", normalizedKey, { name: "AES-CBC" }, false, [
            "decrypt",
          ])

          console.log("cryptKey", cryptoKey)
          // console.log("ctb64", ctb64)
          let ciphertext = base64.decode(ctb64)
          // console.log("ciphertext", ciphertext)
          let iv = base64.decode(ivb64)
          try {
            // const buffer = Buffer.from(ciphertext)
            // console.log("getting plaintext", buffer)
            // let plaintext = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, buffer)
            // console.log("plaintext", plaintext)
            // let text = utf8Decoder.decode(plaintext)
            // console.log("text", text)
            const decryptData = await decrypt(ciphertext, normalizedKey, iv, "aes-256-cbc")
            console.log("??", decryptData)
          } catch (e) {
            console.log("error decrypt: ", e)
          }
        } catch (e) {
          console.log("e", e)
        }
        console.log("\n")
        dispatch(addDmForPubkey({ pubkey: note.pubkey, id: note.id }))
      }

      // Scan for note mentions in the note
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
        const newReactionsSet = new Set(newReactionsByNoteId[noteIdReactionIsFor])
        newReactionsSet.add(reaction)

        newReactionsByNoteId = {
          ...newReactionsByNoteId,
          noteIdReactionIsFor: Array.from(newReactionsSet),
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
