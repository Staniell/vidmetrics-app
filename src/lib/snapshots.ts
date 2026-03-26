import { prisma } from "@/lib/prisma"
import type { VideoMetrics } from "@/types"

/**
 * Upserts channel + videos and inserts a fresh view snapshot for each video.
 * Called in the background on every video fetch — builds history passively.
 */
export async function captureSnapshots(
  channelId: string,
  videos: VideoMetrics[]
) {
  if (videos.length === 0) return

  // Upsert channel (minimal — we don't have full channel info here)
  await prisma.trackedChannel.upsert({
    where: { id: channelId },
    create: {
      id: channelId,
      title: "",
      handle: null,
    },
    update: {},
  })

  const now = new Date()

  for (const video of videos) {
    // Upsert the tracked video
    await prisma.trackedVideo.upsert({
      where: { id: video.id },
      create: {
        id: video.id,
        channelId,
        title: video.title,
        publishedAt: new Date(video.publishedAt),
      },
      update: {
        title: video.title,
      },
    })

    // Insert snapshot (viewCount + likeCount + commentCount at this moment)
    await prisma.viewSnapshot.create({
      data: {
        videoId: video.id,
        viewCount: BigInt(video.viewCount),
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        capturedAt: now,
      },
    })
  }
}

/**
 * Capture snapshots for a list of video IDs with pre-fetched stats.
 * Used by the cron job which fetches stats separately.
 */
export async function captureSnapshotsBatch(
  videoStats: { id: string; viewCount: number; likeCount: number; commentCount: number }[]
) {
  const now = new Date()

  await prisma.viewSnapshot.createMany({
    data: videoStats.map((v) => ({
      videoId: v.id,
      viewCount: BigInt(v.viewCount),
      likeCount: v.likeCount,
      commentCount: v.commentCount,
      capturedAt: now,
    })),
    skipDuplicates: true,
  })
}
