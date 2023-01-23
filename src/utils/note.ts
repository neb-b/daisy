export const isImage = (url: string) => url.match(/\.(jpeg|jpg|gif|png)$/) !== null

export const isUrl = (url: string) => url.match(urlRegex) !== null

export const isMention = (text: string) => text.match(noteMentionRegex) !== null

export const urlRegex =
  /((?:http|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)/i

export const noteMentionRegex = /(#\[[0-9]+])/

export const noteOrUrlRegex =
  /(\n)|(#\[[0-9]+])|((?:http|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)/i
