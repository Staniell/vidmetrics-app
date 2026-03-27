"use client"

import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface AiChatMessageProps {
  role: "user" | "assistant"
  content: string
}

export function AiChatMessage({ role, content }: AiChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm max-w-[85%] min-w-0 overflow-hidden",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  )
}
