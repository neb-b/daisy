import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export const timeSince = (timeInSeconds: number) => {
  const time = dayjs(timeInSeconds * 1000).fromNow()
  if (time === "a few seconds ago") {
    return "now"
  }

  return time
}

export const fullDateString = (timeInSeconds: number) => {
  return dayjs(timeInSeconds * 1000).format("MM/D/YY h:mm A")
}
