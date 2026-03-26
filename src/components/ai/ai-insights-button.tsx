"use client"

import { Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiInsightsButtonProps {
  visible: boolean
  isLoading: boolean
  onClick: () => void
}

export function AiInsightsButton({ visible, isLoading, onClick }: AiInsightsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      )}
      aria-label="Open AI Insights"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Bot className="h-6 w-6" />
      )}
    </button>
  )
}
