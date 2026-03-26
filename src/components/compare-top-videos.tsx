"use client"

import Image from "next/image"
import { Eye, ThumbsUp, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatDuration, formatRelativeAge, formatEngagement } from "@/lib/format"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface CompareTopVideosProps {
  primaryVideos: VideoMetrics[]
  comparisonVideos: VideoMetrics[]
  primaryRangeVideos: VideoViewDelta[]
  comparisonRangeVideos: VideoViewDelta[]
  primaryName: string
  comparisonName: string
  sort: string
}

function parseSortKey(sort: string): { field: string; asc: boolean } {
  if (sort.endsWith("_asc")) return { field: sort.slice(0, -4), asc: true }
  return { field: sort, asc: false }
}

function sortVideos(
  videos: VideoMetrics[],
  rangeVideos: VideoViewDelta[],
  sort: string
): VideoMetrics[] {
  const { field, asc } = parseSortKey(sort)

  if (field === "viewsInRange") {
    // rangeVideos comes pre-sorted desc from API; reverse for asc
    const ordered = asc ? [...rangeVideos].reverse() : rangeVideos
    return ordered.slice(0, 10).map((rv) => {
      const video = videos.find((v) => v.id === rv.videoId)
      return video ?? {
        id: rv.videoId,
        title: rv.title,
        thumbnailUrl: rv.thumbnailUrl,
        publishedAt: rv.publishedAt,
        viewCount: rv.totalViews,
        likeCount: rv.likeCount,
        commentCount: rv.commentCount,
        duration: rv.duration,
        engagementRate: rv.engagementRate,
        videoType: rv.videoType,
      }
    })
  }

  const dir = asc ? 1 : -1
  const sorted = [...videos]
  switch (field) {
    case "likes":
      sorted.sort((a, b) => dir * (a.likeCount - b.likeCount))
      break
    case "comments":
      sorted.sort((a, b) => dir * (a.commentCount - b.commentCount))
      break
    case "date":
      sorted.sort((a, b) => dir * (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()))
      break
    case "engagement":
      sorted.sort((a, b) => dir * (a.engagementRate - b.engagementRate))
      break
    case "views":
    default:
      sorted.sort((a, b) => dir * (a.viewCount - b.viewCount))
      break
  }

  return sorted.slice(0, 10)
}

function VideoRow({
  video,
  rank,
  rangeData,
  sort,
}: {
  video: VideoMetrics
  rank: number
  rangeData?: VideoViewDelta
  sort: string
}) {
  const { field } = parseSortKey(sort)

  const statValue = (() => {
    switch (field) {
      case "viewsInRange":
        return rangeData ? `+${formatNumber(rangeData.viewsInRange)}` : "-"
      case "likes":
        return formatNumber(video.likeCount)
      case "comments":
        return formatNumber(video.commentCount)
      case "engagement":
        return formatEngagement(video.engagementRate)
      case "date":
        return formatRelativeAge(video.publishedAt)
      case "views":
      default:
        return formatNumber(video.viewCount)
    }
  })()

  const statLabel = (() => {
    switch (field) {
      case "viewsInRange": return "in period"
      case "likes": return "likes"
      case "comments": return "comments"
      case "engagement": return "engagement"
      case "date": return ""
      default: return "views"
    }
  })()

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
    >
      <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
        {rank}
      </span>
      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        )}
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-px text-[9px] font-medium text-white">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight line-clamp-2">{video.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeAge(video.publishedAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold">{statValue}</p>
        {statLabel && (
          <p className="text-[10px] text-muted-foreground">{statLabel}</p>
        )}
      </div>
    </a>
  )
}

export function CompareTopVideos({
  primaryVideos,
  comparisonVideos,
  primaryRangeVideos,
  comparisonRangeVideos,
  primaryName,
  comparisonName,
  sort,
}: CompareTopVideosProps) {
  const primaryTop = sortVideos(primaryVideos, primaryRangeVideos, sort)
  const comparisonTop = sortVideos(comparisonVideos, comparisonRangeVideos, sort)

  const primaryRangeMap = new Map(primaryRangeVideos.map((rv) => [rv.videoId, rv]))
  const comparisonRangeMap = new Map(comparisonRangeVideos.map((rv) => [rv.videoId, rv]))

  if (primaryTop.length === 0 && comparisonTop.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium truncate" title={primaryName}>
            {primaryName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {primaryTop.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No videos</p>
          ) : (
            <div className="flex flex-col">
              {primaryTop.map((video, i) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  rank={i + 1}
                  rangeData={primaryRangeMap.get(video.id)}
                  sort={sort}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium truncate" title={comparisonName}>
            {comparisonName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {comparisonTop.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No videos</p>
          ) : (
            <div className="flex flex-col">
              {comparisonTop.map((video, i) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  rank={i + 1}
                  rangeData={comparisonRangeMap.get(video.id)}
                  sort={sort}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
