import "react-native-url-polyfill/auto"
import encoding from "text-encoding"
import * as SplashScreen from "expo-splash-screen"

import { LogBox } from "react-native"
LogBox.ignoreLogs(["Require cycle:"])

SplashScreen.preventAutoHideAsync()

import App from "./src"

global.TextDecoder = encoding.TextDecoder
export default App
