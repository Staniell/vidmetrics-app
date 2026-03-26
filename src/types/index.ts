export type ChannelInfo = {
  id: string
  title: string
  handle: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  viewCount: number
  videoCount: number
  publishedAt: string
}

export type VideoType = "video" | "short" | "live"

export type VideoMetrics = {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  engagementRate: number
  videoType: VideoType
}

export type ChannelResponse = {
  channel: ChannelInfo
}

export type VideosResponse = {
  videos: VideoMetrics[]
  totalResults: number
  nextPageToken?: string
}

export type VideoViewDelta = {
  videoId: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  duration: string
  totalViews: number
  likeCount: number
  commentCount: number
  engagementRate: number
  viewsInRange: number
  dataSource: "estimated" | "velocity" | "tracked"
  resurgenceMultiplier: number
  videoType: VideoType
}

export type ViewsInRangeResponse = {
  videos: VideoViewDelta[]
  rangeStart: string
  rangeEnd: string
  trackedSince: string | null
}

export type ApiError = {
  error: string
  code: string
}
