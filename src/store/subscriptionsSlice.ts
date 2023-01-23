import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Sub } from "nostr-tools"

import { getNostrEvent, getNostrEvents, nostrEventKinds } from "core/nostr"
import type { AppDispatch, GetState } from "store"
import {
  updateReactionsByNoteId,
  updateNotesById,
  addNoteToFeedById,
  updateProfilesByPubkey,
} from "./notesSlice"

type Subscription = {
  url: string
  sub: Sub
}

export interface NotesState {
  subscriptionsByFeedId: Record<string, Subscription[]>
}

const initialState = {
  subscriptionsByFeedId: {},
} as NotesState

export const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    updateSubscriptionsByFeedId(state, action: PayloadAction<Record<string, Subscription[]>>) {
      state.subscriptionsByFeedId = { ...state.subscriptionsByFeedId, ...action.payload }
    },
  },
})

export const { updateSubscriptionsByFeedId } = subscriptionsSlice.actions

export const doSubscribeToRelays =
  (feedId: "following" | "notifications") => async (dispatch: AppDispatch, getState: GetState) => {
    const { settings: settingsState, notes: notesState } = getState()
    const { relaysByUrl } = settingsState
    const { contactListsByPubkey } = notesState
    const contactList = contactListsByPubkey[settingsState.user.pubkey]
    const pubkeys = [settingsState.user.pubkey, ...contactList.tags.map((tag) => tag[1])]
    const relays = Object.values(relaysByUrl)

    const filters = {
      following: {
        authors: pubkeys,
        kinds: [nostrEventKinds.note, nostrEventKinds.repost, nostrEventKinds.reaction],
        since: Math.floor(Date.now() / 1000),
      },
      notifications: {
        "#p": [settingsState.user.pubkey],
        kinds: [nostrEventKinds.note, nostrEventKinds.repost],
        since: Math.floor(Date.now() / 1000),
      },
    }

    const filter = filters[feedId]

    let subscriptions: Subscription[] = []
    const eventHistoryMap: Record<string, boolean> = {}

    relays.forEach((relay) => {
      if (!relay.sub) {
        return
      }

      try {
        const sub = relay.sub([{ ...filter }])
        subscriptions = [...subscriptions, { url: relay.url, sub }]

        sub.on("event", async (event: unknown) => {
          const {
            notes: { reactionsByNoteId, profilesByPubkey, notesById },
          } = getState()

          const eventId = (event as NostrEvent).id
          const eventKind = (event as NostrEvent).kind
          const eventPubkey = (event as NostrEvent).pubkey

          // Save event so we don't process it again
          if (eventHistoryMap[eventId]) {
            return
          }

          eventHistoryMap[eventId] = true

          //
          // No associated data is needed for reaction events
          // This may change when there is a view for reactions on a post
          //
          if (eventKind === nostrEventKinds.reaction) {
            const reaction = event as NostrReactionEvent
            const parentNoteFromReaction = reaction.tags.find((tag) => tag[0] === "e")[1]

            const currentReactionsForNoteId = reactionsByNoteId[parentNoteFromReaction] || []
            const newReactionsForNoteId = [...currentReactionsForNoteId, reaction]

            dispatch(updateReactionsByNoteId({ [parentNoteFromReaction]: newReactionsForNoteId }))
            return
          }

          // Event is a note or repost
          // Add it to the feed, then determine what data needs to be fetched
          dispatch(addNoteToFeedById({ feedId, noteId: eventId }))

          const pubkeysInEvent = {
            [eventPubkey]: true,
          }
          const idsInEvent = {
            [eventId]: true,
          }

          //
          // For reposts, the reposted note might be encoded in the newly received event
          // If it is, extract it and add it to redux
          // If not, fetch the event then add it
          //
          if (eventKind === nostrEventKinds.repost) {
            const repost = event as NostrRepostEvent
            const parentNoteIdFromRepost = repost.tags.find((tag) => tag[0] === "e")[1]
            idsInEvent[parentNoteIdFromRepost] = true

            const repostedNoteAlreadyExists = notesById[parentNoteIdFromRepost]

            let foundRepostDataEncodedInEvent = false

            if (!repostedNoteAlreadyExists) {
              const { content: stringifedContent } = repost
              if (stringifedContent !== "") {
                try {
                  const repostedEvent = JSON.parse(stringifedContent)
                  pubkeysInEvent[repostedEvent.pubkey] = true
                  foundRepostDataEncodedInEvent = true
                  dispatch(updateNotesById({ [repostedEvent.id]: repostedEvent }))
                } catch (e) {}
              }

              if (!foundRepostDataEncodedInEvent) {
                // Data is not encoded in the repost event, so fetch it
                const parentNote = (await getNostrEvent(relays, {
                  ids: [parentNoteIdFromRepost],
                })) as NostrNoteEvent
                pubkeysInEvent[parentNote.pubkey] = true
                dispatch(updateNotesById({ [eventId]: parentNote }))
              }
            }
          }

          if (eventKind === nostrEventKinds.note) {
            const note = event as NostrNoteEvent
            const pubkeysInNote = note.tags.filter((tag) => tag[0] === "p").map((tag) => tag[1])
            idsInEvent[note.id] = true

            pubkeysInNote.forEach((pubkey) => {
              pubkeysInEvent[pubkey] = true
            })
          }

          //
          // Fetch profile data for all associated pubkeys with this new event
          // Possibly the profile data of a reposted note, or reply info
          // Strip out profiles that have already been fetched first
          //
          const pubkeysToFetch = Object.keys(pubkeysInEvent).filter((pubkey) => {
            return !profilesByPubkey[pubkey]
          })

          if (pubkeysToFetch.length > 0) {
            const profiles = await getNostrEvents(relays, {
              kinds: [nostrEventKinds.profile],
              authors: pubkeysToFetch,
              limit: pubkeysToFetch.length,
            })

            const profilesByPubkey = profiles.reduce((acc, profile) => {
              return { ...acc, [profile.pubkey]: profile }
            }, {})
            dispatch(updateProfilesByPubkey(profilesByPubkey))
          }

          const idsToFetch = Object.keys(idsInEvent).filter((id) => {
            return !notesById[id]
          })

          const reactions = await getNostrEvents(relays, {
            kinds: [nostrEventKinds.reaction],
            "#e": idsToFetch,
            limit: 50,
          })

          const fetchedReactionsByNoteId = reactions.reduce((acc, reaction) => {
            const parentNoteFromReaction = reaction.tags.find((tag) => tag[0] === "e")[1]
            const currentReactionsForNoteId = acc[parentNoteFromReaction] || []
            return { ...acc, [parentNoteFromReaction]: [...currentReactionsForNoteId, reaction] }
          }, {})
          dispatch(updateReactionsByNoteId(fetchedReactionsByNoteId))

          //
          // After all data has been fetched for the newly received note, add the note to redux
          //
          const eventToAdd = event as NostrNoteEvent | NostrRepostEvent
          dispatch(updateNotesById({ [eventId]: eventToAdd }))
        })
      } catch (e) {
        console.log("error subscribing to relay: ", relay.url, e)
        dispatch(doRemoveRelaySubscriptionFromFeed(relay.url, feedId))
      }

      dispatch(updateSubscriptionsByFeedId({ [feedId]: subscriptions }))
    })
  }

const doRemoveRelaySubscriptionFromFeed =
  (relayUrl: string, feedId: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      subscriptions: { subscriptionsByFeedId },
    } = getState()

    const currentSubscriptionsForFeedId = subscriptionsByFeedId[feedId]
    const newSubscriptionsForFeedId = currentSubscriptionsForFeedId.filter((sub) => sub.url !== relayUrl)
    dispatch(updateSubscriptionsByFeedId({ [feedId]: newSubscriptionsForFeedId }))
  }

export const doUnsubscribeFromRelays =
  (feedId: "following" | "notifications") => async (dispatch: AppDispatch, getState: GetState) => {
    const {
      subscriptions: { subscriptionsByFeedId },
    } = getState()

    const subscriptions = subscriptionsByFeedId[feedId]
    subscriptions?.forEach(({ sub }) => {
      sub.unsub()
    })

    dispatch(updateSubscriptionsByFeedId({ [feedId]: [] }))
  }
