import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export const SessionPage = () => {
  const { id } = useParams()
  const { auth } = useAuth()

  if (!auth) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-surface text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="text-sm font-semibold">Session {id}</div>
        <p className="text-sm text-ink-muted mt-1">
          Chat UI + encryption + timer will live here next.
        </p>
      </div>
    </div>
  )
}

