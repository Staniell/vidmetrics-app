"use client"

import { useRef, useState, useEffect } from "react"
import { VideoCard } from "@/components/video-card"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface VideoGridProps {
  videos: VideoMetrics[]
  rangeVideos?: VideoViewDelta[]
  sortByRange?: boolean
  sortAsc?: boolean
}

function toVideoMetrics(rv: VideoViewDelta): VideoMetrics {
  return {
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
}

function useNewIds(ids: string[]): Set<string> {
  const prevRef = useRef<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const prev = prevRef.current
    if (prev.size === 0) {
      // First render — no animation
      prevRef.current = new Set(ids)
      return
    }

    const fresh = new Set(ids.filter((id) => !prev.has(id)))
    prevRef.current = new Set(ids)

    if (fresh.size > 0) {
      setNewIds(fresh)
      const timer = setTimeout(() => setNewIds(new Set()), 500)
      return () => clearTimeout(timer)
    }
  }, [ids])

  return newIds
}

export function VideoGrid({ videos, rangeVideos, sortByRange, sortAsc }: VideoGridProps) {
  if (sortByRange && rangeVideos && rangeVideos.length > 0) {
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    const ordered = sortAsc ? [...rangeVideos].reverse() : rangeVideos
    const ids = ordered.map((rv) => rv.videoId)
    const newIds = useNewIds(ids)

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ordered.map((rv, i) => (
          <div
            key={rv.videoId}
            style={newIds.has(rv.videoId) ? { animation: `card-in 0.4s ease-out ${Math.min(i * 30, 300)}ms both` } : undefined}
          >
            <VideoCard
              video={videoMap.get(rv.videoId) ?? toVideoMetrics(rv)}
              rangeData={rv}
            />
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No videos found for the selected time period.
      </div>
    )
  }

  const rangeMap = new Map(
    rangeVideos?.map((rv) => [rv.videoId, rv])
  )

  const ids = videos.map((v) => v.id)
  const newIds = useNewIds(ids)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video, i) => (
        <div
          key={video.id}
          style={newIds.has(video.id) ? { animation: `card-in 0.4s ease-out ${Math.min(i * 30, 300)}ms both` } : undefined}
        >
          <VideoCard
            video={video}
            rangeData={rangeMap.get(video.id)}
          />
        </div>
      ))}
    </div>
  )
}
