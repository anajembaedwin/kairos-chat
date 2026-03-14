import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

export const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const secondsAgo = (Date.now() - date.getTime()) / 1000

  if (secondsAgo < 10) return 'just now'
  if (secondsAgo < 60) return 'less than a minute ago'

  return formatDistanceToNow(date, { addSuffix: true })
}

export const getMessageTime = (dateStr: string): string => {
  return format(new Date(dateStr), 'h:mm a')
}

export const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export const isSameDay = (dateStr1: string, dateStr2: string): boolean => {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}