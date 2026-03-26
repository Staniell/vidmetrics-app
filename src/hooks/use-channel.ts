"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { subDays, format } from "date-fns"
import { parseChannelInput } from "@/lib/parse-channel-input"
import type { ChannelInfo, VideoMetrics, VideoViewDelta } from "@/types"

function rangeDatesFromPeriod(period: string): { start: string; end: string } {
  const today = new Date()
  const end = format(today, "yyyy-MM-dd")
  if (period === "all") return { start: "2005-01-01", end }
  const days = parseInt(period, 10) || 30
  return { start: format(subDays(today, days), "yyyy-MM-dd"), end }
}

interface UseChannelReturn {
  channel: ChannelInfo | null
  videos: VideoMetrics[]
  rangeVideos: VideoViewDelta[]
  isLoading: boolean
  error: string | null
  sort: string
  period: string
  rangeStart: string
  rangeEnd: string
  trackedSince: string | null
  nextPageToken: string | null
  fetchChannel: (input: string) => Promise<ChannelInfo | null>
  fetchMoreVideos: () => Promise<void>
  setSort: (sort: string) => void
  setPeriod: (period: string) => void
  setCustomRange: (start: string, end: string) => void
  retry: () => void
}

interface UseChannelOptions {
  externalSort?: string
  externalPeriod?: string
  externalRangeStart?: string
  externalRangeEnd?: string
}

