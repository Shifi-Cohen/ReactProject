import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RequireAdmin() {
  const { user, isLeaving } = useAuth()

  if (!user) {
    if (isLeaving()) {
      return <Navigate to="/" replace />
    }

    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RequireAdmin
