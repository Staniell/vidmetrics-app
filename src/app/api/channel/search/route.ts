import { NextRequest, NextResponse } from "next/server"
import { searchChannels, YouTubeError } from "@/lib/youtube"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchChannels(q.trim(), 5)
    return NextResponse.json({ results })
  } catch (err) {
    if (err instanceof YouTubeError) {
      const status =
        err.code === "QUOTA_EXCEEDED" ? 429 : 500
      return NextResponse.json(
        { error: err.message, code: err.code, results: [] },
        { status }
      )
    }
    return NextResponse.json(
      { error: "Search failed", code: "INTERNAL", results: [] },
      { status: 500 }
    )
  }
}
