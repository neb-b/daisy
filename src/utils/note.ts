export const isImage = (url: string) => {
  return url.match(/\.(jpeg|jpg|gif|png)$/) !== null
}

export const isUrl = (url: string) => {
  return url.match(urlRegex) !== null
}

export const isMention = (text: string) => {
  return text.match(isNoteMention) !== null
}

export const urlRegex =
  /((?:http|ftp|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)/i

export const isNoteMention = /(#\[\d\])/

export const noteOrUrlRegex =
  /(#\[\d\])|((?:http|ftp|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)/i
