import { useNavigate } from 'react-router-dom'
import { LoginScreen } from '@/components/LoginScreen'
import { useUser } from '@/context/UserContext'
import { User } from '@/types'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { setUser } = useUser()

  const handleLogin = (user: User) => {
    setUser(user)
    navigate('/chat', { replace: true })
  }

  return <LoginScreen onLogin={handleLogin} />
}

