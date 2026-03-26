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
- **sonner** for toast notifications
- **html2canvas** + **jspdf** for PDF export
- **Gemini 2.0 Flash** via `@ai-sdk/google` + `ai` SDK for AI insights and chat
- **@radix-ui/react-dialog** for modal dialogs (shared by Sheet + Dialog components)

## Architecture

Multi-page app with a snapshot-based view tracking system. API routes proxy YouTube Data API v3 (API key stays server-side) and store view snapshots in Neon PostgreSQL to calculate views gained in a date range.

```
src/
  app/
    api/carousel/                         # GET → 24 trending creators for homepage carousel (cached 24h)
    api/channel/                          # GET /api/channel?handle=@Name → ChannelInfo
    api/channel/search/                   # GET ?q= → up to 5 channel search results (autocomplete)
    api/channel/[channelId]/videos/       # GET → paginated VideoMetrics[] (supports _asc suffix for ascending sort)
    api/channel/[channelId]/views-in-range/ # GET ?start=&end= → VideoViewDelta[] sorted by views in range (fetched on demand)
    api/ai/insights/                      # POST → Gemini-powered channel insights (cached 6h, rate-limited)
    api/ai/chat/                          # POST → Gemini-powered streaming chat about channel data
    api/cron/snapshot/                    # GET → daily cron to snapshot all tracked videos
    page.tsx                              # Home page (channel search + hero carousel)
    layout.tsx                            # Root layout with ThemeProvider + NavBar + Toaster
    error.tsx                             # Global error boundary
    loading.tsx                           # Root loading skeleton
    icon.tsx                              # Dynamic SVG favicon
    apple-icon.tsx                        # Dynamic Apple touch icon
    globals.css                           # CSS variables (OKLCh), theme tokens, global styles, card-in animation
    channel/[handle]/
      page.tsx                            # Channel detail page (videos, charts, filters, comparison, PDF export)
      loading.tsx                         # Channel detail loading skeleton
    how-it-works/
      page.tsx                            # Educational page explaining VidMetrics methodology
  components/
    ui/                       # shadcn/ui primitives (badge, button, calendar, card, dialog, dropdown-menu, input, popover, scroll-area, select, sheet, skeleton, tooltip)
    ai/                       # AI-powered components
      ai-insights-button.tsx  # Floating bottom-right button to open AI modal
      ai-insights-modal.tsx   # Tabbed modal (Insights + Chat tabs)
      ai-insights-content.tsx # Insights display: health score, H2H, recommendations
      ai-chat-content.tsx     # Chat interface with streaming responses
      ai-chat-input.tsx       # Chat input form
      ai-chat-message.tsx     # Individual chat message bubble
    charts/                   # Recharts components (views-chart, engagement-chart)
    channel-input.tsx         # URL input with autocomplete dropdown + recent searches (localStorage) + hero/compact modes
    channel-card.tsx          # Channel overview card
    date-range-picker.tsx     # Custom date range popover (wraps react-day-picker calendar)
    video-card.tsx            # Individual video card (shows range views, data source badge, video type badge)
    video-grid.tsx            # Responsive grid of VideoCards with entrance animations for new cards
    compare-stat-cards.tsx    # Side-by-side channel stats with winner highlighting (comparison mode)
    compare-charts.tsx        # Overlaid views + engagement charts for two channels (dynamic import)
    compare-aggregates.tsx    # Head-to-head aggregate stats row (avg views, engagement, content mix)
    compare-top-videos.tsx    # Ranked top-10 video lists for both channels
    pdf-export-layout.tsx     # Off-screen PDF export container (uses forwardRef + portal)
    pdf-channel-header.tsx    # Channel header section for PDF
    pdf-charts-section.tsx    # Charts section for PDF
    pdf-video-table.tsx       # Video metrics table for PDF
    pdf-compare-section.tsx   # Comparison data section for PDF
    filter-bar.tsx            # Sort/period/search/video-type controls + sort direction toggle + custom date range picker
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
    use-channel.ts            # Main data hook (progressive loading, on-demand range fetch, sort with _asc direction, client-side re-sort on pagination)
    use-ai-insights.ts        # On-demand AI insights fetch hook (deduplicates, exposes fetch/refresh)
  lib/
    youtube.ts                # YouTube Data API v3 client (server-only)
    prisma.ts                 # Prisma client singleton (Neon serverless adapter)
    snapshots.ts              # Captures view snapshots to DB (on visit + cron)
    view-deltas.ts            # Three-tier view-in-range calculation (estimated/velocity/tracked)
    parse-channel-input.ts    # URL/handle parser
    format.ts                 # Number, date, duration formatters
    utils.ts                  # cn() + winnerClass() — Tailwind class merging + comparison highlighting
    pdf-export.ts             # captureAndDownloadPdf(), buildExportFilename() — html2canvas + jspdf
    pdf-theme.ts              # PDF_THEME_VARS, chart colors, hex constants for html2canvas
    ai/
      context-builder.ts      # buildChannelContext() — condenses channel data for AI prompts
      gemini.ts               # Gemini 2.0 Flash model instance (via @ai-sdk/google)
      prompts.ts              # System prompts for insights, comparison, and chat
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

1. **On every channel visit**: The `/videos` API route captures a fresh `ViewSnapshot` for each video. The `/views-in-range` route also captures snapshots but is only called on demand.
2. **10-min auto-refresh**: After the first views-in-range fetch (triggered by "Views This Period" sort), the frontend silently re-fetches after 10 minutes, creating a second snapshot → upgrades from "estimated" to "velocity."
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
- **`useChannel` hook uses refs for stable identity**: `fetchChannel` doesn't depend on `sort`/`period`/`range` state — it reads from refs to avoid unnecessary re-renders of `ChannelInput`. Accepts optional `UseChannelOptions` for external sort/period/range overrides (comparison mode).
- **Progressive loading**: `fetchChannel` returns immediately after the channel metadata API call, then fires the videos fetch independently. The channel card renders before videos arrive. Three granular loading states: `isLoading` (channel metadata), `isVideosLoading` (videos), `isRangeLoading` (views-in-range).
- **On-demand range data**: The heavy `/views-in-range` endpoint (paginates all videos + 3 DB queries) is NOT called on initial load. It only fires when the user selects "Views This Period" sort (`viewsInRange` or `viewsInRange_asc`). This saves YouTube API quota and dramatically speeds up initial page load.
- **Sort direction via `_asc` suffix**: Sort values like `views`, `likes`, `date` default to descending. Appending `_asc` (e.g., `views_asc`, `date_asc`) reverses direction. The `FilterBar` has a toggle button (arrow icon) next to the sort dropdown. The `_asc` convention is used end-to-end: API route, hook, comparison components, PDF export.
- **Client-side re-sort on pagination**: `fetchMoreVideos` merges new page results with existing videos, then re-sorts the full list via `sortClientSide()` to maintain correct order across page boundaries.
- **Video card entrance animations**: `VideoGrid` uses a `useNewIds` hook to track which cards are new after each render. New cards get a staggered `card-in` CSS animation (fade + slide up). Animation auto-clears after 500ms.
- **Channel comparison via `?vs=` query param**: `/channel/MrBeast?vs=PewDiePie` renders two `useChannel` instances with shared filter state. `CompareStatCards` replaces the single `ChannelCard` when comparing. URL is shareable/bookmarkable.
- **Sticky toolbar**: Filters + action buttons (Export, Compare/Remove) in a single sticky row below the nav bar, above channel cards.
- **PDF export uses html2canvas + jspdf**: Renders a hidden `PdfExportLayout` via React portal, captures to canvas, converts to PDF. Uses hardcoded hex colors in `pdf-theme.ts` because html2canvas doesn't resolve CSS variables.
- **Toast notifications via sonner**: `<Toaster>` in root layout, `toast.error()` replaces inline error text in `ChannelInput`.
- **Videos route validates channelId**: Regex check `UC` + 22 chars before calling YouTube API.
- **Snapshots fire-and-forget**: `captureSnapshots()` is called with `.catch(() => {})` so DB errors never block the API response.
- **Cron route is auth-protected**: Checks `Authorization: Bearer <CRON_SECRET>`. Vercel auto-sends this for configured crons.
- **AI insights load on demand**: The `useAiInsights` hook does NOT auto-fetch. The floating button click triggers `fetch()`, which opens the modal and initiates the API call. Deduplication prevents redundant requests for the same channel/period combo. Note: AI insights require `rangeVideos` data, so the AI button only becomes visible after the user has triggered a "Views This Period" sort at least once.
- **AI modal keeps both tabs mounted**: Insights and Chat tabs use `hidden` class toggle (not conditional rendering) so chat message history persists when switching between tabs.
- **AI insights are cached 6 hours**: The `/api/ai/insights` route caches Gemini responses in the `AiInsightCache` Prisma model. Rate-limited to 20 insights + 50 chat requests per IP per 24h.
- **AI comparison mode**: When `?vs=` param is present, AI generates `AiComparisonInsights` (winner, head-to-head, per-channel advantages) instead of solo `AiInsights`. Chat starter questions also change.
- **Recent searches cached in localStorage**: `channel-input.tsx` stores the last 10 selected search results under `vidmetrics-recent-searches`. Shown in a scrollable dropdown on input focus when the input is empty. Shared across hero and navbar inputs.

## Environment

All env vars in `.env.local` (single file):

```
YOUTUBE_API_KEY=<key>                  # Required. YouTube Data API v3 key.
DATABASE_URL=<neon-url>                # Required. Neon PostgreSQL connection string.
CRON_SECRET=<secret>                   # Required in production. Protects /api/cron/snapshot.
GOOGLE_GENERATIVE_AI_API_KEY=<key>     # Required. Gemini API key for AI insights/chat.
```

For Vercel deployment, set these same vars in Vercel project settings (Settings → Environment Variables).

## YouTube API Quota

Free tier: 10,000 units/day. Each channel lookup costs ~3 units (`playlistItems.list` = 1, `channels.list` = 1, `videos.list` = 1). That's roughly 3,300 lookups per day. The `videos.list` call includes `part=snippet,statistics,contentDetails,liveStreamingDetails` for video type detection. The daily cron snapshot uses ~1 unit per 50 tracked videos (only `videos.list` with `part=statistics`).
