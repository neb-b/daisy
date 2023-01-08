import React from "react"

import { Button as BaseButton, Text } from "@ui-kitten/components"

type Props = {
  children: React.ReactNode
}

export const Button: React.FC<Props> = ({ children, ...rest }) => {
  return <Button style={{ marginTop: 16, borderRadius: 10 }}>Add</Button>
}
