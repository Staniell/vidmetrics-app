"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { subDays, format } from "date-fns"
import { ChevronDown, CircleHelp, FileDown, GitCompareArrows, Loader2, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useChannel } from "@/hooks/use-channel"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { captureAndDownloadPdf, buildExportFilename } from "@/lib/pdf-export"
import { buildChannelContext } from "@/lib/ai/context-builder"
import { ChannelCard } from "@/components/channel-card"
import { ChannelInput } from "@/components/channel-input"
import { ChartsRow } from "@/components/charts-row"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { CompareStatCards, ChannelColumn } from "@/components/compare-stat-cards"
import { CompareAggregates } from "@/components/compare-aggregates"
import { CompareTopVideos } from "@/components/compare-top-videos"
import { AiInsightsButton } from "@/components/ai/ai-insights-button"
import { AiInsightsModal } from "@/components/ai/ai-insights-modal"
import { useAiInsights } from "@/hooks/use-ai-insights"
import { PdfExportLayout } from "@/components/pdf-export-layout"
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
  const [toolbarOpen, setToolbarOpen] = useState(false)

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

  const filteredComparisonVideos = useMemo(() => {
    if (!isComparing) return []
    let result = comparison.videos
    if (videoType !== "all") {
      result = result.filter((v) => v.videoType === videoType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((v) => v.title.toLowerCase().includes(q))
    }
    return result
  }, [comparison.videos, searchQuery, videoType, isComparing])

  const filteredComparisonRangeVideos = useMemo(() => {
    if (!isComparing) return []
    let result = comparison.rangeVideos
    if (videoType !== "all") {
      result = result.filter((v) => v.videoType === videoType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((v) => v.title.toLowerCase().includes(q))
    }
    return result
  }, [comparison.rangeVideos, searchQuery, videoType, isComparing])

  // AI insights modal
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const condensedChannelData = useMemo(() => {
    if (!primary.channel || primary.videos.length === 0) return null
    return buildChannelContext(primary.channel, primary.videos, primary.rangeVideos)
  }, [primary.channel, primary.videos, primary.rangeVideos])

  const condensedComparisonData = useMemo(() => {
    if (!isComparing || !comparison.channel || comparison.rangeVideos.length === 0) return null
    return buildChannelContext(comparison.channel, comparison.videos, comparison.rangeVideos)
  }, [isComparing, comparison.channel, comparison.videos, comparison.rangeVideos])

  // PDF export
  const [isExporting, setIsExporting] = useState(false)
  const [showExportLayout, setShowExportLayout] = useState(false)
  const exportLayoutRef = useRef<HTMLDivElement>(null)

  const handleExport = useCallback(async () => {
    if (!primary.channel) return
    setIsExporting(true)
    setShowExportLayout(true)

    // Wait for layout to render
    await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      if (exportLayoutRef.current) {
        const filename = buildExportFilename(
          primary.channel.handle,
          isComparing ? comparison.channel?.handle : undefined
        )
        await captureAndDownloadPdf(exportLayoutRef.current, filename)
      }
    } finally {
      setShowExportLayout(false)
      setIsExporting(false)
    }
  }, [primary.channel, comparison.channel, isComparing])

  const activeSort = isComparing ? sharedSort : primary.sort
  const activePeriod = isComparing ? sharedPeriod : primary.period
  const activeRangeStart = isComparing ? sharedRangeStart : primary.rangeStart
  const activeRangeEnd = isComparing ? sharedRangeEnd : primary.rangeEnd

  const isRangeSort = activeSort === "viewsInRange" || activeSort === "viewsInRange_asc"

  const { insights: aiInsights, isLoading: aiLoading, error: aiError, refresh: aiRefresh, fetch: aiFetch } = useAiInsights(condensedChannelData, condensedComparisonData, activePeriod)

  const handleAiOpen = useCallback(() => {
    aiFetch()
    setAiModalOpen(true)
  }, [aiFetch])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="space-y-6 pt-6">
        {primary.isLoading && !primary.channel && <LoadingState />}

        {primary.error && <ErrorState message={primary.error} onRetry={primary.retry} />}

        {primary.channel && (
          <>
            {/* Sticky toolbar: filters + action buttons */}
            <div className="sticky top-14 z-40 -mx-4 sm:-mx-6 lg:-mx-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
              {/* Mobile: toggle row + collapsible filters */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="shrink-0">
                      {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                    {isComparing ? (
                      <Button variant="outline" size="sm" onClick={handleRemoveComparison} className="shrink-0">
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    ) : showCompareInput ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <ChannelInput onSubmit={handleCompareSubmit} compact />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowCompareInput(false)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowCompareInput(true)} className="shrink-0">
                        <GitCompareArrows className="h-4 w-4 mr-1" />
                        Compare
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => setToolbarOpen((prev) => !prev)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    Filters
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toolbarOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {toolbarOpen && (
                  <div className="px-4 pb-3">
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
                  </div>
                )}
              </div>

              {/* Desktop: inline filters + actions */}
              <div className="hidden sm:flex items-center justify-between px-6 lg:px-8 py-3">
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
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
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
            </div>

            {/* Channel header: single card when solo, side-by-side stat cards when comparing */}
            {isComparing ? (
              <div className="space-y-4">
                {comparison.isLoading && !comparison.channel && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ChannelColumn channel={primary.channel} />
                    <Skeleton className="h-full min-h-[200px] w-full rounded-xl" />
                  </div>
                )}

                {comparison.error && (
                  <ErrorState message={comparison.error} onRetry={comparison.retry} />
                )}

                {comparison.channel && (
                  <CompareStatCards
                    primary={primary.channel}
                    comparison={comparison.channel}
                  />
                )}
              </div>
            ) : (
              <ChannelCard channel={primary.channel} />
            )}

            {/* Comparison details (charts, aggregates, top videos) */}
            {isComparing && comparison.channel && (
              <div className="space-y-6">
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

            {primary.isVideosLoading && primary.videos.length === 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-[320px] w-full rounded-xl" />
                <Skeleton className="h-[320px] w-full rounded-xl" />
              </div>
            )}

            {primary.videos.length > 0 && <ChartsRow videos={primary.videos} />}

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

            {(primary.isVideosLoading && primary.videos.length === 0) || (primary.isRangeLoading && isRangeSort) ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <VideoGrid
                videos={filteredVideos}
                rangeVideos={filteredRangeVideos}
                sortByRange={isRangeSort}
                sortAsc={activeSort.endsWith("_asc")}
              />
            )}

            {primary.nextPageToken && !searchQuery && activeSort !== "viewsInRange" && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={primary.fetchMoreVideos}
                  disabled={primary.isVideosLoading}
                >
                  {primary.isVideosLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Insights floating button + modal */}
      <AiInsightsButton
        visible={!!condensedChannelData}
        isLoading={aiLoading && !aiInsights}
        onClick={handleAiOpen}
      />
      <AiInsightsModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        channelData={condensedChannelData}
        comparisonData={condensedComparisonData}
        period={activePeriod}
        channelHandle={primary.channel?.handle ?? ""}
        insights={aiInsights}
        isLoading={aiLoading}
        error={aiError}
        onRefresh={aiRefresh}
      />

      {/* Off-screen PDF export layout — rendered via portal to avoid parent style interference */}
      {showExportLayout &&
        createPortal(
          <PdfExportLayout
            ref={exportLayoutRef}
            channel={primary.channel!}
            videos={filteredVideos}
            rangeVideos={filteredRangeVideos}
            sort={activeSort}
            period={activePeriod}
            rangeStart={activeRangeStart}
            rangeEnd={activeRangeEnd}
            comparisonChannel={isComparing ? comparison.channel ?? undefined : undefined}
            comparisonVideos={isComparing ? filteredComparisonVideos : undefined}
            comparisonRangeVideos={isComparing ? filteredComparisonRangeVideos : undefined}
          />,
          document.body
        )}
    </main>
  )
}
