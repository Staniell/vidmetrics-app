import { NextRequest, NextResponse } from "next/server"

/** Server-side image proxy to bypass CORS restrictions (used by PDF export). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }

    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
