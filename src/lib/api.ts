export const getApiBase = () => {
  const envBase = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, '')
  if (envBase) return envBase

  const mode = import.meta.env.MODE || 'development'
  // In production we generally serve the API behind the same origin (e.g. /api/*).
  if (mode === 'production') return ''
  return 'http://localhost:3001'
}

const API_BASE = getApiBase()

const redactUrl = (url: string) => {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (u.searchParams.has('token')) {
      const token = u.searchParams.get('token') || ''
      const summary = token ? `${token.slice(0, 8)}...(${token.length})` : '(missing)'
      u.searchParams.set('token', summary)
    }
    return u.toString()
  } catch {
    return url
  }
}

const shouldDebugRequest = (url: string) => {
  // Always emit minimal debug for auth endpoints since they're critical and can fail silently due to networking/config.
  return url.includes('/api/auth/')
}

const isErrorPayload = (data: unknown): data is { error: string; reason?: string } => {
  if (!data || typeof data !== 'object') return false
  return typeof (data as { error?: unknown }).error === 'string'
}

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

const withTimeout = async <T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout()
      reject(new ApiError('Request timed out', 408))
    }, ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

const parseJsonWithTimeout = async <T>(res: Response, url: string): Promise<T> => {
  const controller = new AbortController()
  const read = async () => {
    // If the response stream hangs for any reason, we still want to fail fast.
    // AbortController can't abort Response.json() directly, but we can race it.
    return (await res.json()) as T
  }
  return withTimeout(read(), 8000, () => {
    controller.abort()
    void url
  })
}

export const apiGet = async <T>(path: string, opts?: { token?: string }): Promise<T> => {
  const controller = new AbortController()
  const url = `${API_BASE}${path}`
  const debug = shouldDebugRequest(url)
  const startedAt = Date.now()
  if (debug) console.debug('[api:get]', redactUrl(url))
  const doFetch = async () => {
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Network error: ${String(err)}`
      if (debug) console.debug('[api:get:error]', redactUrl(url), message)
      throw new ApiError(message, 0)
    }
  }

  const res = await withTimeout(doFetch(), 15000, () => controller.abort())
  if (debug) console.debug('[api:get:res]', redactUrl(url), res.status, `${Date.now() - startedAt}ms`)
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  const data = await parseJsonWithTimeout<T>(res, url)
  if (debug) console.debug('[api:get:json]', redactUrl(url))
  if (debug && isErrorPayload(data)) {
    console.debug('[api:get:body:error]', redactUrl(url), data.error)
  }
  if (shouldDebugRequest(url) && isErrorPayload(data)) {
    // Some environments/proxies incorrectly rewrite status codes; don't treat 200 + {error} as success.
    const msg = data.reason ? `${data.error} (${data.reason})` : data.error
    throw new ApiError(msg, res.status || 400)
  }
  return data
}

export const apiPost = async <T>(
  path: string,
  body?: unknown,
  opts?: { token?: string }
): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`

  const controller = new AbortController()
  const url = `${API_BASE}${path}`
  const debug = shouldDebugRequest(url)
  const startedAt = Date.now()
  if (debug) console.debug('[api:post]', redactUrl(url))
  const doFetch = async () => {
    try {
      return await fetch(url, {
        signal: controller.signal,
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Network error: ${String(err)}`
      if (debug) console.debug('[api:post:error]', redactUrl(url), message)
      throw new ApiError(message, 0)
    }
  }

  const res = await withTimeout(doFetch(), 15000, () => controller.abort())
  if (debug) console.debug('[api:post:res]', redactUrl(url), res.status, `${Date.now() - startedAt}ms`)
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  const data = await parseJsonWithTimeout<T>(res, url)
  if (debug) console.debug('[api:post:json]', redactUrl(url))
  if (debug && isErrorPayload(data)) {
    console.debug('[api:post:body:error]', redactUrl(url), data.error)
  }
  if (shouldDebugRequest(url) && isErrorPayload(data)) {
    const msg = data.reason ? `${data.error} (${data.reason})` : data.error
    throw new ApiError(msg, res.status || 400)
  }
  return data
}
