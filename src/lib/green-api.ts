export type GreenApiCredentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState = {
  stateInstance?: string
  [key: string]: unknown
}

export type CheckAccountResult = {
  exist?: boolean
  chatId?: string
  username?: string
  phoneNumber?: number
  fromCache?: boolean
  status?: boolean
  reason?: string
}

export type SendMessageResult = {
  idMessage?: string
}

export type NotificationEnvelope = {
  receiptId: number
  body: Record<string, unknown>
}

export class GreenApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(message: string, status = 0, details?: unknown) {
    super(message)
    this.name = "GreenApiError"
    this.status = status
    this.details = details
  }
}

function normalizeApiUrl(apiUrl: string) {
  const trimmed = apiUrl.trim().replace(/\/+$/, "")
  return trimmed || "https://api.green-api.com"
}

function errorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) return payload

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    for (const key of ["reason", "message", "description", "error"]) {
      const value = record[key]
      if (typeof value === "string" && value.trim()) return value
    }
  }

  return fallback
}

export class GreenApiClient {
  private readonly baseUrl: string

  constructor(private readonly credentials: GreenApiCredentials) {
    this.baseUrl = `${normalizeApiUrl(credentials.apiUrl)}/waInstance${credentials.idInstance}`
  }

  private endpoint(method: string, suffix = "") {
    const token = encodeURIComponent(this.credentials.apiTokenInstance)
    return `${this.baseUrl}/${method}/${token}${suffix}`
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    let response: Response

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error
      throw new GreenApiError(
        "Не удалось связаться с GREEN-API. Проверьте адрес API и интернет-соединение.",
      )
    }

    const raw = await response.text()
    let payload: unknown = null

    if (raw) {
      try {
        payload = JSON.parse(raw)
      } catch {
        payload = raw
      }
    }

    if (!response.ok) {
      throw new GreenApiError(
        errorMessage(payload, `GREEN-API вернул ошибку ${response.status}`),
        response.status,
        payload,
      )
    }

    return payload as T
  }

  getStateInstance(signal?: AbortSignal) {
    return this.request<InstanceState>(this.endpoint("getStateInstance"), { signal })
  }

  checkAccount(phoneNumber: string, signal?: AbortSignal) {
    return this.request<CheckAccountResult>(this.endpoint("checkAccount"), {
      method: "POST",
      signal,
      body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
    })
  }

  sendMessage(chatId: string, message: string, signal?: AbortSignal) {
    return this.request<SendMessageResult>(this.endpoint("sendMessage"), {
      method: "POST",
      signal,
      body: JSON.stringify({ chatId, message }),
    })
  }

  receiveNotification(signal?: AbortSignal, timeout = 5) {
    return this.request<NotificationEnvelope | null>(
      this.endpoint("receiveNotification", `?receiveTimeout=${timeout}`),
      { signal },
    )
  }

  deleteNotification(receiptId: number, signal?: AbortSignal) {
    return this.request<{ result: boolean; reason?: string }>(
      this.endpoint("deleteNotification", `/${receiptId}`),
      { method: "DELETE", signal },
    )
  }
}

export function getReadableError(error: unknown) {
  if (error instanceof GreenApiError) {
    if (error.status === 401) return "Неверный idInstance или apiTokenInstance."
    if (error.status === 403) return "У инстанса нет доступа к этому методу."
    if (error.status === 429 || error.status === 466 || error.status === 469) {
      return "Telegram временно ограничил запросы. Попробуйте позже."
    }
    return error.message
  }

  if (error instanceof Error) return error.message
  return "Произошла неизвестная ошибка."
}
