import { prisma } from "@/lib/prisma"
import { differenceInDays, differenceInMinutes } from "date-fns"
import type { VideoType } from "@/types"

type DataSource = "estimated" | "velocity" | "tracked"

export interface VideoViewDelta {
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
  dataSource: DataSource
  resurgenceMultiplier: number
  videoType: VideoType
}

/**
 * Three-tier view-in-range calculation:
 *
 * 1. Tracked  — 2 snapshots spanning ≥80% of the range → exact delta
 * 2. Velocity — 2 snapshots ≥5 min apart but gap < range → extrapolate real velocity
 * 3. Estimated — 0-1 snapshots → age-decay weighted average
 */
export async function getViewsInRange(
  channelId: string,
  rangeStart: Date,
  rangeEnd: Date,
  videos: {
    id: string
    title: string
    thumbnailUrl: string
    publishedAt: string
    duration: string
    viewCount: number
    likeCount: number
    commentCount: number
    engagementRate: number
    videoType: VideoType
  }[]
): Promise<{ videos: VideoViewDelta[]; trackedSince: string | null }> {
  const videoIds = videos.map((v) => v.id)
  const daysInRange = Math.max(1, differenceInDays(rangeEnd, rangeStart) + 1)
  const rangeMinutes = daysInRange * 24 * 60

  // Get the channel's tracking start date
  const channel = await prisma.trackedChannel.findUnique({
    where: { id: channelId },
    select: { firstTrackedAt: true },
  })
  const trackedSince = channel?.firstTrackedAt?.toISOString() ?? null

  // Fetch the earliest snapshot for each video (overall, not just in range)
  const earliestSnapshots = await prisma.viewSnapshot.findMany({
    where: { videoId: { in: videoIds } },
    orderBy: { capturedAt: "asc" },
    distinct: ["videoId"],
    select: { videoId: true, viewCount: true, capturedAt: true },
  })

  // Fetch the latest snapshot for each video
  const latestSnapshots = await prisma.viewSnapshot.findMany({
    where: { videoId: { in: videoIds } },
    orderBy: { capturedAt: "desc" },
    distinct: ["videoId"],
    select: { videoId: true, viewCount: true, capturedAt: true },
  })

  const earliestMap = new Map<string, { viewCount: number; capturedAt: Date }>(
    earliestSnapshots.map((s) => [s.videoId, { viewCount: Number(s.viewCount), capturedAt: s.capturedAt }])
  )
  const latestMap = new Map<string, { viewCount: number; capturedAt: Date }>(
    latestSnapshots.map((s) => [s.videoId, { viewCount: Number(s.viewCount), capturedAt: s.capturedAt }])
  )

  const results: VideoViewDelta[] = videos.map((video) => {
    const earliest = earliestMap.get(video.id)
    const latest = latestMap.get(video.id)

    let viewsInRange: number
    let dataSource: DataSource

    if (
      earliest &&
      latest &&
      earliest.capturedAt.getTime() !== latest.capturedAt.getTime()
    ) {
      const gapMinutes = differenceInMinutes(latest.capturedAt, earliest.capturedAt)
      const viewsGained = Math.max(0, latest.viewCount - earliest.viewCount)

      // Does the snapshot gap cover ≥80% of the requested range?
      if (gapMinutes >= rangeMinutes * 0.8) {
        // Tier 1: Tracked — exact delta
        viewsInRange = viewsGained
        dataSource = "tracked"
      } else if (gapMinutes >= 5) {
        // Tier 2: Velocity — extrapolate real rate to full range
        const velocityPerMinute = viewsGained / gapMinutes
        viewsInRange = Math.round(velocityPerMinute * rangeMinutes)
        dataSource = "velocity"
      } else {
        // Gap too small (< 5 min), fall through to estimation
        viewsInRange = estimateViews(video.viewCount, video.publishedAt, daysInRange)
        dataSource = "estimated"
      }
    } else {
      // Tier 3: Estimated — age-decay weighted average
      viewsInRange = estimateViews(video.viewCount, video.publishedAt, daysInRange)
      dataSource = "estimated"
    }

    // If the range encompasses the video's entire lifetime, views = total
    const videoPublished = new Date(video.publishedAt)
    if (rangeStart <= videoPublished) {
      viewsInRange = video.viewCount
      if (dataSource === "estimated") dataSource = "tracked"
    }

    // Cap: views in range can never exceed total lifetime views
    viewsInRange = Math.min(viewsInRange, video.viewCount)

    // Resurgence: current daily rate vs. historical lifetime average
    const daysSincePublished = Math.max(1, differenceInDays(new Date(), new Date(video.publishedAt)))
    const historicalDailyAvg = video.viewCount / daysSincePublished
    const currentDailyRate = viewsInRange / daysInRange
    const resurgenceMultiplier = historicalDailyAvg > 0
      ? currentDailyRate / historicalDailyAvg
      : 0

    return {
      videoId: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
      duration: video.duration,
      totalViews: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      engagementRate: video.engagementRate,
      viewsInRange,
      dataSource,
      resurgenceMultiplier,
      videoType: video.videoType,
    }
  })

  // Sort by viewsInRange descending
  results.sort((a, b) => b.viewsInRange - a.viewsInRange)

  return { videos: results, trackedSince }
}

/**
 * Age-decay weighted estimation.
 *
 * Videos < 30 days old: use full lifetime average (they're still in their peak).
 * Videos > 30 days old: current daily rate decays — older videos get fewer
 * views per day than their lifetime average suggests.
 * Floor at 5% of the lifetime average to avoid zeroing out evergreen content.
 */
function estimateViews(
  totalViews: number,
  publishedAt: string,
  daysInRange: number
): number {
  const daysSincePublished = Math.max(
    1,
    differenceInDays(new Date(), new Date(publishedAt))
  )
  const baseDaily = totalViews / daysSincePublished
  const ageFactor = Math.max(0.05, Math.min(1, 30 / daysSincePublished))
  const estimatedDaily = baseDaily * ageFactor
  return Math.round(estimatedDaily * daysInRange)
}
