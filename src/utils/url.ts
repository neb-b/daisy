export const isImage = (url: string) => {
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null
}

export const urlRegex =
  /((?:http|ftp|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)/i
