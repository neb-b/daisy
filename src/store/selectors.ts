import { useSelector } from "react-redux"
import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "./index"

const selectNotes = (state: RootState) => state.notes
const selectProfiles = (state: RootState) => state.profiles
const selectSettings = (state: RootState) => state.settings
const selectSubscriptions = (state: RootState) => state.subscriptions

export const selectUser = createSelector(selectSettings, (settings) => {
  return settings.user
})

export const selectProfilesByPubkey = createSelector(selectProfiles, (profiles) => {
  const { profilesByPubkey } = profiles
  return profilesByPubkey
})

export const selectRelaysByUrl = createSelector(selectSettings, (settings) => {
  return settings.relaysByUrl
})

export const selectRelaysLoadingByUrl = createSelector(selectSettings, (settings) => {
  return settings.relaysLoadingByUrl
})

export const selectSubscriptionsByFeedId = createSelector(selectSubscriptions, (subscriptions) => {
  return subscriptions.subscriptionsByFeedId
})

export const selectContactListsByPubkey = createSelector(selectProfiles, (profiles) => {
  return profiles.contactListsByPubkey
})

export const selectHasRelayConnection = createSelector(selectRelaysByUrl, (relaysByUrl) => {
  return !!Object.values(relaysByUrl).find((relay) => relay.status === 1 && typeof relay.on === "function")
})

export const makeSelectProfileByPubkey = (pubkey: string) =>
  createSelector(selectProfilesByPubkey, (profilesByPubkey) => {
    return profilesByPubkey[pubkey]
  })

export const makeSelectContactListByPubkey = (pubkey: string) =>
  createSelector(selectContactListsByPubkey, (contactListsByPubkey) => {
    return contactListsByPubkey[pubkey]
  })

export const makeSelectSubscriptionByFeedId = (feedId: string) =>
  createSelector(selectSubscriptionsByFeedId, (subscriptionsByFeedId) => {
    return subscriptionsByFeedId[feedId]
  })
