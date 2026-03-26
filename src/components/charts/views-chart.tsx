"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatNumber, formatDateShort } from "@/lib/format"
import type { VideoMetrics } from "@/types"

interface ViewsChartProps {
  videos: VideoMetrics[]
}

export function ViewsChart({ videos }: ViewsChartProps) {
  const data = [...videos]
    .sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    )
    .slice(-20)
    .map((v) => ({
      date: formatDateShort(v.publishedAt),
      views: v.viewCount,
      title: v.title,
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
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-chart-1)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-chart-1)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          vertical={false}
        />
        <XAxis
          dataKey="date"
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
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "var(--color-foreground)" }}
          formatter={(value) => [formatNumber(Number(value)), "Views"]}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--color-chart-1)"
          fill="url(#viewsGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
