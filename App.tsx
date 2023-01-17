import encoding from "text-encoding"

import { LogBox } from "react-native"
LogBox.ignoreLogs(["Require cycle:"])

import App from "./src"

global.TextDecoder = encoding.TextDecoder
export default App
