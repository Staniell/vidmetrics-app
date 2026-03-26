"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { ChannelInput } from "@/components/channel-input"
import { parseChannelInput } from "@/lib/parse-channel-input"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(
    async (input: string) => {
      const parsed = parseChannelInput(input)
      if (!parsed) return

      if (parsed.type === "handle") {
        router.push(`/channel/${parsed.value.replace(/^@/, "")}`)
      } else {
        // Channel ID — resolve to handle via API, then navigate
        setIsLoading(true)
        try {
          const res = await fetch(
            `/api/channel?handle=${encodeURIComponent(input)}`
          )
          const data = await res.json()
          if (data.channel?.handle) {
            router.push(`/channel/${data.channel.handle.replace(/^@/, "")}`)
          }
        } catch {
          // API error — fall back to navigating with the raw input
        } finally {
          setIsLoading(false)
        }
      }
    },
    [router]
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <ChannelInput onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  )
}
