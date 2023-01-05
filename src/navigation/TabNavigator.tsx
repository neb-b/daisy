import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { BottomNavigation, BottomNavigationTab, Icon, Divider } from "@ui-kitten/components"

import { ChatsScreen } from "screens/Chats"
import { FollowingFeedScreen } from "screens/FollowingFeed"
import { SettingsScreen } from "screens/Settings"

const { Navigator, Screen } = createBottomTabNavigator()

const BottomTabBar = ({ navigation, state }) => (
  <>
    <Divider />
    <BottomNavigation
      appearance="noIndicator"
      selectedIndex={state.index}
      onSelect={(index) => navigation.navigate(state.routeNames[index])}
    >
      <BottomNavigationTab icon={(props) => <Icon {...props} name="home-outline" />} />
      <BottomNavigationTab icon={(props) => <Icon {...props} name="message-circle-outline" />} />
      <BottomNavigationTab icon={(props) => <Icon {...props} name="settings-outline" />} />
    </BottomNavigation>
  </>
)

export const BottomTabNavigator = () => (
  <Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Screen name="FollowingFeed" component={FollowingFeedScreen} />
    <Screen name="Chats" component={ChatsScreen} />
    <Screen name="Settings" component={SettingsScreen} />
  </Navigator>
)
