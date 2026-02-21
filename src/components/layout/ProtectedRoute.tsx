import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { AdminLayout } from './AdminLayout'

export function ProtectedRoute() {
  const { admin, checked, check } = useAuthStore()

  useEffect(() => {
    if (!checked) check()
  }, [checked, check])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
        Загрузка...
      </div>
    )
  }

  if (!admin) return <Navigate to="/login" replace />

  return <AdminLayout />
}
