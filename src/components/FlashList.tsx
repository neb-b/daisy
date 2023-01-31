import React from "react"
import { FlatList as BaseFlatList } from "react-native"
// https://github.com/Shopify/flash-list/issues/547
// import { FlashList as BaseFlashList } from "@shopify/flash-list"

export const FlashList = (props) => {
  return (
    <BaseFlatList
      estimatedItemSize={144}
      maintainVisibleContentPosition={{ minIndexForVisible: 3 }}
      removeClippedSubviews={true}
      {...props}
    />
  )
}
