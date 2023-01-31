import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Relay } from "nostr-tools"
import { relayInit } from "nostr-tools"
import type { AppDispatch, GetState } from "store"
import { connectToRelay, defaultRelays } from "core/nostr"

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
    deleteRelay(state, action: PayloadAction<string>) {
      const { [action.payload]: _, ...rest } = state.relaysByUrl
      const { [action.payload]: __, ...restLoading } = state.relaysLoadingByUrl
      state.relaysByUrl = rest
      state.relaysLoadingByUrl = restLoading
    },
    logout: (state) => {
      state.user = {}
    },
  },
})

export const { updateRelays, deleteRelay, updateRelaysLoadingByUrl, updateTheme, updateUser, logout } =
  settingsSlice.actions

export const initRelays = () => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()

  let relayMap
  if (Object.keys(relaysByUrl).length > 0) {
    relayMap = relaysByUrl
  } else {
    relayMap = defaultRelays.reduce((acc, relayUrl) => {
      acc[relayUrl] = { status: 0 }
      return acc
    }, {})
  }

  const relayUrls = Object.keys(relayMap)
  const initialRelayLoadingState = relayUrls.reduce((acc, relay) => {
    acc[relay] = true
    return acc
  }, {})

  dispatch(updateRelaysLoadingByUrl(initialRelayLoadingState))

  let handledRelays = {}
  let handledCount = 0
  relayUrls.forEach(async (relayUrl) => {
    let handled = false
    let relay

    try {
      relay = relayInit(relayUrl)
      await relay.connect()

      relay.on("connect", () => {
        console.log("connected to: ", relay.url)
        handled = true
        handledRelays[relay.url] = relay
        handledCount++

        dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
      })

      relay.on("error", (e) => {
        console.log("relay.on error: ", relay.url, e)
        relay.close()
        handled = true
        handledCount++
        handledRelays[relay.url] = relay

        dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
      })
    } catch (e) {
      console.log("error with init relay", relayUrl, e)

      handled = true
      handledCount++
      dispatch(
        // @ts-expect-error
        updateRelays({
          [relayUrl]: { url: relayUrl, status: 0 },
        })
      )
      dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
    }

    setTimeout(() => {
      if (handled) return

      if (relay) {
        handledCount++

        dispatch(updateRelays({ [relayUrl]: relay }))
        dispatch(updateRelaysLoadingByUrl({ [relayUrl]: false }))
      }
    }, 1000)
  })

  const interval = setInterval(() => {
    dispatch(updateRelays(handledRelays))
    handledRelays = {}

    if (handledCount === relayUrls.length) {
      clearInterval(interval)
    }
  }, 1000)
}

export const doToggleRelay = (relayUrl: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()

  const existingRelay = relaysByUrl[relayUrl]

  dispatch(
    updateRelaysLoadingByUrl({
      [relayUrl]: true,
    })
  )

  if (!existingRelay) {
    connectToRelay(relayUrl, ({ relay }) => {
      dispatch(updateRelays({ [relay.url]: relay }))
      dispatch(updateRelaysLoadingByUrl({ [relay.url]: false }))
    })

    return
  }

  if (existingRelay?.status === 1) {
    await existingRelay.close()
    dispatch(updateRelays({ [relayUrl]: existingRelay }))
  } else if (existingRelay?.status === 3) {
    connectToRelay(relayUrl, ({ relay }) => {
      dispatch(updateRelays({ [relay.url]: relay }))
    })
  } else if (!existingRelay?.status) {
    if (existingRelay.close) {
      await existingRelay.close()
    }
    connectToRelay(relayUrl, ({ relay }) => {
      dispatch(updateRelays({ [relay.url]: relay }))
    })
  }

  dispatch(
    updateRelaysLoadingByUrl({
      [relayUrl]: false,
    })
  )
}

export const doRemoveRelay = (relayUrl: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()

  const relay = relaysByUrl[relayUrl]

  if (relay) {
    try {
      relay.close()
    } catch (e) {
      console.log("error closing relay", e)
    }
  }

  dispatch(deleteRelay(relayUrl))
}

//
// TODO: this should be smarter
// only close/reopen relays that are actually disconnected
//
export const doCycleRelays = () => async (dispatch: AppDispatch, getState: GetState) => {
  const {
    settings: { relaysByUrl },
  } = getState()

  const relayUrls = Object.keys(relaysByUrl)
  let count = 0

  relayUrls.forEach(async (relayUrl) => {
    const relay = relaysByUrl[relayUrl]

    try {
      relay.close()
    } catch (e) {
      console.log("error closing relay", e)
    } finally {
      count++

      if (count === relayUrls.length) {
        dispatch(initRelays())
      }
    }
  })
}
