import { useMemo, useState } from "react"
import { MessageCircle, Plus, Search, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatTime, initials } from "@/lib/formatters"
import type { Chat, SyncStatus } from "@/types/chat"

type ChatListProps = {
  chats: Chat[]
  selectedChatId: string | null
  syncStatus: SyncStatus
  mobileHidden: boolean
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
}

export function ChatList({
  chats,
  selectedChatId,
  syncStatus,
  mobileHidden,
  onSelectChat,
  onNewChat,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return chats
      .filter(
        (chat) =>
          !query ||
          chat.title.toLowerCase().includes(query) ||
          chat.phone.includes(query),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [chats, searchQuery])

  return (
    <aside className={`chat-list-panel ${mobileHidden ? "mobile-hidden" : ""}`}>
      <header className="list-header">
        <div>
          <p>Сообщения</p>
          <h1>Чаты</h1>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="new-chat-button"
              size="icon"
              onClick={onNewChat}
              aria-label="Новый чат"
            >
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Новый чат</TooltipContent>
        </Tooltip>
      </header>

      <div className="search-box">
        <Search aria-hidden="true" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск"
          aria-label="Поиск по чатам"
        />
      </div>

      <div className="chat-list" aria-label="Список чатов">
        {filteredChats.length ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-row ${chat.id === selectedChatId ? "selected" : ""}`}
              onClick={() => onSelectChat(chat)}
            >
              <span className="avatar">{initials(chat.title).toUpperCase()}</span>
              <span className="chat-row-copy">
                <span className="chat-row-heading">
                  <strong>{chat.title}</strong>
                  <time>{formatTime(chat.updatedAt)}</time>
                </span>
                <span className="chat-row-preview">{chat.lastMessage}</span>
              </span>
            </button>
          ))
        ) : (
          <div className="empty-list">
            <span><MessageCircle /></span>
            <strong>{searchQuery ? "Ничего не найдено" : "Пока нет чатов"}</strong>
            <p>
              {searchQuery
                ? "Попробуйте другой запрос"
                : "Создайте чат по номеру телефона"}
            </p>
            {!searchQuery && (
              <Button variant="outline" onClick={onNewChat}>
                <Plus /> Новый чат
              </Button>
            )}
          </div>
        )}
      </div>

      <footer className="connection-strip">
        {syncStatus === "online" ? <Wifi /> : <WifiOff />}
        <span>
          {syncStatus === "online"
            ? "GREEN-API подключён"
            : syncStatus === "reconnecting"
              ? "Восстанавливаем связь…"
              : "Нет подключения"}
        </span>
      </footer>
    </aside>
  )
}
