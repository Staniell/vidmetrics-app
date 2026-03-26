"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatDateShort, formatEngagement } from "@/lib/format"
import type { VideoMetrics } from "@/types"

interface CompareChartsProps {
  primaryVideos: VideoMetrics[]
  comparisonVideos: VideoMetrics[]
  primaryName: string
  comparisonName: string
}

function buildViewsData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primarySorted = [...primaryVideos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)

  const comparisonSorted = [...comparisonVideos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)

  const all = [
    ...primarySorted.map((v) => ({ date: v.publishedAt, channel: primaryName, views: v.viewCount })),
    ...comparisonSorted.map((v) => ({ date: v.publishedAt, channel: comparisonName, views: v.viewCount })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Merge into chart-friendly format with one entry per date point
  const merged: Record<string, unknown>[] = []
  for (const entry of all) {
    merged.push({
      label: formatDateShort(entry.date),
      [entry.channel]: entry.views,
    })
  }

  return merged
}

function buildEngagementData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primaryTop = [...primaryVideos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5)

  const comparisonTop = [...comparisonVideos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5)

  const maxLen = Math.max(primaryTop.length, comparisonTop.length)
  const data: Record<string, unknown>[] = []

  for (let i = 0; i < maxLen; i++) {
    const entry: Record<string, unknown> = { rank: `#${i + 1}` }
    if (primaryTop[i]) {
      entry[primaryName] = parseFloat(primaryTop[i].engagementRate.toFixed(2))
    }
    if (comparisonTop[i]) {
      entry[comparisonName] = parseFloat(comparisonTop[i].engagementRate.toFixed(2))
    }
    data.push(entry)
  }

  return data
}

export function CompareCharts({
  primaryVideos,
  comparisonVideos,
  primaryName,
  comparisonName,
}: CompareChartsProps) {
  const viewsData = buildViewsData(primaryVideos, comparisonVideos, primaryName, comparisonName)
  const engagementData = buildEngagementData(primaryVideos, comparisonVideos, primaryName, comparisonName)

  const tooltipStyle = {
    backgroundColor: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {viewsData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={viewsData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatNumber(v)}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "var(--color-foreground)" }}
                  formatter={(value) => [formatNumber(Number(value)), "Views"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={primaryName}
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey={comparisonName}
                  stroke="var(--color-chart-3)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Engagement Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {engagementData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engagementData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="rank"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "var(--color-foreground)" }}
                  formatter={(value, name) => [formatEngagement(Number(value)), name]}
                />
                <Legend />
                <Bar dataKey={primaryName} fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey={comparisonName} fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
