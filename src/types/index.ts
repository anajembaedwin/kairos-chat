export interface Message {
  id: number
  sender: string
  text: string
  created_at: string
}

export type User = 'User A' | 'User B'