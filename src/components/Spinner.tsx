import React from "react"
import { View } from "react-native"
import { Spinner as BaseSpinner, useTheme } from "@ui-kitten/components"

export const Spinner = () => {
  const theme = useTheme()
  const size = 40

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        marginBottom: 16,
        marginLeft: "auto",
        marginRight: "auto",
        zIndex: 2,
        alignItems: "center",
      }}
    >
      <View
        style={{
          marginLeft: 0,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme["color-basic-900"],
          height: size,
          width: size,
          borderRadius: size / 2,
          shadowColor: theme["color-basic-1000"],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
        }}
      >
        <BaseSpinner />
      </View>
    </View>
  )
}
