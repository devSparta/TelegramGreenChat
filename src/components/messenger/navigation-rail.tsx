import type { ReactNode } from "react"
import { CircleUserRound, MessageCircle, Plus, Send, Settings } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NavigationRailProps = {
  activeView: "list" | "chat"
  onChatsClick: () => void
  onNewChatClick: () => void
  onSettingsClick: () => void
}

export function NavigationRail({
  activeView,
  onChatsClick,
  onNewChatClick,
  onSettingsClick,
}: NavigationRailProps) {
  return (
    <nav className="nav-rail" aria-label="Основная навигация">
      <span className="telegram-mark rail-mark" aria-label="Telegram Green Chat">
        <Send />
      </span>
      <div className="rail-actions">
        <RailButton
          label="Чаты"
          active={activeView === "list"}
          icon={<MessageCircle />}
          onClick={onChatsClick}
        />
        <RailButton label="Новый чат" icon={<Plus />} onClick={onNewChatClick} />
        <RailButton label="Настройки" icon={<Settings />} onClick={onSettingsClick} />
      </div>
      <button
        className="rail-profile"
        aria-label="Параметры подключения"
        onClick={onSettingsClick}
      >
        <CircleUserRound />
      </button>
    </nav>
  )
}

type RailButtonProps = {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
}

function RailButton({ label, icon, active = false, onClick }: RailButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`rail-button ${active ? "active" : ""}`}
          onClick={onClick}
          aria-label={label}
          aria-current={active ? "page" : undefined}
        >
          {icon}
          <span>{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
