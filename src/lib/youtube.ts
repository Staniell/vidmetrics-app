import type { ChannelInfo, VideoMetrics, VideoType } from "@/types"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set")
  }
  return key
}

async function youtubeGet<T>(
  endpoint: string,
  params: Record<string, string>,
  revalidate = 300
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`)
  url.searchParams.set("key", getApiKey())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), { next: { revalidate } })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const reason = body?.error?.errors?.[0]?.reason || "unknown"

    if (res.status === 404 || reason === "channelNotFound") {
      throw new YouTubeError(
        "Channel not found. Check the URL and try again.",
        "NOT_FOUND"
      )
    }
    if (res.status === 403 && reason === "quotaExceeded") {
      throw new YouTubeError(
        "YouTube API quota exceeded. Please try again later.",
        "QUOTA_EXCEEDED"
      )
    }
    throw new YouTubeError(
      `YouTube API error: ${reason}`,
      "API_ERROR"
    )
  }

  return res.json()
}

export class YouTubeError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseChannel(item: any): ChannelInfo {
  const snippet = item.snippet || {}
  const stats = item.statistics || {}
  return {
    id: item.id,
    title: snippet.title || "",
    handle: snippet.customUrl || "",
    description: snippet.description || "",
    thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
    subscriberCount: stats.hiddenSubscriberCount
      ? 0
      : parseInt(stats.subscriberCount || "0", 10),
    viewCount: parseInt(stats.viewCount || "0", 10),
    videoCount: parseInt(stats.videoCount || "0", 10),
    publishedAt: snippet.publishedAt || "",
  }
}

export async function resolveChannel(
  input: string,
  inputType: "handle" | "id"
): Promise<ChannelInfo> {
  const params: Record<string, string> = {
    part: "snippet,statistics",
  }

  if (inputType === "handle") {
    params.forHandle = input.replace(/^@/, "")
  } else {
    params.id = input
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data = await youtubeGet<any>("channels", params)

  // Fallback: if forHandle didn't match, try forUsername (legacy /user/ URLs)
  if (
    inputType === "handle" &&
    (!data.items || data.items.length === 0)
  ) {
    const fallbackParams: Record<string, string> = {
      part: "snippet,statistics",
      forUsername: input.replace(/^@/, ""),
    }
    data = await youtubeGet("channels", fallbackParams)
  }

  if (!data.items || data.items.length === 0) {
    throw new YouTubeError(
      "Channel not found. Check the URL and try again.",
      "NOT_FOUND"
    )
  }

  return parseChannel(data.items[0])
}

export async function fetchVideoIds(
  channelId: string,
  options: {
    publishedAfter?: string
    maxResults?: number
    pageToken?: string
  } = {}
): Promise<{
  videoIds: string[]
  nextPageToken?: string
  totalResults: number
}> {
  // Use the uploads playlist (UC→UU) via playlistItems.list (1 quota unit)
  // instead of search.list (100 quota units) for reliable pagination
  const uploadsPlaylistId = "UU" + channelId.slice(2)
  const maxResults = options.maxResults || 50

  const params: Record<string, string> = {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  }

  if (options.pageToken) {
    params.pageToken = options.pageToken
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await youtubeGet<any>("playlistItems", params)

  const cutoff = options.publishedAfter
    ? new Date(options.publishedAfter).getTime()
    : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items || []).filter((item: any) => {
    if (!cutoff) return true
    const published = new Date(item.snippet?.publishedAt || 0).getTime()
    return published >= cutoff
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoIds = items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean)

  // If we filtered out items due to the date cutoff, don't offer pagination
  // (remaining pages would be even older)
  const hasDateFilteredItems = items.length < (data.items || []).length
  const nextPageToken = hasDateFilteredItems ? undefined : data.nextPageToken

  return {
    videoIds,
    nextPageToken,
    totalResults: data.pageInfo?.totalResults || 0,
  }
}

function parseDurationSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)
  return hours * 3600 + minutes * 60 + seconds
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectVideoType(duration: string, liveStreamingDetails: any): VideoType {
  if (liveStreamingDetails?.actualStartTime) return "live"
  if (parseDurationSeconds(duration) <= 60) return "short"
  return "video"
}

export async function fetchVideoDetails(
  videoIds: string[]
): Promise<VideoMetrics[]> {
  if (videoIds.length === 0) return []

  // Batch in groups of 50 (YouTube API limit)
  const batches: string[][] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50))
  }

  const results: VideoMetrics[] = []

  for (const batch of batches) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await youtubeGet<any>("videos", {
      part: "snippet,statistics,contentDetails,liveStreamingDetails",
      id: batch.join(","),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of data.items || []) {
      const snippet = item.snippet || {}
      const stats = item.statistics || {}
      const views = parseInt(stats.viewCount || "0", 10)
      const likes = parseInt(stats.likeCount || "0", 10)
      const comments = parseInt(stats.commentCount || "0", 10)
      const duration = item.contentDetails?.duration || "PT0S"

      results.push({
        id: item.id,
        title: snippet.title || "",
        thumbnailUrl:
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        publishedAt: snippet.publishedAt || "",
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        duration,
        engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
        videoType: detectVideoType(duration, item.liveStreamingDetails),
      })
    }
  }

  return results
}

export type ChannelSearchResult = {
  id: string
  title: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
}

export async function searchChannels(
  query: string,
  maxResults = 5
): Promise<ChannelSearchResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchData = await youtubeGet<any>("search", {
    part: "snippet",
    q: query,
    type: "channel",
    maxResults: String(maxResults),
  })

  const items = searchData.items || []
  if (items.length === 0) return []

  // Fetch full channel details for subscriber counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelIds = items.map((item: any) => item.snippet?.channelId || item.id?.channelId).filter(Boolean)
  if (channelIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelsData = await youtubeGet<any>("channels", {
    part: "snippet,statistics",
    id: channelIds.join(","),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: ChannelSearchResult[] = (channelsData.items || []).map((item: any) => {
    const snippet = item.snippet || {}
    const stats = item.statistics || {}
    return {
      id: item.id,
      title: snippet.title || "",
      handle: snippet.customUrl || "",
      thumbnailUrl: snippet.thumbnails?.default?.url || "",
      subscriberCount: stats.hiddenSubscriberCount
        ? 0
        : parseInt(stats.subscriberCount || "0", 10),
    }
  })

  results.sort((a, b) => b.subscriberCount - a.subscriberCount)
  return results
}

/**
 * Batch-fetch channels by ID in a single API call (1 quota unit for up to 50).
 * Cached for 24 hours to avoid burning quota on the landing page carousel.
 */
export async function fetchChannelsBatch(
  channelIds: string[]
): Promise<ChannelInfo[]> {
  if (channelIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await youtubeGet<any>(
    "channels",
    {
      part: "snippet,statistics",
      id: channelIds.join(","),
    },
    86400 // 24-hour cache
  )

  return (data.items || []).map(parseChannel)
}

export function computePublishedAfter(period: string): string | undefined {
  if (period === "all") return undefined

  const days = parseInt(period, 10)
  if (isNaN(days)) return undefined

  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}
