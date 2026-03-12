import { UserProvider, useUser } from '@/context/UserContext'
import { LoginScreen } from '@/components/LoginScreen'
import { ChatScreen } from '@/components/ChatScreen'
import { User } from '@/types'

const AppContent = () => {
  const { user, setUser } = useUser()

  const handleLogout = () => {
    window.location.reload()
  }

  if (!user) {
    return <LoginScreen onLogin={(u: User) => setUser(u)} />
  }

  return <ChatScreen user={user} onLogout={handleLogout} />
}

const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App