import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export const timeSince = (timeInSeconds: number) => {
  const time = dayjs(timeInSeconds * 1000).fromNow()
  if (time === "a few seconds ago") {
    return "now"
  }

  if (time.includes("minute") || time.includes("minutes")) {
    const minuteExtracted = time.match(/\d+/g)
    const minutes = minuteExtracted ? minuteExtracted[0] : "1"
    return `${minutes}m`
  }

  if (time.includes("hour") || time.includes("hours")) {
    const hourExtracted = time.match(/\d+/g)
    const hours = hourExtracted ? hourExtracted[0] : "1"
    return `${hours}h`
  }

  if (time.includes("day") || time.includes("days")) {
    const dayExtracted = time.match(/\d+/g)
    const days = dayExtracted ? dayExtracted[0] : "1"
    return `${days}d`
  }
}

export const fullDateString = (timeInSeconds: number) => dayjs(timeInSeconds * 1000).format("MM/D/YY h:mm A")
