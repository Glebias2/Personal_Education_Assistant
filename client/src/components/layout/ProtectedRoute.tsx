import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import type { UserRole } from "@/types"

interface Props {
  role?: UserRole
}

export default function ProtectedRoute({ role }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/auth" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === "student" ? "/student/dashboard" : "/teacher/dashboard"} replace />
  }

  return <Outlet />
}
