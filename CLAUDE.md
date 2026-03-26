# VidMetrics — YouTube Competitor Analysis

## Quick Reference

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (TypeScript check + bundle)
npm run lint         # ESLint
npx prisma db push   # Push schema changes to Neon database
npx prisma generate  # Regenerate Prisma client after schema changes
```

## Stack

- **Next.js 16.2.1** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** with `@theme inline` and `@custom-variant dark`
- **shadcn/ui** (manually installed — registry was down; components in `src/components/ui/`)
- **Recharts 3.x** for charts (dynamically imported with `ssr: false`)
- **Prisma 7** ORM with **Neon PostgreSQL** (serverless adapter via `@prisma/adapter-neon`)
- **next-themes** for dark mode
- **date-fns** for date formatting
- **react-day-picker** + **@radix-ui/react-popover** for custom date range picker

## Architecture

Multi-page app with a snapshot-based view tracking system. API routes proxy YouTube Data API v3 (API key stays server-side) and store view snapshots in Neon PostgreSQL to calculate views gained in a date range.

```
src/
  app/
    api/carousel/                         # GET → 24 trending creators for homepage carousel (cached 24h)
    api/channel/                          # GET /api/channel?handle=@Name → ChannelInfo
    api/channel/search/                   # GET ?q= → up to 5 channel search results (autocomplete)
    api/channel/[channelId]/videos/       # GET → paginated VideoMetrics[]
    api/channel/[channelId]/views-in-range/ # GET ?start=&end= → VideoViewDelta[] sorted by views in range
    api/cron/snapshot/                    # GET → daily cron to snapshot all tracked videos
    page.tsx                              # Home page (channel search + hero carousel)
    layout.tsx                            # Root layout with ThemeProvider + NavBar
    error.tsx                             # Global error boundary
    loading.tsx                           # Root loading skeleton
    icon.tsx                              # Dynamic SVG favicon
    apple-icon.tsx                        # Dynamic Apple touch icon
    globals.css                           # CSS variables (OKLCh), theme tokens, global styles
    channel/[handle]/
      page.tsx                            # Channel detail page (videos, charts, filters)
      loading.tsx                         # Channel detail loading skeleton
    how-it-works/
      page.tsx                            # Educational page explaining VidMetrics methodology
  components/
    ui/                       # shadcn/ui primitives (badge, button, calendar, card, dropdown-menu, input, popover, select, skeleton, tooltip)
    charts/                   # Recharts components (views-chart, engagement-chart)
    channel-input.tsx         # URL input with autocomplete dropdown + hero/compact modes
    channel-card.tsx          # Channel overview card
    date-range-picker.tsx     # Custom date range popover (wraps react-day-picker calendar)
    video-card.tsx            # Individual video card (shows range views, data source badge, video type badge)
    video-grid.tsx            # Responsive grid of VideoCards
    filter-bar.tsx            # Sort/period/search/video-type controls + custom date range picker
    charts-row.tsx            # Dynamic import wrapper for both charts
    hero-carousel.tsx         # Infinite marquee carousel of trending creators (homepage)
    trending-carousel.tsx     # Horizontal scrollable top-10 videos carousel with drag/swipe
    error-state.tsx           # Error message with retry button
    loading-state.tsx         # Full-page skeleton loader
    nav-bar.tsx               # Sticky header with logo, channel search, "How It Works" link, dark mode toggle
    mode-toggle.tsx           # Dark/light/system theme switcher (uses next-themes)
    theme-provider.tsx        # next-themes ThemeProvider wrapper
  generated/
    prisma/                   # Auto-generated Prisma client (do not edit, gitignored)
  hooks/
    use-channel.ts            # Main data hook (fetch, sort, period, range, auto-refresh timer)
  lib/
    youtube.ts                # YouTube Data API v3 client (server-only)
    prisma.ts                 # Prisma client singleton (Neon serverless adapter)
    snapshots.ts              # Captures view snapshots to DB (on visit + cron)
    view-deltas.ts            # Three-tier view-in-range calculation (estimated/velocity/tracked)
    parse-channel-input.ts    # URL/handle parser
    format.ts                 # Number, date, duration formatters
    utils.ts                  # cn() — Tailwind class merging (clsx + tailwind-merge)
  types/
    index.ts                  # ChannelInfo, VideoMetrics, VideoViewDelta, VideoType, API response types
prisma/
  schema.prisma               # TrackedChannel, TrackedVideo, ViewSnapshot models
