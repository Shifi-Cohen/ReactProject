import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RequireAuth() {
  const { user, isLeaving } = useAuth()

  if (!user) {
    if (isLeaving()) {
      return <Navigate to="/" replace />
    }

    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default RequireAuth
