export interface Message {
  id: number
  sender: string
  text: string
  created_at: string
  status?: 'sending' | 'delivered'
}

export type User = 'User A' | 'User B'