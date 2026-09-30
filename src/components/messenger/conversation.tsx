import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Clock3,
  MessageCircle,
  Plus,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getReadableError } from "@/lib/green-api"
import { formatTime, initials } from "@/lib/formatters"
import type { Chat, ChatMessage, MessageStatus, SyncStatus } from "@/types/chat"

type ConversationProps = {
  chat: Chat | null
  messages: ChatMessage[]
  syncStatus: SyncStatus
  mobileHidden: boolean
  onBack: () => void
  onNewChat: () => void
  onSend: (chat: Chat, text: string) => Promise<unknown>
}

export function Conversation({
  chat,
  messages,
  syncStatus,
  mobileHidden,
  onBack,
  onNewChat,
  onSend,
}: ConversationProps) {
  const [messageDraft, setMessageDraft] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, chat?.id])

  const submitMessage = async () => {
    if (!chat || !messageDraft.trim()) return

    const text = messageDraft
    setMessageDraft("")
    try {
      await onSend(chat, text)
    } catch (error) {
      setMessageDraft(text)
      toast.error(getReadableError(error))
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submitMessage()
    }
  }

  return (
    <section className={`conversation-panel ${mobileHidden ? "mobile-hidden" : ""}`}>
      {chat ? (
        <>
          <header className="conversation-header">
            <Button
              className="mobile-back"
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="К списку чатов"
            >
              <ChevronLeft />
            </Button>
            <span className="avatar large">{initials(chat.title).toUpperCase()}</span>
            <div className="contact-heading">
              <strong>{chat.title}</strong>
              <span>
                {syncStatus === "online" ? "получаем сообщения" : "подключение…"}
              </span>
            </div>
          </header>

          <div className="message-area" aria-live="polite">
            <div className="date-chip">Сегодня</div>
            {messages.length ? (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <div className="conversation-start">
                <span><Send /></span>
                <strong>Начните переписку</strong>
                <p>Отправьте первое текстовое сообщение в Telegram</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="composer-wrap">
            <div className="composer">
              <Textarea
                rows={1}
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                maxLength={4096}
                placeholder="Сообщение"
                aria-label="Текст сообщения"
              />
              <Button
                className="send-button"
                size="icon"
                onClick={() => void submitMessage()}
                disabled={!messageDraft.trim()}
                aria-label="Отправить сообщение"
              >
                <Send />
              </Button>
            </div>
            <span className="composer-hint">Enter — отправить · Shift + Enter — новая строка</span>
          </footer>
        </>
      ) : (
        <div className="no-conversation">
          <span><MessageCircle /></span>
          <h2>Выберите чат</h2>
          <p>Или создайте новый по номеру телефона получателя</p>
          <Button onClick={onNewChat}>
            <Plus /> Новый чат
          </Button>
        </div>
      )}
    </section>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={`message-bubble ${message.direction}`}>
      <p>{message.text}</p>
      <footer>
        <time>{formatTime(message.timestamp)}</time>
        {message.direction === "outgoing" && (
          <span className={`message-status ${message.status || "sent"}`}>
            <StatusIcon status={message.status} />
          </span>
        )}
      </footer>
    </article>
  )
}

function StatusIcon({ status }: { status?: MessageStatus }) {
  if (status === "sending") return <Clock3 aria-label="Отправляется" />
  if (status === "delivered" || status === "read") {
    return <CheckCheck aria-label={status === "read" ? "Прочитано" : "Доставлено"} />
  }
  if (status === "failed") return <span aria-label="Ошибка отправки">!</span>
  return <Check aria-label="Отправлено" />
}
