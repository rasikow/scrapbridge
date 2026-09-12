import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ roles, children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return children
}