async function fetchVideosApi(
  channelId: string,
  sortBy: string,
  periodVal: string,
  signal: AbortSignal,
  pageToken?: string
) {
  const params = new URLSearchParams({ sort: sortBy, period: periodVal })
  if (pageToken) params.set("pageToken", pageToken)

  const res = await fetch(
    `/api/channel/${channelId}/videos?${params.toString()}`,
    { signal }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}

async function fetchViewsInRangeApi(
  channelId: string,
  start: string,
  end: string,
  signal: AbortSignal
) {
  const params = new URLSearchParams({ start, end })
  const res = await fetch(
    `/api/channel/${channelId}/views-in-range?${params.toString()}`,
    { signal }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}

export function useChannel(initialHandle?: string, options?: UseChannelOptions): UseChannelReturn {
  const [channel, setChannel] = useState<ChannelInfo | null>(null)
  const [videos, setVideos] = useState<VideoMetrics[]>([])
  const [rangeVideos, setRangeVideos] = useState<VideoViewDelta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState("views")
  const [period, setPeriod] = useState("30")
  const initialRange = rangeDatesFromPeriod("30")
  const [rangeStart, setRangeStart] = useState(initialRange.start)
  const [rangeEnd, setRangeEnd] = useState(initialRange.end)
  const [trackedSince, setTrackedSince] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const lastInputRef = useRef<string>("")
  const fetchChannelAbortRef = useRef<AbortController | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Skip the refetch effect when fetchChannel already loaded videos
  const skipNextEffectRef = useRef(false)
  const skipNextRangeEffectRef = useRef(false)

  // When external overrides are provided (comparison mode), use those; otherwise fall back to internal state
  const effectiveSort = options?.externalSort ?? sort
  const effectivePeriod = options?.externalPeriod ?? period
  const effectiveRangeStart = options?.externalRangeStart ?? rangeStart
  const effectiveRangeEnd = options?.externalRangeEnd ?? rangeEnd

  // Stable reference to current sort/period/range for use in fetchChannel
  const sortRef = useRef(effectiveSort)
  const periodRef = useRef(effectivePeriod)
  const rangeStartRef = useRef(effectiveRangeStart)
  const rangeEndRef = useRef(effectiveRangeEnd)
  sortRef.current = effectiveSort
  periodRef.current = effectivePeriod
  rangeStartRef.current = effectiveRangeStart
  rangeEndRef.current = effectiveRangeEnd

  const fetchChannel = useCallback(
    async (input: string): Promise<ChannelInfo | null> => {
      fetchChannelAbortRef.current?.abort()
      const controller = new AbortController()
      fetchChannelAbortRef.current = controller

      const parsed = parseChannelInput(input)
      if (!parsed) {
        setError("Please enter a valid YouTube channel URL or @handle")
        return null
      }

      // Clear any pending auto-refresh from a previous channel
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }

      lastInputRef.current = input
      setIsLoading(true)
      setError(null)
      setChannel(null)
      setVideos([])
      setRangeVideos([])
      setNextPageToken(null)
      setTrackedSince(null)

      try {
        const channelRes = await fetch(
          `/api/channel?handle=${encodeURIComponent(input)}`,
          { signal: controller.signal }
        )

        if (!channelRes.ok) {
          const data = await channelRes.json().catch(() => ({}))
          throw new Error(data.error || "Failed to fetch channel")
        }

        const channelData = await channelRes.json()

        const [videosData, rangeData] = await Promise.all([
          fetchVideosApi(
            channelData.channel.id,
            sortRef.current,
            periodRef.current,
            controller.signal
          ),
          fetchViewsInRangeApi(
            channelData.channel.id,
            rangeStartRef.current,
            rangeEndRef.current,
            controller.signal
          ),
        ])

        // Skip the next effect trigger since we just loaded videos
        skipNextEffectRef.current = true
        skipNextRangeEffectRef.current = true
        setChannel(channelData.channel)
        setVideos(videosData.videos)
        setRangeVideos(rangeData.videos)
        setTrackedSince(rangeData.trackedSince)
        setNextPageToken(videosData.nextPageToken || null)

        // Auto-refresh views-in-range after 10 minutes to capture a second
        // snapshot and upgrade from "estimated" to "velocity" data
        const cid = channelData.channel.id
        refreshTimerRef.current = setTimeout(() => {
          const ctrl = new AbortController()
          fetchViewsInRangeApi(cid, rangeStartRef.current, rangeEndRef.current, ctrl.signal)
            .then((data) => {
              setRangeVideos(data.videos)
              setTrackedSince(data.trackedSince)
            })
            .catch(() => {})
        }, 10 * 60 * 1000)

        return channelData.channel as ChannelInfo
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [] // No sort/period deps — uses refs for stable identity
  )

  const fetchMoreVideos = useCallback(async () => {
    if (!channel || !nextPageToken) return

    const controller = new AbortController()
    try {
      const data = await fetchVideosApi(
        channel.id,
        effectiveSort,
        effectivePeriod,
        controller.signal,
        nextPageToken
      )
      setVideos((prev) => [...prev, ...data.videos])
      setNextPageToken(data.nextPageToken || null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(
        err instanceof Error ? err.message : "Failed to load more videos"
      )
    }
  }, [channel, nextPageToken, effectiveSort, effectivePeriod])

  const retry = useCallback(() => {
    if (lastInputRef.current) {
      fetchChannel(lastInputRef.current)
    }
  }, [fetchChannel])

  // Refetch videos when sort or period changes (not on initial channel load)
  useEffect(() => {
    if (!channel) return
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false
      return
    }
    // When sorting by viewsInRange, the grid uses rangeVideos data directly
    if (effectiveSort === "viewsInRange") return

    const controller = new AbortController()
    setIsLoading(true)

    fetchVideosApi(channel.id, effectiveSort, effectivePeriod, controller.signal)
      .then((data) => {
        setVideos(data.videos)
        setNextPageToken(data.nextPageToken || null)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to fetch videos")
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [effectiveSort, effectivePeriod, channel])

  const setCustomRange = useCallback((start: string, end: string) => {
    setPeriod("custom")
    setRangeStart(start)
    setRangeEnd(end)
  }, [])

  // Sync range dates when period changes (skip for custom — dates set directly)
  useEffect(() => {
    if (options?.externalPeriod) return // externally controlled, skip sync
    if (period === "custom") return
    const { start, end } = rangeDatesFromPeriod(period)
    setRangeStart(start)
    setRangeEnd(end)
  }, [period, options?.externalPeriod])

  // Clean up auto-refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  // Auto-fetch when initialHandle is provided or changes (URL-based routing)
  const prevHandleRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (initialHandle && initialHandle !== prevHandleRef.current) {
      prevHandleRef.current = initialHandle
      fetchChannel("@" + initialHandle)
    }
  }, [initialHandle, fetchChannel])

  // Refetch views-in-range when date range changes
  useEffect(() => {
    if (!channel) return
    if (skipNextRangeEffectRef.current) {
      skipNextRangeEffectRef.current = false
      return
    }

    const controller = new AbortController()

    fetchViewsInRangeApi(channel.id, effectiveRangeStart, effectiveRangeEnd, controller.signal)
      .then((data) => {
        setRangeVideos(data.videos)
        setTrackedSince(data.trackedSince)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
      })

    return () => controller.abort()
  }, [effectiveRangeStart, effectiveRangeEnd, channel])

  return {
    channel,
    videos,
    rangeVideos,
    isLoading,
    error,
    sort: effectiveSort,
    period: effectivePeriod,
    rangeStart: effectiveRangeStart,
    rangeEnd: effectiveRangeEnd,
    trackedSince,
    nextPageToken,
    fetchChannel,
    fetchMoreVideos,
    setSort,
    setPeriod,
    setCustomRange,
    retry,
  }
}
