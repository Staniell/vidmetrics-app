"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { formatNumber, formatDateShort, formatEngagement } from "@/lib/format"
import { CHART_1, CHART_2, CHART_3, MUTED_FOREGROUND, BORDER } from "@/lib/pdf-theme"
import type { VideoMetrics } from "@/types"

interface PdfChartsSectionProps {
  videos: VideoMetrics[]
  comparisonVideos?: VideoMetrics[]
  primaryName: string
  comparisonName?: string
  isComparing: boolean
}

function buildViewsData(videos: VideoMetrics[]) {
  return [...videos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)
    .map((v) => ({ date: formatDateShort(v.publishedAt), views: v.viewCount }))
}

function buildEngagementData(videos: VideoMetrics[]) {
  return [...videos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map((v) => ({
      title: v.title.length > 20 ? v.title.substring(0, 20) + "..." : v.title,
      engagement: parseFloat(v.engagementRate.toFixed(2)),
    }))
}

function buildCompareViewsData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primarySorted = [...primaryVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20)
    .reverse()
  const comparisonSorted = [...comparisonVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20)
    .reverse()

  const maxLen = Math.max(primarySorted.length, comparisonSorted.length)
  const data: Record<string, unknown>[] = []
  for (let i = 0; i < maxLen; i++) {
    const entry: Record<string, unknown> = { label: `#${i + 1}` }
    if (primarySorted[i]) entry[primaryName] = primarySorted[i].viewCount
    if (comparisonSorted[i]) entry[comparisonName] = comparisonSorted[i].viewCount
    data.push(entry)
  }
  return data
}

function buildCompareEngagementData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primaryTop = [...primaryVideos].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5)
  const comparisonTop = [...comparisonVideos].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5)
  const maxLen = Math.max(primaryTop.length, comparisonTop.length)
  const data: Record<string, unknown>[] = []
  for (let i = 0; i < maxLen; i++) {
    const entry: Record<string, unknown> = { rank: `#${i + 1}` }
    if (primaryTop[i]) entry[primaryName] = parseFloat(primaryTop[i].engagementRate.toFixed(2))
    if (comparisonTop[i]) entry[comparisonName] = parseFloat(comparisonTop[i].engagementRate.toFixed(2))
    data.push(entry)
  }
  return data
}

const CHART_WIDTH = 370
const CHART_HEIGHT = 220

const axisTickStyle = { fontSize: 10, fill: MUTED_FOREGROUND }
const gridStroke = BORDER

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 8px 8px 8px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, paddingLeft: 8 }}>{title}</div>
      {children}
    </div>
  )
}

export function PdfChartsSection({
  videos,
  comparisonVideos,
  primaryName,
  comparisonName,
  isComparing,
}: PdfChartsSectionProps) {
  if (isComparing && comparisonVideos && comparisonName) {
    const viewsData = buildCompareViewsData(videos, comparisonVideos, primaryName, comparisonName)
    const engData = buildCompareEngagementData(videos, comparisonVideos, primaryName, comparisonName)

    return (
      <div style={{ display: "flex", gap: 12 }}>
        <ChartCard title="Views Over Time">
          {viewsData.length > 0 ? (
            <LineChart width={CHART_WIDTH} height={CHART_HEIGHT} data={viewsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatNumber} tick={axisTickStyle} tickLine={false} axisLine={false} width={50} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey={primaryName} stroke={CHART_1} strokeWidth={2} dot={{ r: 2 }} connectNulls />
              <Line type="monotone" dataKey={comparisonName} stroke={CHART_3} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            </LineChart>
          ) : (
            <div style={{ height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: MUTED_FOREGROUND }}>No data</div>
          )}
        </ChartCard>

        <ChartCard title="Top Engagement Rate">
          {engData.length > 0 ? (
            <BarChart width={CHART_WIDTH} height={CHART_HEIGHT} data={engData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="rank" tick={axisTickStyle} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={axisTickStyle} tickLine={false} axisLine={false} width={40} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey={primaryName} fill={CHART_1} radius={[3, 3, 0, 0]} />
              <Bar dataKey={comparisonName} fill={CHART_3} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <div style={{ height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: MUTED_FOREGROUND }}>No data</div>
          )}
        </ChartCard>
      </div>
    )
  }

  // Single channel mode
  const viewsData = buildViewsData(videos)
  const engData = buildEngagementData(videos)

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <ChartCard title="Views Over Time">
        {viewsData.length > 0 ? (
          <AreaChart width={CHART_WIDTH} height={CHART_HEIGHT} data={viewsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pdf-viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_1} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatNumber} tick={axisTickStyle} tickLine={false} axisLine={false} width={50} />
            <Area type="monotone" dataKey="views" stroke={CHART_1} fill="url(#pdf-viewsGradient)" strokeWidth={2} />
          </AreaChart>
        ) : (
          <div style={{ height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: MUTED_FOREGROUND }}>No data</div>
        )}
      </ChartCard>

      <ChartCard title="Top Engagement Rate">
        {engData.length > 0 ? (
          <BarChart width={CHART_WIDTH} height={CHART_HEIGHT} data={engData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 9, fill: MUTED_FOREGROUND }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={axisTickStyle} tickLine={false} axisLine={false} width={40} />
            <Bar dataKey="engagement" fill={CHART_2} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <div style={{ height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: MUTED_FOREGROUND }}>No data</div>
        )}
      </ChartCard>
    </div>
  )
}
