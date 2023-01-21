import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { BottomNavigation, BottomNavigationTab, Icon, Divider } from "@ui-kitten/components"

import { FollowingFeedScreen } from "screens/FollowingFeed"
import { SettingsScreen } from "screens/Settings"

const { Navigator, Screen } = createBottomTabNavigator()

function BottomTabBar({ navigation, state }) {
  return (
    <>
      <Divider />
      <BottomNavigation
        appearance="noIndicator"
        selectedIndex={state.index}
        onSelect={(index) => navigation.navigate(state.routeNames[index])}
      >
        <BottomNavigationTab icon={(props) => <Icon {...props} name="home-outline" />} />
        <BottomNavigationTab icon={(props) => <Icon {...props} name="bell-outline" />} />
        <BottomNavigationTab icon={(props) => <Icon {...props} name="settings-outline" />} />
      </BottomNavigation>
    </>
  )
}

export function BottomTabNavigator() {
  return (
    <Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Screen name="FollowingFeed" component={FollowingFeedScreen} />
      <Screen name="Settings" component={SettingsScreen} />
    </Navigator>
  )
}
