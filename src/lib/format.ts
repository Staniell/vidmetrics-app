import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears } from "date-fns"

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return n.toString()
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy")
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d")
  } catch {
    return dateStr
  }
}

export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return isoDuration

  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)

  const pad = (n: number) => n.toString().padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${minutes}:${pad(seconds)}`
}

export function formatEngagement(rate: number): string {
  return `${rate.toFixed(1)}%`
}

export function formatRelativeAge(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    const now = new Date()
    const years = differenceInYears(now, date)
    if (years >= 1) return years === 1 ? "1 year ago" : `${years} years ago`
    const months = differenceInMonths(now, date)
    if (months >= 1) return months === 1 ? "1 month ago" : `${months} months ago`
    const days = differenceInDays(now, date)
    if (days >= 1) return days === 1 ? "1 day ago" : `${days} days ago`
    return "today"
  } catch {
    return dateStr
  }
}
