const originalTitle = document.title
let unreadCount = 0
let blinkInterval: ReturnType<typeof setInterval> | null = null

export const setUnreadBadge = (count: number) => {
  unreadCount = count

  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }

  if (count === 0) {
    document.title = originalTitle
    return
  }

  // Blink the tab title
  let show = true
  document.title = `(${count}) New Message — Kairos Chat`

  blinkInterval = setInterval(() => {
    document.title = show
      ? `(${count}) New Message — Kairos Chat`
      : originalTitle
    show = !show
  }, 1500)
}

export const clearUnreadBadge = () => {
  unreadCount = 0
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
  document.title = originalTitle
}

export const getUnreadCount = () => unreadCount