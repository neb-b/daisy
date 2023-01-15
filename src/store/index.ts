import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { useDispatch as useReactReduxDispatch } from "react-redux"
import thunkMiddleware from "redux-thunk"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { persistStore, persistReducer } from "redux-persist"
import { notesSlice } from "./notesSlice"
import { settingsSlice } from "./settingsSlice"


const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [
    //
    "settings",
    // "notes",
  ],
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

export type RootState = ReturnType<typeof store.getState>
export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type GetState = () => RootState
export const useDispatch: () => AppDispatch = useReactReduxDispatch
