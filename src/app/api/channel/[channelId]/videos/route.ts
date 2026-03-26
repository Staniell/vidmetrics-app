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

function parseSortParam(sort: string): { field: SortField; asc: boolean } {
  const asc = sort.endsWith("_asc")
  const field = (asc ? sort.slice(0, -4) : sort) as SortField
  return { field, asc }
}

function sortVideos(videos: VideoMetrics[], field: SortField, asc: boolean): VideoMetrics[] {
  const dir = asc ? 1 : -1
  return [...videos].sort((a, b) => {
    switch (field) {
      case "views":
        return dir * (a.viewCount - b.viewCount)
      case "likes":
        return dir * (a.likeCount - b.likeCount)
      case "comments":
        return dir * (a.commentCount - b.commentCount)
      case "date":
        return dir * (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
      case "engagement":
        return dir * (a.engagementRate - b.engagementRate)
      default:
        return 0
    }
  })
}

const VALID_SORT_FIELDS = new Set<string>(["views", "likes", "comments", "date", "engagement"])

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
  const { field: sortField, asc: sortAsc } = parseSortParam(sortParam)

  if (!VALID_SORT_FIELDS.has(sortField)) {
    return NextResponse.json(
      { error: "Invalid sort parameter", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

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
    const sorted = sortVideos(videos, sortField, sortAsc)

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
