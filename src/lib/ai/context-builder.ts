import type {
  ChannelInfo,
  VideoMetrics,
  VideoViewDelta,
  CondensedChannelContext,
  CondensedVideoSummary,
} from "@/types"

function toVideoSummary(v: VideoViewDelta): CondensedVideoSummary {
  return {
    title: v.title,
    views: v.totalViews,
    viewsInRange: v.viewsInRange,
    engagementRate: v.engagementRate,
    videoType: v.videoType,
    publishedAt: v.publishedAt,
    resurgenceMultiplier: v.resurgenceMultiplier,
    dataSource: v.dataSource,
  }
}

export function buildChannelContext(
  channel: ChannelInfo,
  videos: VideoMetrics[],
  rangeVideos: VideoViewDelta[]
): CondensedChannelContext {
  const videoCount = videos.length || channel.videoCount
  const shorts = videos.filter((v) => v.videoType === "short").length
  const lives = videos.filter((v) => v.videoType === "live").length
  const regularVideos = videos.filter((v) => v.videoType === "video").length

  const total = shorts + lives + regularVideos || 1
  const contentMix = {
    video: Math.round((regularVideos / total) * 100),
    short: Math.round((shorts / total) * 100),
    live: Math.round((lives / total) * 100),
  }

  const avgViews = videos.length
    ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length)
    : 0

  const avgEngagement = videos.length
    ? Number((videos.reduce((s, v) => s + v.engagementRate, 0) / videos.length).toFixed(2))
    : 0

  const totalViewsInRange = rangeVideos.reduce((s, v) => s + v.viewsInRange, 0)

  const sorted = [...rangeVideos]
  const topByViews = sorted
    .sort((a, b) => b.viewsInRange - a.viewsInRange)
    .slice(0, 20)
    .map(toVideoSummary)

  const topByEngagement = [...rangeVideos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map(toVideoSummary)

  const trending = rangeVideos
    .filter((v) => v.resurgenceMultiplier > 1.5)
    .sort((a, b) => b.resurgenceMultiplier - a.resurgenceMultiplier)
    .slice(0, 10)
    .map(toVideoSummary)

  return {
    channelId: channel.id,
    title: channel.title,
    handle: channel.handle,
    description: channel.description,
    subscriberCount: channel.subscriberCount,
    viewCount: channel.viewCount,
    videoCount,
    publishedAt: channel.publishedAt,
    contentMix,
    avgViewsPerVideo: avgViews,
    avgEngagementRate: avgEngagement,
    totalViewsInRange,
    topByViews,
    topByEngagement,
    trending,
  }
}
