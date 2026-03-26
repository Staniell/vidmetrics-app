import { NextRequest, NextResponse } from "next/server"
import {
  fetchVideoIds,
  fetchVideoDetails,
  computePublishedAfter,
  YouTubeError,
} from "@/lib/youtube"
import { captureSnapshots } from "@/lib/snapshots"
import type { VideoMetrics } from "@/types"

type SortField = "views" | "likes" | "comments" | "date" | "engagement"

function sortVideos(videos: VideoMetrics[], sort: SortField): VideoMetrics[] {
  return [...videos].sort((a, b) => {
    switch (sort) {
      case "views":
        return b.viewCount - a.viewCount
      case "likes":
        return b.likeCount - a.likeCount
      case "comments":
        return b.commentCount - a.commentCount
      case "date":
        return (
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
        )
      case "engagement":
        return b.engagementRate - a.engagementRate
      default:
        return 0
    }
  })
}

const VALID_SORTS = new Set<string>(["views", "likes", "comments", "date", "engagement"])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params

  // Validate channelId format to prevent quota abuse
  if (!/^UC[\w-]{22}$/.test(channelId)) {
    return NextResponse.json(
      { error: "Invalid channel ID", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const sortParam = searchParams.get("sort") || "date"

  if (!VALID_SORTS.has(sortParam)) {
    return NextResponse.json(
      { error: "Invalid sort parameter", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  const sort = sortParam as SortField
  const period = searchParams.get("period") || "30"
  const pageToken = searchParams.get("pageToken") || undefined

  const publishedAfter = computePublishedAfter(period)

  try {
    const { videoIds, nextPageToken, totalResults } = await fetchVideoIds(
      channelId,
      {
        publishedAfter,
        maxResults: 50,
        pageToken,
      }
    )

    const videos = await fetchVideoDetails(videoIds)
    const sorted = sortVideos(videos, sort)

    // Capture snapshots in the background (don't block response)
    captureSnapshots(channelId, videos).catch(() => {})

    return NextResponse.json({
      videos: sorted,
      totalResults,
      nextPageToken,
    })
  } catch (err) {
    if (err instanceof YouTubeError) {
      const status =
        err.code === "NOT_FOUND"
          ? 404
          : err.code === "QUOTA_EXCEEDED"
          ? 429
          : 500
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status }
      )
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "INTERNAL" },
      { status: 500 }
    )
  }
}
