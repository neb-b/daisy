import React from "react"
import { FlashList as BaseFlashList } from "@shopify/flash-list"

export const FlashList = (props) => {
  return (
    <BaseFlashList
      estimatedItemSize={144}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      removeClippedSubviews={true}
      {...props}
    />
  )
}
