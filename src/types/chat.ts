export type Chat = {
  id: string
  chatId: string
  phone: string
  title: string
  username?: string
  lastMessage: string
  updatedAt: number
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed"

export type ChatMessage = {
  id: string
  chatId: string
  direction: "incoming" | "outgoing"
  text: string
  timestamp: number
  status?: MessageStatus
}

export type SyncStatus = "online" | "reconnecting" | "offline"
