export const extractSessionId = (input: string): string | null => {
  const raw = input.trim()
  if (!raw) return null

  // Prefer extracting from a full session URL/path.
  const fromPath = raw.match(/\/session\/([a-z0-9]{6})(?:[/?#]|$)/i)
  if (fromPath?.[1]) return fromPath[1].toLowerCase()

  // Otherwise allow the bare ID.
  const bare = raw.match(/^([a-z0-9]{6})$/i)
  if (bare?.[1]) return bare[1].toLowerCase()

  return null
}

