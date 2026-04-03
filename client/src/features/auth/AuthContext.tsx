import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getAuthUser, setAuthUser, logout as logoutStorage } from "@/lib/auth"
import type { AuthUser } from "@/types"

interface AuthContextValue {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
  isStudent: boolean
  isTeacher: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getAuthUser())

  const setUser = (u: AuthUser | null) => {
    setAuthUser(u)
    setUserState(u)
  }

  const logout = () => {
    logoutStorage()
    setUserState(null)
  }

  useEffect(() => {
    const stored = getAuthUser()
    if (stored) setUserState(stored)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      logout,
      isStudent: user?.role === "student",
      isTeacher: user?.role === "teacher",
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
