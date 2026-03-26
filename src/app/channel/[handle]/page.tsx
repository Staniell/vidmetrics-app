"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CircleHelp } from "lucide-react"
import { useChannel } from "@/hooks/use-channel"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { ChannelInput } from "@/components/channel-input"
import { ChannelCard } from "@/components/channel-card"
import { TrendingCarousel } from "@/components/trending-carousel"
import { ChartsRow } from "@/components/charts-row"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ChannelPage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const decodedHandle = decodeURIComponent(handle)

  const {
    channel,
    videos,
    rangeVideos,
    isLoading,
    error,
    sort,
    period,
    trackedSince,
    nextPageToken,
    fetchChannel,
    fetchMoreVideos,
    setSort,
    setPeriod,
    retry,
  } = useChannel(decodedHandle)

  // Normalize URL to match canonical handle from API
  useEffect(() => {
    if (channel?.handle) {
      const canonical = channel.handle.replace(/^@/, "")
      if (canonical !== decodedHandle) {
        router.replace(`/channel/${canonical}`)
      }
    }
  }, [channel?.handle, decodedHandle, router])

  const [searchQuery, setSearchQuery] = useState("")

  const handleSubmit = useCallback(
    async (input: string) => {
      const parsed = parseChannelInput(input)
      if (!parsed) return

      if (parsed.type === "handle") {
        const clean = parsed.value.replace(/^@/, "")
        router.push(`/channel/${clean}`)
      } else {
        // Channel ID — resolve to handle via API, then navigate
        const info = await fetchChannel(input)
        if (info?.handle) {
          router.replace(`/channel/${info.handle.replace(/^@/, "")}`)
        }
      }
    },
    [router, fetchChannel]
  )

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos
    const q = searchQuery.toLowerCase()
    return videos.filter((v) => v.title.toLowerCase().includes(q))
  }, [videos, searchQuery])

  const filteredRangeVideos = useMemo(() => {
    if (!searchQuery.trim()) return rangeVideos
    const q = searchQuery.toLowerCase()
    return rangeVideos.filter((v) => v.title.toLowerCase().includes(q))
  }, [rangeVideos, searchQuery])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="space-y-6 pt-6">
        <ChannelInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          compact
        />

        {isLoading && !channel && <LoadingState />}

        {error && <ErrorState message={error} onRetry={retry} />}

        {channel && (
          <>
            <ChannelCard channel={channel} />

            {rangeVideos.length > 0 && (
              <TrendingCarousel videos={rangeVideos} />
            )}

            {videos.length > 0 && <ChartsRow videos={videos} />}

            <FilterBar
              sort={sort}
              period={period}
              searchQuery={searchQuery}
              onSortChange={setSort}
              onPeriodChange={setPeriod}
              onSearchChange={setSearchQuery}
            />

            {rangeVideos.length > 0 && (() => {
              const hasEstimated = rangeVideos.some((v) => v.dataSource === "estimated")
              const hasVelocity = rangeVideos.some((v) => v.dataSource === "velocity")
              const allTracked = rangeVideos.every((v) => v.dataSource === "tracked")

              let text = ""
              let tooltipText = ""

              if (allTracked && trackedSince) {
                text = `Tracking since ${new Date(trackedSince).toLocaleDateString()}`
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
              sortByRange={sort === "viewsInRange"}
            />

            {nextPageToken && !searchQuery && sort !== "viewsInRange" && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={fetchMoreVideos}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
