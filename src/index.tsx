import React from "react"
import { StatusBar } from "react-native"

import { ApplicationProvider as ThemeProvider, IconRegistry } from "@ui-kitten/components"
import * as eva from "@eva-design/eva"
import { EvaIconsPack } from "@ui-kitten/eva-icons"
import { NavigationContainer } from "@react-navigation/native"
import { Provider, useSelector } from "react-redux"

import type { RootState } from "redux/store"
import { store } from "redux/store"
import { HomeStackNavigator } from "navigation/StackNavigator"

const ThemeWrapper = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.settings)
  const isDark = theme === "dark"

  return (
    <ThemeProvider {...eva} theme={isDark ? eva.dark : eva.light}>
      <IconRegistry icons={EvaIconsPack} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {children}
    </ThemeProvider>
  )
}

const App = () => {
  return (
    <Provider store={store}>
      <ThemeWrapper>
        <NavigationContainer>
          <HomeStackNavigator />
        </NavigationContainer>
      </ThemeWrapper>
    </Provider>
  )
}
export default App
