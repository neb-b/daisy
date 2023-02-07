import * as secp from "@noble/secp256k1"
import { bech32 } from "bech32"

export function hexToBech32(hrp: string, hex: string) {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    return ""
  }

  try {
    let buf = secp.utils.hexToBytes(hex)
    return bech32.encode(hrp, bech32.toWords(buf))
  } catch (e) {
    console.warn("Invalid hex", hex, e)
    return ""
  }
}

export function bech32ToHex(str: string) {
  let nKey = bech32.decode(str)
  let buff = bech32.fromWords(nKey.words)
  return secp.utils.bytesToHex(Uint8Array.from(buff))
}
