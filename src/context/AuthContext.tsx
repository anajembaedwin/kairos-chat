import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export type AuthUser = {
  email: string
  name: string
}

type AuthState = {
  sessionToken: string
  user: AuthUser
}

type AuthContextType = {
  auth: AuthState | null
  setAuth: (auth: AuthState | null) => void
  logout: () => void
}

const STORAGE_KEY = 'kairos.auth.v1'

const AuthContext = createContext<AuthContextType | null>(null)

const safeParse = (raw: string | null): AuthState | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed?.sessionToken || !parsed?.user?.email || !parsed?.user?.name) return null
    return parsed
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuthState] = useState<AuthState | null>(() => safeParse(localStorage.getItem(STORAGE_KEY)))

  useEffect(() => {
    if (!auth) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  }, [auth])

  const value = useMemo<AuthContextType>(() => {
    const setAuth = (next: AuthState | null) => setAuthState(next)
    const logout = () => setAuthState(null)
    return { auth, setAuth, logout }
  }, [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

