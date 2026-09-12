import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '@/services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setUser(u)
      setInitializing(false)
    })
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await authService.login(email, password)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const registerBuyer = useCallback((payload) => authService.registerBuyer(payload), [])
  const registerSeller = useCallback((payload) => authService.registerSeller(payload), [])

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout, registerBuyer, registerSeller }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
