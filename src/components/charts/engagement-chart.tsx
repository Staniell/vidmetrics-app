"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatEngagement } from "@/lib/format"
import type { VideoMetrics } from "@/types"

interface EngagementChartProps {
  videos: VideoMetrics[]
}

export function EngagementChart({ videos }: EngagementChartProps) {
  const data = [...videos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map((v) => ({
      id: v.id,
      title:
        v.title.length > 25 ? v.title.substring(0, 25) + "..." : v.title,
      fullTitle: v.title,
      engagement: parseFloat(v.engagementRate.toFixed(2)),
    }))

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          vertical={false}
        />
        <XAxis
          dataKey="title"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
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
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "var(--color-foreground)" }}
          formatter={(value) => [
            formatEngagement(Number(value)),
            "Engagement",
          ]}
          labelFormatter={(_, payload) => {
            const item = payload?.[0]?.payload
            return item?.fullTitle || ""
          }}
        />
        <Bar
          dataKey="engagement"
          fill="var(--color-chart-2)"
          radius={[4, 4, 0, 0]}
          style={{ cursor: "pointer" }}
          onClick={(_data: unknown, index: number) => {
            const videoId = data[index]?.id
            if (videoId) {
              const el = document.getElementById(`video-${videoId}`)
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" })
                el.classList.add("ring-2", "ring-primary", "rounded-lg")
                setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-lg"), 2000)
              }
            }
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
