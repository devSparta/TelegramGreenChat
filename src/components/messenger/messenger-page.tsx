import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { ChatList } from "@/components/messenger/chat-list"
import { Conversation } from "@/components/messenger/conversation"
import { NavigationRail } from "@/components/messenger/navigation-rail"
import { NewChatDialog } from "@/components/messenger/new-chat-dialog"
import { SettingsDialog } from "@/components/messenger/settings-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useGreenApiNotifications } from "@/hooks/use-green-api-notifications"
import { formatPhone, onlyDigits } from "@/lib/formatters"
import {
  GreenApiClient,
  type GreenApiCredentials,
} from "@/lib/green-api"
import type {
  IncomingNotification,
  StatusNotification,
} from "@/lib/notification-parsers"
import type { Chat, ChatMessage, SyncStatus } from "@/types/chat"

type MessengerPageProps = {
  credentials: GreenApiCredentials
  onDisconnect: () => void
}

export function MessengerPage({ credentials, onDisconnect }: MessengerPageProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online")
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")

  const client = useMemo(() => new GreenApiClient(credentials), [credentials])
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null
  const selectedMessages = useMemo(
    () =>
      messages
        .filter((message) => message.chatId === selectedChat?.chatId)
        .sort((a, b) => a.timestamp - b.timestamp),
    [messages, selectedChat?.chatId],
  )

  const handleIncoming = useCallback((incoming: IncomingNotification) => {
    setMessages((current) => {
      if (current.some((message) => message.id === incoming.id)) return current
      return [
        ...current,
        {
          id: incoming.id,
          chatId: incoming.chatId,
          direction: "incoming",
          text: incoming.text,
          timestamp: incoming.timestamp,
        },
      ]
    })

    setChats((current) => {
      const exists = current.some((chat) => chat.chatId === incoming.chatId)
      if (exists) {
        return current.map((chat) =>
          chat.chatId === incoming.chatId
            ? {
                ...chat,
                title: chat.title || incoming.title,
                lastMessage: incoming.text,
                updatedAt: incoming.timestamp,
              }
            : chat,
        )
      }

      const chat: Chat = {
        id: incoming.chatId,
        chatId: incoming.chatId,
        phone: "",
        title: incoming.title,
        lastMessage: incoming.text,
        updatedAt: incoming.timestamp,
      }
      return [chat, ...current]
    })
  }, [])

  const handleStatus = useCallback((statusUpdate: StatusNotification) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === statusUpdate.id
          ? { ...message, status: statusUpdate.status }
          : message,
      ),
    )
  }, [])

  useGreenApiNotifications({
    client,
    onIncoming: handleIncoming,
    onStatus: handleStatus,
    onSyncStatusChange: setSyncStatus,
  })

  const ensureChat = useCallback(
    async (phoneInput: string) => {
      const phone = onlyDigits(phoneInput)
      if (phone.length < 10 || phone.length > 15) {
        throw new Error("Введите номер в международном формате, только цифры.")
      }

      const existing = chats.find((chat) => chat.phone === phone)
      if (existing) return existing

      const result = await client.checkAccount(phone)
      if (result.status === false) {
        throw new Error(result.reason || "Не удалось проверить номер.")
      }
      if (!result.exist || !result.chatId) {
        throw new Error("Telegram-аккаунт с таким номером не найден или номер скрыт.")
      }

      const chat: Chat = {
        id: result.chatId,
        chatId: result.chatId,
        phone,
        title: result.username || formatPhone(phone),
        username: result.username,
        lastMessage: "Чат создан",
        updatedAt: Date.now(),
      }
      setChats((current) => [chat, ...current])
      return chat
    },
    [chats, client],
  )

  const createChat = useCallback(
    async (phone: string) => {
      const chat = await ensureChat(phone)
      setSelectedChatId(chat.id)
      setMobileView("chat")
      return chat
    },
    [ensureChat],
  )

  const sendText = useCallback(
    async (chat: Chat, rawText: string) => {
      const text = rawText.trim()
      if (!text) throw new Error("Введите сообщение.")
      if (text.length > 4096) {
        throw new Error("Сообщение не может быть длиннее 4096 символов.")
      }

      const temporaryId = `local-${crypto.randomUUID()}`
      const timestamp = Date.now()
      setMessages((current) => [
        ...current,
        {
          id: temporaryId,
          chatId: chat.chatId,
          direction: "outgoing",
          text,
          timestamp,
          status: "sending",
        },
      ])
      setChats((current) =>
        current.map((item) =>
          item.id === chat.id
            ? { ...item, lastMessage: text, updatedAt: timestamp }
            : item,
        ),
      )

      try {
        const result = await client.sendMessage(chat.chatId, text)
        setMessages((current) =>
          current.map((message) =>
            message.id === temporaryId
              ? { ...message, id: result.idMessage || temporaryId, status: "sent" }
              : message,
          ),
        )
        return { idMessage: result.idMessage || temporaryId }
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === temporaryId ? { ...message, status: "failed" } : message,
          ),
        )
        throw error
      }
    },
    [client],
  )

  const disconnect = () => {
    setSyncStatus("offline")
    setIsSettingsOpen(false)
    toast.info("Инстанс отключён")
    onDisconnect()
  }

  const selectChat = (chat: Chat) => {
    setSelectedChatId(chat.id)
    setMobileView("chat")
  }

  return (
    <TooltipProvider>
      <main className="messenger-shell">
        <NavigationRail
          activeView={mobileView}
          onChatsClick={() => setMobileView("list")}
          onNewChatClick={() => setIsNewChatOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          syncStatus={syncStatus}
          mobileHidden={mobileView === "chat"}
          onSelectChat={selectChat}
          onNewChat={() => setIsNewChatOpen(true)}
        />

        <Conversation
          chat={selectedChat}
          messages={selectedMessages}
          syncStatus={syncStatus}
          mobileHidden={mobileView === "list"}
          onBack={() => setMobileView("list")}
          onNewChat={() => setIsNewChatOpen(true)}
          onSend={sendText}
        />

        <NewChatDialog
          open={isNewChatOpen}
          onOpenChange={setIsNewChatOpen}
          onCreateChat={createChat}
        />

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          credentials={credentials}
          syncStatus={syncStatus}
          onDisconnect={disconnect}
        />
      </main>
    </TooltipProvider>
  )
}
