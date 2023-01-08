import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { notesSlice } from "./notesSlice"
import { settingsSlice } from "./settingsSlice"
import type { NotesState } from "./notesSlice"
import type { SettingsState } from "./settingsSlice"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { persistStore, persistReducer } from "redux-persist"

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["settings"],
}

export interface RootState {
  notes: NotesState
  settings: SettingsState
}

const rootReducer = combineReducers({
  notes: notesSlice.reducer,
  settings: settingsSlice.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store)
