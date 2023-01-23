import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
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
import type { AppDispatch, GetState } from "store"

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

    const subscriptions = []
    relays.forEach((relay) => {
      if (!relay.sub) {
        return
      }

      try {
        const sub = relay.sub([{ ...filter }])
        subscriptions.push({ url: relay.url, sub })
        console.log("following - subscribed to relay: ", relay.url)
        sub.on("event", async (event: NostrEvent) => {
          console.log("event", event)
        })

        sub.on("eose", () => {
          console.log("eose: ", relay.url)
          sub.unsub()
          dispatch(doRemoveRelaySubscriptionFromFeed(relay.url, feedId))
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
