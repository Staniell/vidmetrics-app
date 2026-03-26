# Channel Comparison Feature — Design Spec

## Context

VidMetrics currently shows one channel at a time. Users want to compare two YouTube channels side-by-side to evaluate relative performance — subscriber counts, views, engagement, video output — within a shared time period. This feature adds an inline comparison panel to the existing channel detail page.

## Entry Point & URL

- A **"Compare" button** appears on the channel detail page next to the ChannelCard.
- Clicking it reveals a compact `ChannelInput` inline.
- Submitting a second channel updates the URL to `/channel/MrBeast?vs=PewDiePie`.
- The `vs` query param is read on mount, making comparisons shareable/bookmarkable.
- An "X" button dismisses the comparison (removes `?vs=` param and unmounts comparison section).
- The primary channel is always the `[handle]` path param; the comparison channel is the `vs` param.

## Layout

The comparison section inserts **between the primary ChannelCard and the existing charts/video grid**. The existing single-channel content (charts, FilterBar, VideoGrid) remains below, unchanged.

### Comparison Section Components

#### 1. Side-by-Side Stat Cards (`CompareStatCards`)

Two channel cards displayed left-right:
- **Left**: Primary channel
- **Right**: Comparison channel

Each shows: thumbnail, name, handle, subscribers, total views, video count, join date. The "winner" of each metric is highlighted (green/bold text). On mobile, cards stack vertically.

#### 2. Overlaid Charts (`CompareCharts`)

Two charts in a 2-column grid (stacked on mobile):

- **Views Over Time** (line/area chart): Two series (one per channel, different colors) sharing X-axis (publish date) and Y-axis (view count). Legend labels each channel by name.
- **Engagement Rate** (grouped bar chart): Grouped bars showing top videos by engagement from each channel. Two bars per position, color-coded by channel.

Both charts use Recharts, dynamically imported with `ssr: false`.

#### 3. Aggregate Comparison Row (`CompareAggregates`)

A compact row of head-to-head derived stats:
- Avg views per video (in selected period)
- Avg engagement rate
- Video type breakdown (% shorts vs videos vs lives)
- Total views in period

Each stat shows both values side-by-side with the higher value highlighted.

#### 4. Shared Filters

One `FilterBar` controls both channels. Period/sort changes trigger refetches for both channels simultaneously.

## Data Fetching & State

### Two `useChannel` Instances

```
primary    = useChannel(handle,   { sort, period, rangeStart, rangeEnd })
comparison = useChannel(vsHandle, { sort, period, rangeStart, rangeEnd })
```

- The page owns `sort`, `period`, and custom range state (lifted from the hook).
- Both hooks receive these as external parameters so they stay synchronized.
- The comparison hook only activates when `vs` query param is present.

### Hook Refactor

`useChannel` currently manages sort/period internally. It will accept optional external overrides:
- When external sort/period/range are provided, the hook uses those instead of its own state.
- The hook's `setSort`/`setPeriod`/`setCustomRange` still work — the page just passes its own setters to FilterBar.
- Internal state serves as fallback when no external overrides are provided (single-channel mode unchanged).

### Aggregate Stats

Computed client-side from the already-fetched `videos` and `rangeVideos` arrays:
- Avg views = sum of viewCount / video count
- Avg engagement = sum of engagementRate / video count
- Type breakdown = count each videoType / total count
- Total views in period = sum of rangeVideos[].viewsInRange

No new API routes needed.

### Loading & Error States

- Comparison section shows a skeleton while the second channel loads.
- If the second channel errors, an inline error with retry appears — does not affect the primary channel display.
- If the primary channel errors, the comparison section does not render.

## New Files

| File | Purpose |
|------|---------|
| `src/components/compare-section.tsx` | Orchestrator: mounts stat cards, charts, aggregates |
| `src/components/compare-stat-cards.tsx` | Side-by-side channel stat cards with winner highlighting |
| `src/components/compare-charts.tsx` | Overlaid line chart + grouped bar chart (dynamic import) |
| `src/components/compare-aggregates.tsx` | Head-to-head aggregate stats row |

## Modified Files

| File | Change |
|------|--------|
| `src/app/channel/[handle]/page.tsx` | Read `vs` query param, instantiate second `useChannel`, lift sort/period state, render CompareSection + Compare button/input |
| `src/hooks/use-channel.ts` | Accept optional external sort/period/range overrides |

## No Changes Needed

- API routes (all existing endpoints reused)
- FilterBar (already accepts callbacks, page passes shared state)
- ChannelCard, VideoCard, VideoGrid (untouched)
- NavBar, routing structure

## Verification

1. Visit `/channel/MrBeast` — page works as before (no regression)
2. Click "Compare" — input appears, enter a second channel
3. URL updates to `/channel/MrBeast?vs=PewDiePie`
4. Comparison section renders: stat cards, overlaid charts, aggregate row
5. Change period — both channels' data updates
6. Click "X" — comparison dismissed, URL reverts to `/channel/MrBeast`
7. Direct-navigate to `/channel/MrBeast?vs=PewDiePie` — comparison loads on mount
8. Mobile: all comparison components stack vertically
9. Error in comparison channel: inline error, primary channel unaffected
10. `npm run build` passes with no TypeScript errors
