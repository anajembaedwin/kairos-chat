import { Navigate, useNavigate } from 'react-router-dom'
import { ChatScreen } from '@/components/ChatScreen'
import { useUser } from '@/context/UserContext'

export const ChatPage = () => {
  const { user, setUser } = useUser()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace />

  return (
    <ChatScreen
      user={user}
      onLogout={() => {
        setUser(null)
        navigate('/login', { replace: true })
      }}
    />
  )
}

