import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from '../api/http'

const tokenKey = 'user-token'
const userKey = 'current-user'
const expiredMessage = 'פג תוקף ההתחברות. נא להתחבר מחדש.'

export type AuthUser = {
  id: number
  email: string
  fullName: string
  phone: string | null
  role: string
}

type SaveLoginInput = {//מה שהפונקציה שמירת התחברות מקבלת
  token: string
  user: AuthUser
}

type LogoutInput = {
  expired?: boolean
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  sessionMessage: string
  saveLogin: (login: SaveLoginInput) => void
  saveUser: (nextUser: AuthUser) => void
  logout: (options?: LogoutInput) => void
  isLeaving: () => boolean
  clearLeaving: () => void
}

type AuthProviderProps = {
  children: ReactNode
}

type StoredSession = {
  token: string | null
  user: AuthUser | null
  sessionMessage: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readTokenExp(token: string) {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    let base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/')

    while (base64.length % 4 !== 0) {
      base64 = base64 + '='
    }

    const payload: unknown = JSON.parse(atob(base64))

    if (typeof payload !== 'object' || payload === null) {
      return null
    }

    const exp = (payload as { exp?: unknown }).exp

    if (typeof exp !== 'number') {
      return null
    }

    return exp
  } catch {
    return null
  }
}

function isTokenStillValid(token: string) {
  const exp = readTokenExp(token)

  if (exp === null) {
    return false
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return exp > nowInSeconds
}

function readStoredSession(): StoredSession {
  const token = localStorage.getItem(tokenKey)
  const userText = localStorage.getItem(userKey)

  if (token && !isTokenStillValid(token)) {
    return {
      token: null,
      user: null,
      sessionMessage: expiredMessage,
    }
  }

  if (!token || !userText) {
    return {
      token: null,
      user: null,
      sessionMessage: '',
    }
  }

  try {
    const parsed: unknown = JSON.parse(userText)

    if (typeof parsed !== 'object' || parsed === null) {
      return {
        token: null,
        user: null,
        sessionMessage: '',
      }
    }

    return {
      token,
      user: parsed as AuthUser,
      sessionMessage: '',
    }
  } catch {
    return {
      token: null,
      user: null,
      sessionMessage: '',
    }
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const stored = readStoredSession()
  const [token, setToken] = useState<string | null>(stored.token)
  const [user, setUser] = useState<AuthUser | null>(stored.user)
  const [sessionMessage, setSessionMessage] = useState(stored.sessionMessage)
  const leavingRef = useRef(false)
  const navigate = useNavigate()
  const logoutRef = useRef<(options?: LogoutInput) => void>(() => {})

  useEffect(() => {
    if (stored.token) {
      return
    }

    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
  }, [])

  function logout({ expired }: LogoutInput = {}) {
    leavingRef.current = !expired
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    setToken(null)
    setUser(null)
    setSessionMessage(expired ? expiredMessage : '')
  }

  logoutRef.current = logout

  useEffect(() => {
    setUnauthorizedHandler((rejectedToken) => {
      const currentToken = localStorage.getItem(tokenKey)
      if (!currentToken || currentToken !== rejectedToken) {
        return
      }

      logoutRef.current({ expired: true })
      navigate('/login', { replace: true })
    })

    return () => {
      setUnauthorizedHandler(() => {})
    }
  }, [navigate])

  function isLeaving() {
    return leavingRef.current
  }

  const clearLeaving = useCallback(() => {
    leavingRef.current = false
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    const exp = readTokenExp(token)

    if (exp === null) {
      logout({ expired: true })
      return
    }

    const msLeft = exp * 1000 - Date.now()

    if (msLeft <= 0) {
      logout({ expired: true })
      return
    }

    const timer = window.setTimeout(() => {
      logout({ expired: true })
    }, msLeft)

    return () => {
      window.clearTimeout(timer)
    }
  }, [token])

  function saveLogin({ token, user }: SaveLoginInput) {
    localStorage.setItem(tokenKey, token)
    localStorage.setItem(userKey, JSON.stringify(user))
    setToken(token)
    setUser(user)
    setSessionMessage('')
  }

  function saveUser(nextUser: AuthUser) {
    localStorage.setItem(userKey, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  return (
    <AuthContext.Provider
      value={{ token, user, sessionMessage, saveLogin, saveUser, logout, isLeaving, clearLeaving }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)

  if (!auth) {
    throw new Error('useAuth צריך לשבת בתוך AuthProvider')
  }

  return auth
}
