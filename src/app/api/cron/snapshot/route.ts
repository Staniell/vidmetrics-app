import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchVideoDetails } from "@/lib/youtube"
import { captureSnapshotsBatch } from "@/lib/snapshots"

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all tracked video IDs
    const trackedVideos = await prisma.trackedVideo.findMany({
      select: { id: true },
    })

    if (trackedVideos.length === 0) {
      return NextResponse.json({ message: "No tracked videos", snapshotCount: 0 })
    }

    const videoIds = trackedVideos.map((v) => v.id)

    // Fetch current stats from YouTube (batched in groups of 50)
    const videos = await fetchVideoDetails(videoIds)

    // Insert snapshots
    await captureSnapshotsBatch(
      videos.map((v: { id: string; viewCount: number; likeCount: number; commentCount: number }) => ({
        id: v.id,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
      }))
    )

    return NextResponse.json({
      message: "Snapshots captured",
      snapshotCount: videos.length,
    })
  } catch (err) {
    console.error("Cron snapshot error:", err)
    return NextResponse.json(
      { error: "Snapshot failed" },
      { status: 500 }
    )
  }
}
