import { VideoCard } from "@/components/video-card"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface VideoGridProps {
  videos: VideoMetrics[]
  rangeVideos?: VideoViewDelta[]
  sortByRange?: boolean
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

export function VideoGrid({ videos, rangeVideos, sortByRange }: VideoGridProps) {
  if (sortByRange && rangeVideos && rangeVideos.length > 0) {
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rangeVideos.map((rv) => (
          <VideoCard
            key={rv.videoId}
            video={videoMap.get(rv.videoId) ?? toVideoMetrics(rv)}
            rangeData={rv}
          />
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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          rangeData={rangeMap.get(video.id)}
        />
      ))}
    </div>
  )
}
