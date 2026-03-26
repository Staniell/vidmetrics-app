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

// AI types

export type CondensedVideoSummary = {
  title: string
  views: number
  viewsInRange: number
  engagementRate: number
  videoType: VideoType
  publishedAt: string
  resurgenceMultiplier: number
  dataSource: "estimated" | "velocity" | "tracked"
}

export type CondensedChannelContext = {
  channelId: string
  title: string
  handle: string
  description: string
  subscriberCount: number
  viewCount: number
  videoCount: number
  publishedAt: string
  contentMix: { video: number; short: number; live: number }
  avgViewsPerVideo: number
  avgEngagementRate: number
  totalViewsInRange: number
  topByViews: CondensedVideoSummary[]
  topByEngagement: CondensedVideoSummary[]
  trending: CondensedVideoSummary[]
}

export type AiRecommendation = {
  category: "titles" | "upload-schedule" | "content-mix" | "engagement" | "growth" | "competitive"
  title: string
  description: string
  priority: "high" | "medium" | "low"
}

export type AiInsights = {
  healthScore: number
  healthSummary: string
  growthAnalysis: string
  contentStrategy: string
  recommendations: AiRecommendation[]
}

export type AiHeadToHead = {
  metric: string
  channel1Value: string
  channel2Value: string
  winner: string
}

export type AiComparisonInsights = AiInsights & {
  winner: string
  headToHead: AiHeadToHead[]
  channel1Advantages: string[]
  channel2Advantages: string[]
  comparisonSummary: string
}
