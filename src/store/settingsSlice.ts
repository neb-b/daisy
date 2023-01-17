import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Relay } from "nostr-tools"
import { relayInit } from "nostr-tools"
import type { AppDispatch, GetState } from "store"
import { connectToRelay } from "core/nostr"

type theme = "light" | "dark" | "system"

export interface SettingsState {
  theme: theme
  user: {
    pubkey?: string
    privateKey?: string
  }
  relaysByUrl: Record<string, Relay>
  relaysLoadingByUrl: Record<string, boolean>
}

const initialState = {
  theme: "dark",
  user: {},
  relaysByUrl: {},
  relaysLoadingByUrl: {},
} as SettingsState

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateTheme(state, action: PayloadAction<theme>) {
      state.theme = action.payload
    },
    updateUser(state, action: PayloadAction<SettingsState["user"]>) {
      state.user = action.payload
    },
    updateRelays(state, action: PayloadAction<Record<string, Relay>>) {
      state.relaysByUrl = { ...state.relaysByUrl, ...action.payload }
    },
    updateRelaysLoadingByUrl(state, action: PayloadAction<Record<string, boolean>>) {
      state.relaysLoadingByUrl = { ...state.relaysLoadingByUrl, ...action.payload }
    },
    logout: (state) => {
      state.user = {}
    },
  },
})

export const { updateRelays, updateRelaysLoadingByUrl, updateTheme, updateUser, logout } =
  settingsSlice.actions

export const initRelays = () => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()
  const relayUrls = Object.keys(relaysByUrl)
  const initialRelayLoadingState = relayUrls.reduce((acc, relay) => {
    acc[relay] = true
    return acc
  }, {})

  dispatch(updateRelaysLoadingByUrl(initialRelayLoadingState))

  relayUrls.forEach(async (relayUrl) => {
    let handled = false
    let relay

    try {
      relay = relayInit(relayUrl)
      await relay.connect()

      relay.on("connect", () => {
        console.log("connected to: ", relay.url)
        handled = true
        dispatch(
          updateRelays({
            [relay.url]: relay,
          })
        )

        dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
      })

      relay.on("error", (e) => {
        console.log("relay.on error: ", relay.url, e)
        relay.close()
        handled = true
        dispatch(
          updateRelays({
            [relay.url]: relay,
          })
        )
        dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
      })
    } catch (e) {
      console.log("error with init relay", relayUrl, e)
      relay = relayInit(relayUrl)

      dispatch(
        updateRelays({
          [relayUrl]: relay,
        })
      )
      dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
    }

    setTimeout(() => {
      if (handled) return

      if (relay) {
        dispatch(updateRelays({ [relayUrl]: relay }))
        dispatch(updateRelaysLoadingByUrl({ [relayUrl]: false }))
      }
    }, 1000)
  })
}

export const doToggleRelay = (relayUrl: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()

  const relay = relaysByUrl[relayUrl]
  const { status: currentStatus } = relay

  dispatch(
    updateRelaysLoadingByUrl({
      [relayUrl]: true,
    })
  )

  if (currentStatus === 1) {
    await relay.close()
    return dispatch(updateRelays({ [relayUrl]: relay }))
  } else if (currentStatus === 0) {
    connectToRelay(relayUrl, ({ relay }) => {
      dispatch(updateRelays({ [relay.url]: relay }))
    })
  } else {
    await relay.connect()
    dispatch(updateRelays({ [relayUrl]: relay }))
  }

  dispatch(
    updateRelaysLoadingByUrl({
      [relayUrl]: false,
    })
  )
}
