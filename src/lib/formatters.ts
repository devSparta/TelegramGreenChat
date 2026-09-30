export function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value)
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits
    return `+${normalized[0]} ${normalized.slice(1, 4)} ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9)}`
  }
  return digits ? `+${digits}` : "Новый контакт"
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp)
}

export function initials(title: string) {
  const parts = title.replace(/^@/, "").split(/[\s_-]+/).filter(Boolean)
  return (parts[0]?.[0] || "T") + (parts[1]?.[0] || "")
}
