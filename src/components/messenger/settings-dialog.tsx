import { LogOut, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { GreenApiCredentials } from "@/lib/green-api"
import type { SyncStatus } from "@/types/chat"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentials: GreenApiCredentials
  syncStatus: SyncStatus
  onDisconnect: () => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  credentials,
  syncStatus,
  onDisconnect,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog">
        <DialogHeader>
          <div className="dialog-icon"><Settings /></div>
          <DialogTitle>Подключение</DialogTitle>
          <DialogDescription>
            Текущий Telegram-инстанс GREEN-API. Токен скрыт и хранится только в
            памяти этой вкладки.
          </DialogDescription>
        </DialogHeader>
        <dl className="settings-list">
          <div><dt>idInstance</dt><dd>{credentials.idInstance}</dd></div>
          <div><dt>apiUrl</dt><dd>{credentials.apiUrl}</dd></div>
          <div>
            <dt>Статус</dt>
            <dd className={syncStatus === "online" ? "status-online" : ""}>
              {syncStatus === "online" ? "Подключён" : "Переподключение"}
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="destructive" onClick={onDisconnect}>
            <LogOut /> Отключить инстанс
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
