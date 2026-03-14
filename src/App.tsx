import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from '@/context/UserContext'
import { AuthProvider } from '@/context/AuthContext'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { VerifyPage } from '@/pages/VerifyPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SessionPage } from '@/pages/SessionPage'
import { ChatPage } from '@/pages/ChatPage'

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
