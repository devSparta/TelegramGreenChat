import { useEffect } from "react"

import type { GreenApiClient } from "@/lib/green-api"
import { extractIncoming, extractStatus } from "@/lib/notification-parsers"
import type {
  IncomingNotification,
  StatusNotification,
} from "@/lib/notification-parsers"
import type { SyncStatus } from "@/types/chat"

type UseGreenApiNotificationsOptions = {
  client: GreenApiClient | null
  onIncoming: (notification: IncomingNotification) => void
  onStatus: (notification: StatusNotification) => void
  onSyncStatusChange: (status: SyncStatus) => void
}

export function useGreenApiNotifications({
  client,
  onIncoming,
  onStatus,
  onSyncStatusChange,
}: UseGreenApiNotificationsOptions) {
  useEffect(() => {
    if (!client) return

    const activeClient = client
    const controller = new AbortController()
    let active = true
    const pause = (milliseconds: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

    async function poll() {
      onSyncStatusChange("online")

      while (active) {
        try {
          const envelope = await activeClient.receiveNotification(controller.signal, 5)
          if (!envelope) {
            onSyncStatusChange("online")
            continue
          }

          const incoming = extractIncoming(envelope.body)
          const statusUpdate = extractStatus(envelope.body)

          if (incoming) onIncoming(incoming)
          if (statusUpdate) onStatus(statusUpdate)

          await activeClient.deleteNotification(envelope.receiptId, controller.signal)
          onSyncStatusChange("online")
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return
          onSyncStatusChange("reconnecting")
          await pause(3000)
        }
      }
    }

    void poll()
    return () => {
      active = false
      controller.abort()
    }
  }, [client, onIncoming, onStatus, onSyncStatusChange])
}
