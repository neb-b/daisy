import React from "react"
import { createStackNavigator } from "@react-navigation/stack"

import { ProfileScreen } from "screens/Profile"
import { SettingsScreen } from "screens/Settings"
import { ThreadScreen } from "screens/Thread"
import { LoadingScreen } from "screens/Loading"
import { AuthScreen } from "screens/Auth"

import { BottomTabNavigator } from "navigation/TabNavigator"
import { useDispatch } from "store"
import { useUser } from "store/hooks"
import { doFetchProfile } from "store/notesSlice"

const Stack = createStackNavigator()

function HomeStackNavigator() {
  const dispatch = useDispatch()
  const { pubkey } = useUser()

  React.useEffect(() => {
    if (pubkey) {
      dispatch(doFetchProfile(pubkey))
    }
  }, [pubkey])

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Home" component={BottomTabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Thread" component={ThreadScreen} />
    </Stack.Navigator>
  )
}

export { HomeStackNavigator }
