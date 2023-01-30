import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { AppDispatch, GetState } from "store"

import { getProfile, publishNote, nostrEventKinds } from "core/nostr"
import { updateloadingByIdOrPubkey } from "store/notesSlice"

export interface ProfilesStateState {
  profilesByPubkey: Record<string, NostrProfile>
  contactListsByPubkey: Record<string, NostrContactListEvent>
  nip05ByPubkey: Record<string, boolean | null>
}

const initialState = {
  profilesByPubkey: {},
  contactListsByPubkey: {},
  nip05ByPubkey: {},
} as ProfilesStateState

export const profilesSlice = createSlice({
  name: "profiles",
  initialState,
  reducers: {
    updateProfilesByPubkey(state, action: PayloadAction<Record<string, NostrProfile>>) {
      state.profilesByPubkey = { ...state.profilesByPubkey, ...action.payload }
    },

    updateContactListsByPubkey(state, action: PayloadAction<Record<string, NostrContactListEvent>>) {
      state.contactListsByPubkey = { ...state.contactListsByPubkey, ...action.payload }
    },

    updateNip05ByPubkey(state, action: PayloadAction<Record<string, boolean>>) {
      state.nip05ByPubkey = { ...state.nip05ByPubkey, ...action.payload }
    },
  },
})

export const { updateProfilesByPubkey, updateContactListsByPubkey, updateNip05ByPubkey } =
  profilesSlice.actions

export const doFetchProfile = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl, relaysLoadingByUrl },
    profiles: { profilesByPubkey },
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

export const doFetchNip05 = (pubkey: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    profiles: { nip05ByPubkey, profilesByPubkey },
  } = getState()

  const profile = profilesByPubkey[pubkey]
  if (!profile?.content?.nip05) {
    return
  }

  const [name, domain] = profile.content.nip05.split("@")
  const nip05ForDomain = nip05ByPubkey[domain]

  // Already fetched
  if (nip05ForDomain || nip05ForDomain === null) {
    return
  }

  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`

  try {
    const res = await fetch(url)
    const { names } = await res.json()
    const nip05ExistsForName = names[name]

    dispatch(updateNip05ByPubkey({ [pubkey]: nip05ExistsForName }))
  } catch (e) {
    dispatch(updateNip05ByPubkey({ [pubkey]: null }))

    console.log("error fetching nip05", e)
  }
}
