import { useState, type FormEvent } from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GreenApiClient,
  getReadableError,
  type GreenApiCredentials,
} from "@/lib/green-api"
import { onlyDigits } from "@/lib/formatters"

const DEFAULT_API_URL = "https://api.green-api.com"

const emptyCredentials: GreenApiCredentials = {
  apiUrl: "",
  idInstance: "",
  apiTokenInstance: "",
}

type ConnectScreenProps = {
  onConnected: (credentials: GreenApiCredentials) => void
}

export function ConnectScreen({ onConnected }: ConnectScreenProps) {
  const [draftCredentials, setDraftCredentials] = useState(emptyCredentials)
  const [connectError, setConnectError] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showApiUrl, setShowApiUrl] = useState(false)

  const connect = async (event: FormEvent) => {
    event.preventDefault()
    setConnectError("")

    const idInstance = onlyDigits(draftCredentials.idInstance)
    if (!idInstance) {
      setConnectError("Введите idInstance.")
      return
    }
    if (draftCredentials.apiTokenInstance.trim().length < 16) {
      setConnectError("Введите полный apiTokenInstance из личного кабинета.")
      return
    }

    const normalized: GreenApiCredentials = {
      apiUrl: draftCredentials.apiUrl.trim() || DEFAULT_API_URL,
      idInstance,
      apiTokenInstance: draftCredentials.apiTokenInstance.trim(),
    }

    setIsConnecting(true)
    try {
      const client = new GreenApiClient(normalized)
      const state = await client.getStateInstance()
      const instanceState = state.stateInstance ?? "unknown"

      if (instanceState !== "authorized") {
        setConnectError(
          instanceState === "notAuthorized"
            ? "Инстанс не авторизован в Telegram. Авторизуйте его в личном кабинете GREEN-API."
            : `Инстанс пока не готов: ${instanceState}.`,
        )
        return
      }

      onConnected(normalized)
      toast.success("Telegram-инстанс подключён")
    } catch (error) {
      setConnectError(getReadableError(error))
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <main className="connect-screen">
      <div className="connect-backdrop" aria-hidden="true">
        <div className="preview-rail" />
        <div className="preview-list" />
        <div className="preview-chat">
          <span />
          <span />
          <span />
        </div>
      </div>

      <section className="connect-card" aria-labelledby="connect-title">
        <div className="connect-brand">
          <span className="telegram-mark" aria-hidden="true">
            <Send />
          </span>
          <div>
            <p>TELEGRAM · GREEN-API</p>
            <strong>Web Chat</strong>
          </div>
        </div>

        <div className="connect-copy">
          <span className="eyebrow"><ShieldCheck /> Безопасное подключение</span>
          <h1 id="connect-title">Войдите в ваш инстанс</h1>
          <p>
            Данные нужны только для запросов к GREEN-API и не сохраняются после
            закрытия вкладки.
          </p>
        </div>

        <form className="connect-form" onSubmit={connect} autoComplete="off" noValidate>
          <label htmlFor="id-instance">idInstance</label>
          <Input
            id="id-instance"
            name="green-api-instance-id"
            inputMode="numeric"
            autoComplete="one-time-code"
            data-1p-ignore
            data-bwignore
            data-lpignore="true"
            placeholder="4100000000"
            value={draftCredentials.idInstance}
            onChange={(event) =>
              setDraftCredentials((current) => ({
                ...current,
                idInstance: onlyDigits(event.target.value),
              }))
            }
            aria-invalid={Boolean(connectError) || undefined}
          />

          <label htmlFor="api-token">apiTokenInstance</label>
          <div className="token-field">
            <Input
              id="api-token"
              name="green-api-access-token"
              type={showToken ? "text" : "password"}
              autoComplete="new-password"
              data-1p-ignore
              data-bwignore
              data-lpignore="true"
              placeholder="Введите токен доступа"
              value={draftCredentials.apiTokenInstance}
              onChange={(event) =>
                setDraftCredentials((current) => ({
                  ...current,
                  apiTokenInstance: event.target.value,
                }))
              }
              aria-invalid={Boolean(connectError) || undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showToken ? "Скрыть токен" : "Показать токен"}
              onClick={() => setShowToken((value) => !value)}
            >
              {showToken ? <EyeOff /> : <Eye />}
            </Button>
          </div>

          <button
            className="api-url-toggle"
            type="button"
            onClick={() => setShowApiUrl((value) => !value)}
            aria-expanded={showApiUrl}
          >
            Параметры API
            <span>{showApiUrl ? "−" : "+"}</span>
          </button>
          {showApiUrl && (
            <div className="api-url-field">
              <label htmlFor="api-url">apiUrl из кабинета GREEN-API</label>
              <Input
                id="api-url"
                name="green-api-api-url"
                type="url"
                autoComplete="off"
                placeholder={DEFAULT_API_URL}
                value={draftCredentials.apiUrl}
                onChange={(event) =>
                  setDraftCredentials((current) => ({
                    ...current,
                    apiUrl: event.target.value,
                  }))
                }
              />
            </div>
          )}

          {connectError && <p className="form-error" role="alert">{connectError}</p>}

          <Button className="connect-button" size="lg" disabled={isConnecting}>
            {isConnecting ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
            {isConnecting ? "Проверяем инстанс…" : "Подключиться"}
          </Button>
        </form>

        <p className="connect-hint">
          Инстанс должен быть создан для Telegram и иметь статус «Авторизован».
        </p>
      </section>
    </main>
  )
}
