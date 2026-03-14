import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/types'

interface LoginScreenProps {
  onLogin: (user: User) => void
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [selected, setSelected] = useState<User | null>(null)

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink">Kairos Chat</h1>
          <p className="text-ink-muted text-sm mt-1">Real-time messaging</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Choose your identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['User A', 'User B'] as User[]).map((u) => (
              <button
                key={u}
                onClick={() => setSelected(u)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selected === u
                    ? 'border-accent bg-accent-muted text-ink'
                    : 'border-surface-border bg-surface-overlay text-ink-muted hover:border-accent/50 hover:text-ink'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  selected === u ? 'bg-accent text-white' : 'bg-surface-border text-ink-muted'
                }`}>
                  {u.split(' ')[1]}
                </div>
                <span className="font-medium">{u}</span>
                {selected === u && (
                  <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c6af7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}

            <Button
              className="w-full mt-2"
              disabled={!selected}
              onClick={() => selected && onLogin(selected)}
              aria-label="Enter chat"
            >
              Enter Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}