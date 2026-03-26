"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CondensedChannelContext, AiInsights, AiComparisonInsights } from "@/types"

type InsightsResult = AiInsights | AiComparisonInsights

export function useAiInsights(
  channelData: CondensedChannelContext | null,
  comparisonData: CondensedChannelContext | null,
  period: string
) {
  const [insights, setInsights] = useState<InsightsResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track last fetched key to deduplicate
  const lastKeyRef = useRef<string>("")

  const fetchInsights = useCallback(
    async (force = false) => {
      if (!channelData) return

      const key = `${channelData.channelId}:${comparisonData?.channelId ?? ""}:${period}`
      if (!force && key === lastKeyRef.current && insights) return

      lastKeyRef.current = key
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: channelData.channelId,
            channelData,
            period,
            comparisonChannel: comparisonData ?? undefined,
            force,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || "Failed to generate insights")
        }

        const data = await res.json()
        setInsights(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate insights")
      } finally {
        setIsLoading(false)
      }
    },
    [channelData, comparisonData, period, insights]
  )

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const refresh = useCallback(() => {
    fetchInsights(true)
  }, [fetchInsights])

  return { insights, isLoading, error, refresh }
}
