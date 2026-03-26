import { NextRequest, NextResponse } from "next/server"
import {
  fetchVideoIds,
  fetchVideoDetails,
  YouTubeError,
} from "@/lib/youtube"
import { captureSnapshots } from "@/lib/snapshots"
import { getViewsInRange } from "@/lib/view-deltas"
import { startOfMonth } from "date-fns"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params

  if (!/^UC[\w-]{22}$/.test(channelId)) {
    return NextResponse.json(
      { error: "Invalid channel ID", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")

  // Default: start of current month → today
  const rangeStart = startParam ? new Date(startParam) : startOfMonth(new Date())
  const rangeEnd = endParam ? new Date(endParam) : new Date()

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD.", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  try {
    // Fetch ALL videos for this channel (no period filter — we want all videos
    // regardless of publish date, since old videos can gain views in the range)
    const allVideoIds: string[] = []
    let pageToken: string | undefined

    do {
      const result = await fetchVideoIds(channelId, {
        maxResults: 50,
        pageToken,
      })
      allVideoIds.push(...result.videoIds)
      pageToken = result.nextPageToken
      // Cap at 200 videos to stay within quota
      if (allVideoIds.length >= 200) break
    } while (pageToken)

    const videos = await fetchVideoDetails(allVideoIds)

    // Capture fresh snapshots (builds tracking history)
    captureSnapshots(channelId, videos).catch(() => {})

    // Calculate views in the selected range
    const result = await getViewsInRange(channelId, rangeStart, rangeEnd, videos)

    return NextResponse.json({
      videos: result.videos,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      trackedSince: result.trackedSince,
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
