import React from "react"
import { StatusBar, View, KeyboardAvoidingView } from "react-native"

import { ApplicationProvider as ThemeProvider, IconRegistry, Text, useTheme } from "@ui-kitten/components"
import * as eva from "@eva-design/eva"
import { EvaIconsPack } from "@ui-kitten/eva-icons"
import { NavigationContainer } from "@react-navigation/native"
import { Provider, useSelector } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context"

import type { RootState } from "store"
import { store, persistor } from "store"
import { HomeStackNavigator } from "navigation/StackNavigator"
import { dark } from "theme/dark"
import { mapping } from "theme/mapping"

const ThemeWrapper = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.settings)
  const isDark = theme === "dark"

  const themConfig = isDark ? { ...eva.dark, ...dark } : { ...eva.light }

  return (
    <ThemeProvider {...eva} customMapping={mapping} theme={themConfig}>
      <IconRegistry icons={EvaIconsPack} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {children}
    </ThemeProvider>
  )
}

const AppWrapper = ({ children }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const backgroundColor: string = theme[`background-basic-color-1`]
  return (
    <PersistGate loading={<View style={{ flex: 1, backgroundColor }} />} persistor={persistor}>
      <View style={{ flex: 1, backgroundColor, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {children}
        </KeyboardAvoidingView>
      </View>
    </PersistGate>
  )
}

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeWrapper>
          <AppWrapper>
            <NavigationContainer>
              <HomeStackNavigator />
            </NavigationContainer>
          </AppWrapper>
        </ThemeWrapper>
      </SafeAreaProvider>
    </Provider>
  )
}
export default App
