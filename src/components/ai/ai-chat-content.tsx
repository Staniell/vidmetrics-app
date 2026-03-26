"use client"

import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AiChatMessage } from "./ai-chat-message"
import { AiChatInput } from "./ai-chat-input"
import type { CondensedChannelContext } from "@/types"

interface AiChatContentProps {
  channelData: CondensedChannelContext | null
  comparisonData?: CondensedChannelContext | null
  channelHandle: string
}

const SOLO_STARTERS = [
  "What content is performing best?",
  "How can I improve engagement?",
  "What should I post next?",
]

const COMPARISON_STARTERS = [
  "Who's winning and why?",
  "Where does each channel have an advantage?",
  "What can each channel learn from the other?",
]

export function AiChatContent({
  channelData,
  comparisonData,
  channelHandle,
}: AiChatContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/ai/chat",
      body: {
        channelContext: channelData,
        comparisonContext: comparisonData ?? undefined,
      },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return
      setInput("")
      sendMessage({ text })
    },
    [input, isLoading, sendMessage]
  )

  const handleStarter = useCallback(
    (text: string) => {
      if (isLoading) return
      sendMessage({ text })
    },
    [isLoading, sendMessage]
  )

  const starters = comparisonData ? COMPARISON_STARTERS : SOLO_STARTERS

  const getMessageText = (msg: (typeof messages)[number]): string => {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-1">
        <div ref={scrollRef} className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-8">
              <p className="text-sm text-muted-foreground text-center">
                Ask anything about {comparisonData ? "these channels'" : "this channel's"} performance
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {starters.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleStarter(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <AiChatMessage
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={getMessageText(msg)}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t px-1 py-3">
        <AiChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
