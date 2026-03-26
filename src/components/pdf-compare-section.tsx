import { formatNumber, formatEngagement } from "@/lib/format"
import { GREEN_600, MUTED_FOREGROUND, BORDER } from "@/lib/pdf-theme"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface PdfCompareSectionProps {
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

function winnerColor(a: number, b: number): { a: string; b: string } {
  if (a > b) return { a: GREEN_600, b: "inherit" }
  if (b > a) return { a: "inherit", b: GREEN_600 }
  return { a: "inherit", b: "inherit" }
}

export function PdfCompareSection({
  primaryVideos,
  comparisonVideos,
  primaryRangeVideos,
  comparisonRangeVideos,
  primaryName,
  comparisonName,
}: PdfCompareSectionProps) {
  const pAvgViews = avg(primaryVideos.map((v) => v.viewCount))
  const cAvgViews = avg(comparisonVideos.map((v) => v.viewCount))
  const pAvgEng = avg(primaryVideos.map((v) => v.engagementRate))
  const cAvgEng = avg(comparisonVideos.map((v) => v.engagementRate))
  const pTotalRange = primaryRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)
  const cTotalRange = comparisonRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)

  const viewsWin = winnerColor(pAvgViews, cAvgViews)
  const engWin = winnerColor(pAvgEng, cAvgEng)
  const rangeWin = winnerColor(pTotalRange, cTotalRange)

  const stats = [
    {
      label: "Avg Views/Video",
      primary: formatNumber(Math.round(pAvgViews)),
      comparison: formatNumber(Math.round(cAvgViews)),
      pColor: viewsWin.a,
      cColor: viewsWin.b,
    },
    {
      label: "Avg Engagement",
      primary: formatEngagement(pAvgEng),
      comparison: formatEngagement(cAvgEng),
      pColor: engWin.a,
      cColor: engWin.b,
    },
    {
      label: "Views in Period",
      primary: formatNumber(pTotalRange),
      comparison: formatNumber(cTotalRange),
      pColor: rangeWin.a,
      cColor: rangeWin.b,
    },
    {
      label: "Content Mix",
      primary: typeBreakdown(primaryVideos),
      comparison: typeBreakdown(comparisonVideos),
      pColor: "inherit",
      cColor: "inherit",
    },
  ]

  const truncate = (name: string, max: number) =>
    name.length > max ? name.slice(0, max) + "..." : name

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 9, color: MUTED_FOREGROUND, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: MUTED_FOREGROUND }}>{truncate(primaryName, 14)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: stat.pColor }}>{stat.primary}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: MUTED_FOREGROUND }}>{truncate(comparisonName, 14)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: stat.cColor }}>{stat.comparison}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
