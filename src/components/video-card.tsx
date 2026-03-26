import Image from "next/image"
import { Eye, ThumbsUp, MessageCircle, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatDate, formatDuration, formatEngagement, formatRelativeAge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface VideoCardProps {
  video: VideoMetrics
  rangeData?: VideoViewDelta
}

export function VideoCard({ video, rangeData }: VideoCardProps) {
  const engagementColor =
    video.engagementRate > 5
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : video.engagementRate > 2
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      : ""

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {video.thumbnailUrl && (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          )}
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
            {video.title}
          </h3>
          {rangeData ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Published {formatRelativeAge(video.publishedAt)} · {formatNumber(rangeData.viewsInRange)} views this period
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(video.publishedAt)}
            </p>
          )}

          {rangeData && (
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                +{formatNumber(rangeData.viewsInRange)} views
              </span>
              {rangeData.dataSource === "estimated" && (
                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">
                  Est.
                </Badge>
              )}
              {rangeData.dataSource === "velocity" && (
                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                  Live
                </Badge>
              )}
            </div>
          )}

          {rangeData && rangeData.dataSource !== "estimated" && rangeData.resurgenceMultiplier >= 5 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {Math.round(rangeData.resurgenceMultiplier)}x historical avg
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatNumber(video.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {formatNumber(video.likeCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {formatNumber(video.commentCount)}
            </span>
          </div>
          <div className="mt-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", engagementColor)}
            >
              {formatEngagement(video.engagementRate)} engagement
            </Badge>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
