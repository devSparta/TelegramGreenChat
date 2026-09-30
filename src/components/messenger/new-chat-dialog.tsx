import { useState, type FormEvent } from "react"
import { LoaderCircle, Phone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getReadableError } from "@/lib/green-api"
import { onlyDigits } from "@/lib/formatters"
import type { Chat } from "@/types/chat"

type NewChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChat: (phone: string) => Promise<Chat>
}

export function NewChatDialog({
  open,
  onOpenChange,
  onCreateChat,
}: NewChatDialogProps) {
  const [newPhone, setNewPhone] = useState("")
  const [newChatError, setNewChatError] = useState("")
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  const createChat = async (event: FormEvent) => {
    event.preventDefault()
    setNewChatError("")
    setIsCreatingChat(true)

    try {
      await onCreateChat(newPhone)
      onOpenChange(false)
      setNewPhone("")
      toast.success("Чат готов")
    } catch (error) {
      setNewChatError(getReadableError(error))
    } finally {
      setIsCreatingChat(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog">
        <DialogHeader>
          <div className="dialog-icon"><Phone /></div>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>
            Введите номер получателя в международном формате. GREEN-API проверит,
            есть ли этот аккаунт в Telegram.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={createChat} className="dialog-form">
          <label htmlFor="recipient-phone">Номер телефона</label>
          <div className="phone-field">
            <span>+</span>
            <Input
              id="recipient-phone"
              autoFocus
              inputMode="tel"
              placeholder="79991234567"
              value={newPhone}
              onChange={(event) => {
                setNewPhone(onlyDigits(event.target.value).slice(0, 15))
                setNewChatError("")
              }}
              aria-invalid={Boolean(newChatError) || undefined}
            />
          </div>
          {newChatError && <p className="form-error" role="alert">{newChatError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button disabled={isCreatingChat || newPhone.length < 10}>
              {isCreatingChat && <LoaderCircle className="animate-spin" />}
              {isCreatingChat ? "Проверяем…" : "Создать чат"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
