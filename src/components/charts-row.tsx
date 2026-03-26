"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { VideoMetrics } from "@/types"

const ViewsChart = dynamic(
  () =>
    import("@/components/charts/views-chart").then((mod) => mod.ViewsChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] w-full" />,
  }
)

const EngagementChart = dynamic(
  () =>
    import("@/components/charts/engagement-chart").then(
      (mod) => mod.EngagementChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] w-full" />,
  }
)

interface ChartsRowProps {
  videos: VideoMetrics[]
}

export function ChartsRow({ videos }: ChartsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Views Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ViewsChart videos={videos} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Top Engagement Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EngagementChart videos={videos} />
        </CardContent>
      </Card>
    </div>
  )
}
