"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type User,
  type AuthTokens,
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
} from "./api-client"

interface AuthContextType {
  user: User | null
  tokens: AuthTokens | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const TOKEN_COOKIE_NAME = "tokens"
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const writeTokenCookie = (tokens?: AuthTokens) => {
  if (typeof document === "undefined") return

  if (!tokens) {
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
    return
  }

  const value = encodeURIComponent(tokens.refreshToken || tokens.accessToken)
  document.cookie = `${TOKEN_COOKIE_NAME}=${value}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem("tokens")
    const storedUser = localStorage.getItem("user")

    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens)
        setTokens(parsed)
        if (storedUser) setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("[v0] Failed to parse stored tokens")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      setLoading(true)
      const { tokens: newTokens, user: userData } = await apiLogin(email, password)
      setTokens(newTokens)
      setUser(userData)
      localStorage.setItem("tokens", JSON.stringify(newTokens))
      localStorage.setItem("user", JSON.stringify(userData))
      writeTokenCookie(newTokens)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, phone: string) => {
    setError(null)
    try {
      setLoading(true)
      await apiRegister(name, email, password, phone)
      // Auto login after registration
      await login(email, password)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await apiLogout(tokens.accessToken)
      }
    } finally {
      setTokens(null)
      setUser(null)
      localStorage.removeItem("tokens")
      localStorage.removeItem("user")
      writeTokenCookie()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
