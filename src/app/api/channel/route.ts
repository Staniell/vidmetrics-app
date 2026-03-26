import { NextRequest, NextResponse } from "next/server"
import { resolveChannel, YouTubeError } from "@/lib/youtube"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle")

  if (!handle) {
    return NextResponse.json(
      { error: "Missing 'handle' query parameter", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  const parsed = parseChannelInput(handle)
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid channel input", code: "BAD_REQUEST" },
      { status: 400 }
    )
  }

  try {
    const channel = await resolveChannel(parsed.value, parsed.type)

    // Upsert channel info so we have title/handle for tracked channels
    prisma.trackedChannel.upsert({
      where: { id: channel.id },
      create: {
        id: channel.id,
        title: channel.title,
        handle: channel.handle || null,
      },
      update: {
        title: channel.title,
        handle: channel.handle || null,
      },
    }).catch(() => {})

    return NextResponse.json({ channel })
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