prisma.config.ts              # Prisma config (loads env from .env.local)
vercel.json                   # Vercel cron: daily snapshot at midnight UTC
components.json               # shadcn/ui config (new-york style, Tailwind v4, lucide icons)
```

## View Tracking System

YouTube Data API v3 only returns cumulative lifetime `viewCount` — there's no API to get "views gained this month." VidMetrics solves this with a **snapshot-based tracking system**:

### Three-Tier Data Sources

| Tier | Badge | Condition | Method |
|------|-------|-----------|--------|
| **Estimated** | "Est." | First visit, 1 snapshot | Age-decay weighted average (`totalViews / daysOld × ageFactor`) |
| **Velocity** | (none) | 2 snapshots ≥5 min apart, gap < range | Real views/min extrapolated to full range |
| **Tracked** | (none) | 2 snapshots spanning ≥80% of range | Exact delta: `end - start` |

### How Snapshots Accumulate

1. **On every channel visit**: The `/views-in-range` and `/videos` API routes capture a fresh `ViewSnapshot` for each video.
2. **10-min auto-refresh**: After initial channel load, the frontend silently re-fetches views-in-range after 10 minutes, creating a second snapshot → upgrades from "estimated" to "velocity."
3. **Daily cron**: `GET /api/cron/snapshot` (Vercel cron, midnight UTC) snapshots all tracked channels' videos in the background.

### Database Schema (Prisma)

- **TrackedChannel** — `id` (YouTube channel ID), `title`, `handle`, `firstTrackedAt`
- **TrackedVideo** — `id` (YouTube video ID), `channelId`, `title`, `publishedAt`
- **ViewSnapshot** — `videoId`, `viewCount` (BigInt), `likeCount`, `commentCount`, `capturedAt` (unique per videoId+capturedAt)

## Key Patterns

- **API key stays server-side**: `YOUTUBE_API_KEY` in `.env.local`, accessed only in `src/lib/youtube.ts` via `process.env`. Never prefixed with `NEXT_PUBLIC_`.
- **Single env file**: All env vars in `.env.local` only. `prisma.config.ts` explicitly loads from `.env.local` via `dotenv.config({ path: ".env.local" })`.
- **Dynamic params are Promises in Next.js 16**: Always `const { id } = await params` in route handlers.
- **Prisma 7 requires an adapter**: `PrismaClient` is initialized with `new PrismaClient({ adapter: new PrismaNeon(...) })` — passing `{}` or no args will not compile.
- **Prisma client generated to `src/generated/prisma/`**: Import from `@/generated/prisma/client`, not `@prisma/client`. This directory is gitignored; run `npx prisma generate` after cloning.
- **Charts use `next/dynamic` with `ssr: false`**: Recharts needs the DOM. See `charts-row.tsx`.
- **shadcn/ui was set up manually**: No `npx shadcn add` available (registry was down). To add new components, create them manually in `src/components/ui/` following the existing pattern.
- **CSS variables use OKLCh color space**: Defined in `globals.css` under `:root` and `.dark`.
- **`useChannel` hook uses refs for stable identity**: `fetchChannel` doesn't depend on `sort`/`period`/`range` state — it reads from refs to avoid unnecessary re-renders of `ChannelInput`.
- **Videos route validates channelId**: Regex check `UC` + 22 chars before calling YouTube API.
- **Snapshots fire-and-forget**: `captureSnapshots()` is called with `.catch(() => {})` so DB errors never block the API response.
- **Cron route is auth-protected**: Checks `Authorization: Bearer <CRON_SECRET>`. Vercel auto-sends this for configured crons.

## Environment

All env vars in `.env.local` (single file):

```
YOUTUBE_API_KEY=<key>        # Required. YouTube Data API v3 key.
DATABASE_URL=<neon-url>      # Required. Neon PostgreSQL connection string.
CRON_SECRET=<secret>         # Required in production. Protects /api/cron/snapshot.
```

For Vercel deployment, set these same vars in Vercel project settings (Settings → Environment Variables).

## YouTube API Quota

Free tier: 10,000 units/day. Each channel lookup costs ~3 units (`playlistItems.list` = 1, `channels.list` = 1, `videos.list` = 1). That's roughly 3,300 lookups per day. The `videos.list` call includes `part=snippet,statistics,contentDetails,liveStreamingDetails` for video type detection. The daily cron snapshot uses ~1 unit per 50 tracked videos (only `videos.list` with `part=statistics`).
