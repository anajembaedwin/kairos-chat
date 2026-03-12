export interface Message {
  id: number
  sender: string
  text: string
  created_at: string
}

export interface CreateMessageBody {
  sender: string
  text: string
}