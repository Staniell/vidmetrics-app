"use client"

import { useState } from "react"
import { Bot, MessageCircle, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AiInsightsContent } from "./ai-insights-content"
import { AiChatContent } from "./ai-chat-content"
import type { CondensedChannelContext, AiInsights, AiComparisonInsights } from "@/types"

interface AiInsightsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelData: CondensedChannelContext | null
  comparisonData: CondensedChannelContext | null
  period: string
  channelHandle: string
  insights: AiInsights | AiComparisonInsights | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export function AiInsightsModal({
  open,
  onOpenChange,
  channelData,
  comparisonData,
  channelHandle,
  insights,
  isLoading,
  error,
  onRefresh,
}: AiInsightsModalProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "chat">("insights")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] sm:max-h-[85vh] flex-col gap-0 p-0 w-full max-w-[100vw] sm:max-w-2xl rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Insights
            </DialogTitle>
            {activeTab === "insights" && (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            )}
          </div>
          <DialogDescription>
            {channelHandle.startsWith("@") ? channelHandle : `@${channelHandle}`}
            {comparisonData && ` vs ${comparisonData.handle.startsWith("@") ? comparisonData.handle : `@${comparisonData.handle}`}`}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b px-4 sm:px-6 pt-3">
          <button
            onClick={() => setActiveTab("insights")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-md -mb-px",
              activeTab === "insights"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            Insights
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-md -mb-px",
              activeTab === "chat"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </button>
        </div>

        {/* Tab content — both always mounted, inactive gets hidden */}
        <div className={cn("overflow-y-auto flex-1 min-h-0", activeTab !== "insights" && "hidden")}>
          <div className="px-4 sm:px-6 py-4">
            <AiInsightsContent
              insights={insights}
              channelData={channelData}
              comparisonData={comparisonData}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
            />
          </div>
        </div>

        <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden px-4 sm:px-5 py-4", activeTab !== "chat" && "hidden")}>
          <AiChatContent
            channelData={channelData}
            comparisonData={comparisonData}
            channelHandle={channelHandle}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
