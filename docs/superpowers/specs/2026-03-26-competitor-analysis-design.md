# VidMetrics Competitor Analysis Tool — Design Spec

## Context

A major media company client wants a quick way to analyze competitor YouTube channel performance without leaving the VidMetrics platform. The founder needs a polished, deployable tool by Monday (2026-03-30). This is a greenfield Next.js app that takes a YouTube channel URL and displays video performance data with charts and filtering.

## Stack

- **Framework:** Next.js 16.2.1 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Data source:** YouTube Data API v3 (user has API key)
- **Deployment:** Vercel (user handles deploy)
- **Design vibe:** Clean minimal SaaS (Linear/Notion feel)

## Architecture

Single Next.js application. API routes proxy all YouTube Data API calls to keep the API key server-side.

### Data Flow

```
User pastes channel URL → Client extracts handle/ID
  → GET /api/channel?handle=@ChannelName
  → API route calls YouTube API (channels.list + search.list + videos.list)
  → Returns structured JSON (channel info + video metrics)
  → Client renders dashboard
```

### API Routes

1. **`GET /api/channel?handle=@ChannelName`**
   - Resolves channel handle to ID via `channels.list(forHandle)`
   - Fetches channel statistics (subscribers, views, video count)
   - Returns `ChannelInfo` object

2. **`GET /api/channel/[channelId]/videos?sort=views&period=30&page=1`**
   - Calls `search.list` to get recent video IDs for the channel
   - Calls `videos.list` to get detailed stats for each video
   - Computes engagement rate per video
   - Returns paginated `VideoMetrics[]`

### YouTube API Calls

- `channels.list(forHandle)` — resolve handle to channel ID + stats
- `search.list(channelId, order=date, type=video)` — get video IDs
- `videos.list(id, part=statistics,snippet,contentDetails)` — get video details

## Data Model

```typescript
type ChannelInfo = {
  id: string
  title: string
  handle: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  viewCount: number
  videoCount: number
  publishedAt: string
}

type VideoMetrics = {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string            // ISO 8601 duration
  engagementRate: number      // (likes + comments) / views * 100
}
```

## UI Layout

Single-page app with 3 zones:

### 1. Landing State (no channel loaded)
- Minimal nav bar: "VidMetrics" logo text + "Competitor Analysis" label + dark mode toggle
- Hero section: large centered input accepting YouTube channel URLs
- Accepts: `youtube.com/@handle`, `youtube.com/channel/ID`, or plain `@handle`

### 2. Dashboard State (channel loaded)
- **Channel Card** — avatar, name, handle, subscriber count, total views, video count, join date
- **Charts Row** — two charts side by side:
  - Left: Views Over Time (area chart) — last 20 videos plotted chronologically
  - Right: Top 10 Engagement Rate (bar chart) — videos with highest engagement
- **Filter Bar** — sort dropdown, time period filter, text search
- **Video Grid** — responsive card grid with thumbnails, titles, metrics
- **Load More** — button for pagination

### 3. States
- **Empty/Landing** — just the hero input
- **Loading** — skeleton cards with shimmer animation
- **Results** — full dashboard
- **Error** — inline error with retry option

## Components

| Component | Description |
|-----------|-------------|
| `NavBar` | Logo, page label, dark mode toggle |
| `ChannelInput` | URL input with validation + submit |
| `ChannelCard` | Channel summary with avatar and stats |
| `ChartsRow` | Container for the two Recharts charts |
| `ViewsChart` | Area chart — views over time |
| `EngagementChart` | Bar chart — top 10 by engagement rate |
| `FilterBar` | Sort, period, and search controls |
| `VideoGrid` | Responsive grid layout for VideoCards |
| `VideoCard` | Thumbnail, title, date, views, likes, comments, engagement badge |
| `LoadingState` | Skeleton cards with shimmer |
| `ErrorState` | Error message with retry button |

## Filtering & Sorting

**Sort options:** Views (desc), Likes (desc), Comments (desc), Date (newest), Engagement Rate (desc)

**Time period filters:** Last 7 days, Last 30 days, Last 90 days, All time

**Text search:** Client-side filter on video titles (instant, no API call)

## Charts

1. **Views Over Time** (Area chart)
   - X axis: publish date
   - Y axis: view count
   - Data: last 20 videos, chronological order

2. **Engagement Rate** (Bar chart)
   - X axis: video title (truncated)
   - Y axis: engagement rate percentage
   - Data: top 10 videos by engagement rate

**Engagement rate formula:** `(likeCount + commentCount) / viewCount * 100`

## Responsive Design

| Breakpoint | Video Grid | Charts |
|-----------|-----------|--------|
| Mobile (<640px) | 1 column | Stacked vertically |
| Tablet (640-1024px) | 2 columns | Side by side |
| Desktop (>1024px) | 3-4 columns | Side by side |

## Error Handling

| Scenario | Message |
|----------|---------|
| Invalid URL | Inline validation: "Please enter a valid YouTube channel URL" |
| Channel not found | "We couldn't find that channel. Check the URL and try again." |
| API quota exceeded | "We've hit our rate limit. Please try again in a few minutes." |
| Network error | "Something went wrong. Please try again." |

## Environment Variables

```
YOUTUBE_API_KEY=<user's API key>
```

Single env var. Set in `.env.local` for development, Vercel environment settings for production.
