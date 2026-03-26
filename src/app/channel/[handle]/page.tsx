"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { subDays, format } from "date-fns"
import { CircleHelp, GitCompareArrows, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useChannel } from "@/hooks/use-channel"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { ChannelCard } from "@/components/channel-card"
import { ChannelInput } from "@/components/channel-input"
import { ChartsRow } from "@/components/charts-row"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { CompareStatCards } from "@/components/compare-stat-cards"
import { CompareAggregates } from "@/components/compare-aggregates"
import { CompareTopVideos } from "@/components/compare-top-videos"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CompareCharts = dynamic(
  () => import("@/components/compare-charts").then((mod) => mod.CompareCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    ),
  }
)

export default function ChannelPage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const decodedHandle = decodeURIComponent(handle)
  const vsParam = searchParams.get("vs")

  // Lifted filter state shared between both channels when comparing
  const today = format(new Date(), "yyyy-MM-dd")
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")
  const [sharedSort, setSharedSort] = useState("views")
  const [sharedPeriod, setSharedPeriod] = useState("30")
  const [sharedRangeStart, setSharedRangeStart] = useState(thirtyDaysAgo)
  const [sharedRangeEnd, setSharedRangeEnd] = useState(today)

  const setSharedCustomRange = useCallback((start: string, end: string) => {
    setSharedPeriod("custom")
    setSharedRangeStart(start)
    setSharedRangeEnd(end)
  }, [])

  const [showCompareInput, setShowCompareInput] = useState(false)

  const isComparing = !!vsParam

  const sharedOptions = isComparing
    ? {
        externalSort: sharedSort,
        externalPeriod: sharedPeriod,
        externalRangeStart: sharedRangeStart,
        externalRangeEnd: sharedRangeEnd,
      }
    : undefined

  const primary = useChannel(decodedHandle, sharedOptions)
  const comparison = useChannel(isComparing ? vsParam : undefined, sharedOptions)

  // Normalize URL to match canonical handle from API
  useEffect(() => {
    if (primary.channel?.handle) {
      const canonical = primary.channel.handle.replace(/^@/, "")
      if (canonical !== decodedHandle) {
        const vsQuery = vsParam ? `?vs=${vsParam}` : ""
        router.replace(`/channel/${canonical}${vsQuery}`)
      }
    }
  }, [primary.channel?.handle, decodedHandle, vsParam, router])

  const handleCompareSubmit = useCallback(
    async (input: string) => {
      const parsed = parseChannelInput(input)
      if (!parsed) return

      let compareHandle: string
      if (parsed.type === "handle") {
        compareHandle = parsed.value.replace(/^@/, "")
      } else {
        try {
          const res = await fetch(`/api/channel?handle=${encodeURIComponent(input)}`)
          if (res.ok) {
            const data = await res.json()
            compareHandle = data.channel?.handle?.replace(/^@/, "") || parsed.value
          } else {
            compareHandle = parsed.value
          }
        } catch {
          compareHandle = parsed.value
        }
      }

      setShowCompareInput(false)
      router.push(`/channel/${decodedHandle}?vs=${encodeURIComponent(compareHandle)}`)
    },
    [router, decodedHandle]
  )

  const handleRemoveComparison = useCallback(() => {
    router.push(`/channel/${decodedHandle}`)
  }, [router, decodedHandle])

  const [searchQuery, setSearchQuery] = useState("")
  const [videoType, setVideoType] = useState("all")

  const filteredVideos = useMemo(() => {
    let result = primary.videos
    if (videoType !== "all") {
      result = result.filter((v) => v.videoType === videoType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((v) => v.title.toLowerCase().includes(q))
    }
    return result
  }, [primary.videos, searchQuery, videoType])

  const filteredRangeVideos = useMemo(() => {
    let result = primary.rangeVideos
    if (videoType !== "all") {
      result = result.filter((v) => v.videoType === videoType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((v) => v.title.toLowerCase().includes(q))
    }
    return result
  }, [primary.rangeVideos, searchQuery, videoType])

  const activeSort = isComparing ? sharedSort : primary.sort
  const activePeriod = isComparing ? sharedPeriod : primary.period
  const activeRangeStart = isComparing ? sharedRangeStart : primary.rangeStart
  const activeRangeEnd = isComparing ? sharedRangeEnd : primary.rangeEnd

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="space-y-6 pt-6">
        {primary.isLoading && !primary.channel && <LoadingState />}

        {primary.error && <ErrorState message={primary.error} onRetry={primary.retry} />}

        {primary.channel && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <ChannelCard channel={primary.channel} />
              </div>
              <div className="flex items-center gap-2 shrink-0 sm:pt-2">
                {isComparing ? (
                  <Button variant="outline" size="sm" onClick={handleRemoveComparison}>
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                ) : showCompareInput ? (
                  <div className="flex items-center gap-2">
                    <ChannelInput onSubmit={handleCompareSubmit} compact />
                    <Button variant="ghost" size="sm" onClick={() => setShowCompareInput(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowCompareInput(true)}>
                    <GitCompareArrows className="h-4 w-4 mr-1" />
                    Compare
                  </Button>
                )}
              </div>
            </div>

            {/* Comparison section */}
            {isComparing && (
              <>
                {comparison.isLoading && !comparison.channel && (
                  <div className="space-y-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                  </div>
                )}

                {comparison.error && (
                  <ErrorState message={comparison.error} onRetry={comparison.retry} />
                )}

                {comparison.channel && (
                  <div className="space-y-6">
                    <CompareStatCards
                      primary={primary.channel}
                      comparison={comparison.channel}
                    />

                    {primary.videos.length > 0 && comparison.videos.length > 0 && (
                      <CompareCharts
                        primaryVideos={primary.videos}
                        comparisonVideos={comparison.videos}
                        primaryName={primary.channel.title}
                        comparisonName={comparison.channel.title}
                      />
                    )}

                    {(primary.rangeVideos.length > 0 || comparison.rangeVideos.length > 0) && (
                      <CompareAggregates
                        primaryVideos={primary.videos}
                        comparisonVideos={comparison.videos}
                        primaryRangeVideos={primary.rangeVideos}
                        comparisonRangeVideos={comparison.rangeVideos}
                        primaryName={primary.channel.title}
                        comparisonName={comparison.channel.title}
                      />
                    )}

                    {(primary.videos.length > 0 || comparison.videos.length > 0) && (
                      <CompareTopVideos
                        primaryVideos={primary.videos}
                        comparisonVideos={comparison.videos}
                        primaryRangeVideos={primary.rangeVideos}
                        comparisonRangeVideos={comparison.rangeVideos}
                        primaryName={primary.channel.title}
                        comparisonName={comparison.channel.title}
                        sort={activeSort}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            {primary.videos.length > 0 && <ChartsRow videos={primary.videos} />}

            <FilterBar
              sort={activeSort}
              period={activePeriod}
              rangeStart={activeRangeStart}
              rangeEnd={activeRangeEnd}
              videoType={videoType}
              searchQuery={searchQuery}
              onSortChange={isComparing ? setSharedSort : primary.setSort}
              onPeriodChange={isComparing ? setSharedPeriod : primary.setPeriod}
              onCustomRangeChange={isComparing ? setSharedCustomRange : primary.setCustomRange}
              onVideoTypeChange={setVideoType}
              onSearchChange={setSearchQuery}
            />

            {primary.rangeVideos.length > 0 && (() => {
              const hasEstimated = primary.rangeVideos.some((v) => v.dataSource === "estimated")
              const hasVelocity = primary.rangeVideos.some((v) => v.dataSource === "velocity")
              const allTracked = primary.rangeVideos.every((v) => v.dataSource === "tracked")

              let text = ""
              let tooltipText = ""

              if (allTracked && primary.trackedSince) {
                text = `Tracking since ${new Date(primary.trackedSince).toLocaleDateString()}`
                tooltipText = "View counts are based on exact snapshots recorded over the selected date range."
              } else if (hasVelocity) {
                text = "Based on live view velocity — accuracy improves over time."
                tooltipText = "We measured how fast each video is gaining views right now and projected that rate across the selected range. The longer we track, the more accurate it gets."
              } else if (hasEstimated) {
                text = "Estimating views — accuracy improves in ~10 min."
                tooltipText = "YouTube doesn't share how many views a video got in a specific time period. We're estimating based on each video's age and total views. In about 10 minutes, we'll take a second reading and use real view velocity instead."
              }

              if (!text) return null

              return (
                <TooltipProvider>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {text}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleHelp className="h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </p>
                </TooltipProvider>
              )
            })()}

            <VideoGrid
              videos={filteredVideos}
              rangeVideos={filteredRangeVideos}
              sortByRange={activeSort === "viewsInRange"}
            />

            {primary.nextPageToken && !searchQuery && activeSort !== "viewsInRange" && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={primary.fetchMoreVideos}
                  disabled={primary.isLoading}
                >
                  {primary.isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
