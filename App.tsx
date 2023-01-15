import encoding from "text-encoding"

import App from "./src"

global.TextDecoder = encoding.TextDecoder
export default App
