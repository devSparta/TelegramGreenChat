import type { MessageStatus } from "@/types/chat"

export type IncomingNotification = {
  id: string
  chatId: string
  title: string
  text: string
  timestamp: number
}

export type StatusNotification = {
  id: string
  status: MessageStatus
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function getString(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key]
  return typeof value === "string" ? value : ""
}

export function extractIncoming(body: Record<string, unknown>): IncomingNotification | null {
  if (body.typeWebhook !== "incomingMessageReceived") return null

  const sender = readRecord(body.senderData)
  const messageData = readRecord(body.messageData)
  const textData = readRecord(messageData?.textMessageData)
  const extendedTextData = readRecord(messageData?.extendedTextMessageData)
  const text =
    getString(textData, "textMessage") ||
    getString(extendedTextData, "text") ||
    getString(messageData, "textMessage")
  const chatId = getString(sender, "chatId")

  if (!text || !chatId) return null

  return {
    id: getString(body, "idMessage") || crypto.randomUUID(),
    chatId,
    title:
      getString(sender, "senderContactName") ||
      getString(sender, "senderName") ||
      getString(sender, "chatName") ||
      "Telegram",
    text,
    timestamp: typeof body.timestamp === "number" ? body.timestamp * 1000 : Date.now(),
  }
}

export function extractStatus(body: Record<string, unknown>): StatusNotification | null {
  if (body.typeWebhook !== "outgoingMessageStatus") return null

  const id = getString(body, "idMessage")
  const rawStatus = getString(body, "status")
  const statusMap: Record<string, MessageStatus> = {
    pending: "sending",
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
    noAccount: "failed",
  }

  return id && statusMap[rawStatus] ? { id, status: statusMap[rawStatus] } : null
}
