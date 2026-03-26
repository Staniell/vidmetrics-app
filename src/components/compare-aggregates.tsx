import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatEngagement } from "@/lib/format"
import { cn, winnerClass } from "@/lib/utils"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface CompareAggregatesProps {
  primaryVideos: VideoMetrics[]
  comparisonVideos: VideoMetrics[]
  primaryRangeVideos: VideoViewDelta[]
  comparisonRangeVideos: VideoViewDelta[]
  primaryName: string
  comparisonName: string
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((sum, v) => sum + v, 0) / arr.length
}

function typeBreakdown(videos: VideoMetrics[]): string {
  if (videos.length === 0) return "-"
  const counts = { video: 0, short: 0, live: 0 }
  for (const v of videos) counts[v.videoType]++
  const parts: string[] = []
  if (counts.video > 0) parts.push(`${Math.round((counts.video / videos.length) * 100)}% Videos`)
  if (counts.short > 0) parts.push(`${Math.round((counts.short / videos.length) * 100)}% Shorts`)
  if (counts.live > 0) parts.push(`${Math.round((counts.live / videos.length) * 100)}% Lives`)
  return parts.join(", ")
}

export function CompareAggregates({
  primaryVideos,
  comparisonVideos,
  primaryRangeVideos,
  comparisonRangeVideos,
  primaryName,
  comparisonName,
}: CompareAggregatesProps) {
  const pAvgViews = avg(primaryVideos.map((v) => v.viewCount))
  const cAvgViews = avg(comparisonVideos.map((v) => v.viewCount))
  const pAvgEng = avg(primaryVideos.map((v) => v.engagementRate))
  const cAvgEng = avg(comparisonVideos.map((v) => v.engagementRate))
  const pTotalRange = primaryRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)
  const cTotalRange = comparisonRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)

  const viewsWin = winnerClass(pAvgViews, cAvgViews)
  const engWin = winnerClass(pAvgEng, cAvgEng)
  const rangeWin = winnerClass(pTotalRange, cTotalRange)

  const stats = [
    {
      label: "Avg Views/Video",
      primary: formatNumber(Math.round(pAvgViews)),
      comparison: formatNumber(Math.round(cAvgViews)),
      pClass: viewsWin.aClass,
      cClass: viewsWin.bClass,
    },
    {
      label: "Avg Engagement",
      primary: formatEngagement(pAvgEng),
      comparison: formatEngagement(cAvgEng),
      pClass: engWin.aClass,
      cClass: engWin.bClass,
    },
    {
      label: "Views in Period",
      primary: formatNumber(pTotalRange),
      comparison: formatNumber(cTotalRange),
      pClass: rangeWin.aClass,
      cClass: rangeWin.bClass,
    },
    {
      label: "Content Mix",
      primary: typeBreakdown(primaryVideos),
      comparison: typeBreakdown(comparisonVideos),
      pClass: "",
      cClass: "",
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {stat.label}
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-sm font-semibold", stat.pClass)} title={primaryName}>
                  {stat.primary}
                </span>
                <span className="text-[10px] text-muted-foreground">vs</span>
                <span className={cn("text-sm font-semibold", stat.cClass)} title={comparisonName}>
                  {stat.comparison}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
