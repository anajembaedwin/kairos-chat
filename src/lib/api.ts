const API_BASE =
  import.meta.env.VITE_SERVER_URL?.replace(/\/$/, '') || 'http://localhost:3001'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const readErrorMessage = async (res: Response) => {
  try {
    const data = (await res.json()) as { error?: string }
    if (data?.error) return data.error
  } catch {
    // ignore
  }
  return `Request failed with status ${res.status}`
}

export const apiGet = async <T>(path: string, opts?: { token?: string }): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
  })
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  return (await res.json()) as T
}

export const apiPost = async <T>(
  path: string,
  body?: unknown,
  opts?: { token?: string }
): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  return (await res.json()) as T
}

