"use client"

import { useRef, type FormEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AiChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
}

export function AiChatInput({ input, isLoading, onInputChange, onSubmit }: AiChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={input}
        onChange={onInputChange}
        placeholder="Ask about this channel..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  )
}
