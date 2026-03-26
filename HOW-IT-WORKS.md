# How VidMetrics Works

A complete guide to every metric, calculation, badge, and feature in VidMetrics.

---

## Table of Contents

1. [The Core Problem](#the-core-problem)
2. [Views Per Period — The Three-Tier System](#views-per-period--the-three-tier-system)
3. [Badges & Indicators](#badges--indicators)
4. [Engagement Rate](#engagement-rate)
5. [Trending Carousel](#trending-carousel)
6. [Sorting & Filtering](#sorting--filtering)
7. [Charts](#charts)
8. [Channel Card](#channel-card)
9. [Input Formats](#input-formats)
10. [Data Flow](#data-flow)
11. [YouTube API Quota](#youtube-api-quota)

---

## The Core Problem

YouTube's API only returns **lifetime total views** per video. There is no API to ask _"How many views did this video get this week?"_

VidMetrics solves this with a **snapshot-based tracking system** that records view counts over time and calculates the difference.

```
YouTube API gives us:        What we actually want:

  Video A: 10,000,000 views    Video A: +45,000 views this month
  Video B:    500,000 views    Video B: +120,000 views this month
                                         ^^^^^^^^
                                   Video B is actually winning
                                   this month despite fewer
                                   total views
```

---

## Views Per Period — The Three-Tier System

Every time you visit a channel, VidMetrics captures a **ViewSnapshot** — a timestamped record of each video's current view count stored in the database.

Over time, these snapshots accumulate, and VidMetrics picks the best available method to calculate views gained in your selected period:

```
                          How accurate?
Tier         Badge        =============>

Estimated    Est.         [====                ]  Rough guess
Velocity     Live         [=============       ]  Real rate, projected
Tracked      (none)       [====================]  Exact count
```

### Tier 1: Estimated (Badge: `Est.`)

**When:** First time visiting a channel (only 1 snapshot exists).

**How it works:**

```
                  totalViews
  baseDaily  =  ────────────────
                daysSincePublished

                     30
  ageFactor  =  min(1, ─────────────────── )    floor at 0.05
                       daysSincePublished

  estimatedDaily  =  baseDaily  x  ageFactor

  viewsInRange  =  estimatedDaily  x  daysInRange
```

**Why the age decay?** New videos get most of their views early. A 5-year-old video averaging 1,000 views/day over its lifetime is probably getting far fewer than that _today_. The age factor scales down older videos while keeping new videos (< 30 days) at their full average. The floor at 5% ensures evergreen content isn't zeroed out.

```
  Age Factor vs. Video Age

  1.0 |████████████
      |            ████
      |                ████
  0.5 |                    ████
      |                        ████
      |                            ████
  0.05|                                ████████████████
      └─────────────────────────────────────────────────
       0d    30d    90d    180d    1yr    2yr    5yr
                       Video Age
```

**Accuracy:** Low — it's a weighted guess. Upgrades to Velocity after ~10 minutes.

---

### Tier 2: Velocity (Badge: `Live`)

**When:** 2 snapshots captured at least 5 minutes apart, but the gap is less than 80% of the selected period.

**How it works:**

```
  Snapshot 1 (10:00 AM)     Snapshot 2 (10:15 AM)
  viewCount: 500,000        viewCount: 500,150
       │                         │
       └──── 150 views in 15 min ┘

  velocity  =  150 views / 15 min  =  10 views/min

  If period = "Last 30 days" (43,200 min):
  viewsInRange  =  10 views/min  x  43,200 min  =  432,000
```

**How you get a second snapshot:** VidMetrics silently re-fetches data 10 minutes after your first visit. You don't need to do anything — just leave the page open.

```
  Timeline:

  ┌─ You visit channel ──────── 10 min ──────── Auto-refresh ─┐
  │                                                            │
  │  Snapshot 1 captured        Snapshot 2 captured            │
  │  Badge: Est.                Badge: Live                    │
  │  (estimated guess)          (real measured velocity)       │
  └────────────────────────────────────────────────────────────┘
```

**Accuracy:** Good — based on real measured view velocity. Best for detecting current trends.

---

### Tier 3: Tracked (No Badge)

**When:** 2 snapshots that span at least 80% of the selected period.

**How it works:**

```
  Period: "Last 30 days"

  Snapshot from 28 days ago     Snapshot from today
  viewCount: 1,200,000         viewCount: 1,650,000
       │                            │
       └── exact delta: 450,000 ────┘

  28 days / 30 days = 93%  (>= 80% threshold)

  viewsInRange = 450,000  (exact)
```

**How you get here:** The daily cron job (`/api/cron/snapshot`) runs at midnight UTC and snapshots all tracked channels. After a channel has been tracked for most of the selected period, its data reaches Tier 3.

**Accuracy:** Exact — this is the real number.

---

### Tier Comparison

```
  ┌──────────────┬────────────┬────────────────────┬─────────────┐
  │ Tier         │ Badge      │ Requires           │ Accuracy    │
  ├──────────────┼────────────┼────────────────────┼─────────────┤
  │ Estimated    │ Est.       │ 0-1 snapshots      │ Rough guess │
  │ Velocity     │ Live       │ 2 snapshots, 5min+ │ Projected   │
  │ Tracked      │ (none)     │ Snapshots span 80% │ Exact       │
  └──────────────┴────────────┴────────────────────┴─────────────┘
```

---

## Badges & Indicators

### Data Source Badges

Shown next to "+X views" on each video card:

```
  ┌─────────────────────────────────────────────┐
  │  ↗ +258.5M views  ┌──────┐                 │
  │                    │ Est. │  Gray outline    │
  │                    └──────┘                  │
  │  First visit — rough estimate based on      │
  │  video age and total views                  │
  ├─────────────────────────────────────────────┤
  │  ↗ +66.2M views   ┌──────┐                 │
  │                    │ Live │  Blue outline    │
  │                    └──────┘                  │
  │  Real velocity measured — projected across  │
  │  the period from actual view rate           │
  ├─────────────────────────────────────────────┤
  │  ↗ +450K views                              │
  │                     (no badge)              │
  │  Exact tracked count from snapshots that    │
  │  span the period                            │
  └─────────────────────────────────────────────┘
```

### Engagement Rate Badge

Color-coded based on how engaging a video is relative to its views:

```
  ┌────────────────────────────────────────────┐
  │                                            │
  │  > 5% engagement    ████████████████████   │
  │                     │ 8.2% engagement  │   │
  │                     ████████████████████   │
  │                     GREEN — High           │
  │                                            │
  │  2-5% engagement    ████████████████████   │
  │                     │ 3.5% engagement  │   │
  │                     ████████████████████   │
  │                     YELLOW — Medium        │
  │                                            │
  │  < 2% engagement    ████████████████████   │
  │                     │ 1.2% engagement  │   │
  │                     ████████████████████   │
  │                     DEFAULT — Low          │
  │                                            │
  └────────────────────────────────────────────┘
```

### Resurgence Indicator ("Rising from the Dead")

A lightning bolt icon appears when a video is getting **5x or more** its historical daily average in views, and only when backed by real data (Velocity or Tracked tier, never Estimated).

```
  ⚡ 12x historical avg

  What this means:

  Historical average:  totalViews / daysSincePublished  =  500 views/day
  Current rate:        viewsInRange / daysInRange       =  6,000 views/day

  Multiplier:          6,000 / 500 = 12x

  Threshold:           >= 5x  AND  dataSource != "estimated"
```

**Why exclude estimated?** Estimated-tier views are derived from the same lifetime average, so the multiplier would just reflect the age decay factor (always <= 1.0). It would never trigger, and if it somehow did, it wouldn't be meaningful.

```
  Example scenario:

  "How to Fix a Leaky Faucet" — Published 4 years ago

  Lifetime:  2,000,000 views / 1,460 days = 1,370 views/day average
  This week: 15,000 views/day (trending because of a viral TikTok)

  ⚡ 11x historical avg    <-- This is a huge competitive signal!

  The video is experiencing a resurgence — maybe a topic worth
  creating content around.
```

### Age vs. Performance Badge

When period data is available, the publish date transforms into a contextual insight:

```
  Without range data:           With range data:

  "Mar 15, 2021"                "Published 5 years ago · 45K views this period"
                                 ^^^^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^
                                 How old it is            How it's doing now
```

This makes the insight immediately visible — a 5-year-old video still pulling 45K views this month is a strong signal about evergreen content.

---

## Engagement Rate

**Formula:**

```
                   likes + comments
  engagement  =  ────────────────── x 100
                       views

  Example:
    likes:    50,000
    comments: 10,000
    views:    2,000,000

    engagement = (50,000 + 10,000) / 2,000,000 x 100 = 3.0%
```

**Why this formula?** Likes and comments are the two primary viewer actions. Dividing by views normalizes it — a video with 1M views and 100K likes is more engaging than one with 100M views and 100K likes.

**Display:** Formatted as "X.X%" (e.g., "3.0% engagement").

---

## Trending Carousel

The horizontal scrollable carousel at the top shows the **Top 10 videos by views gained in the selected period**.

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  🔥 Trending This Period                          [Top 10]      │
  │                                                                  │
  │  ◄  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────  ►  │
  │     │  ┌───┐  │ │  ┌───┐  │ │  ┌───┐  │ │  ┌───┐  │ │         │
  │     │  │ 1 │  │ │  │ 2 │  │ │  │ 3 │  │ │  │ 4 │  │ │         │
  │     │  └───┘  │ │  └───┘  │ │  └───┘  │ │  └───┘  │ │         │
  │     │ ↗+258M  │ │ ↗+66.2M │ │ ↗+59.4M │ │ ↗+46.4M │ │         │
  │     │         │ │         │ │         │ │         │ │         │
  │     │ Title.. │ │ Title.. │ │ Title.. │ │ Title.. │ │         │
  │     │ 3d ago  │ │ 5d ago  │ │ 7mo ago │ │ 8d ago  │ │         │
  │     │ 👁 74M  │ │ 👁 24M  │ │ 👁 241M │ │ 👁 64M  │ │         │
  │     └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────     │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

Each card shows:
- **Rank number** (1-10) in a circle overlay
- **Thumbnail** with duration badge
- **Views gained** in green with trending arrow
- **Title** (2 lines max)
- **Relative age** ("Published 3 years ago")
- **Total views** + data source badge
- **Resurgence indicator** (if applicable)

Data source: Uses the `rangeVideos` array (from the `/views-in-range` API), which is already sorted by `viewsInRange` descending.

---

## Sorting & Filtering

### Sort Options

```
  ┌────────────────────┬────────────────────────────────────────────┐
  │ Option             │ What it sorts by                          │
  ├────────────────────┼────────────────────────────────────────────┤
  │ Most Views         │ Lifetime total views (descending)         │
  │ Views This Period  │ Views gained in selected period (desc.)   │
  │ Most Likes         │ Total likes (descending)                  │
  │ Most Comments      │ Total comments (descending)               │
  │ Newest             │ Publish date (most recent first)          │
  │ Top Engagement     │ Engagement rate % (descending)            │
  └────────────────────┴────────────────────────────────────────────┘
```

**"Views This Period"** is special — it uses `rangeVideos` data (from the view-delta system) as the ordering source, showing all videos regardless of when they were published. This is the most useful sort for competitor analysis: _"What content is performing right now?"_

### Period Filter

Controls **two things simultaneously**:
1. Which videos appear in the main grid (filtered by publish date)
2. The date range used for "views this period" calculations

```
  ┌─────────────┬──────────────────────────────────┐
  │ Selection   │ Date range for view calculations │
  ├─────────────┼──────────────────────────────────┤
  │ Last 7 days │ Today - 7 days  →  Today        │
  │ Last 30 days│ Today - 30 days →  Today        │
  │ Last 90 days│ Today - 90 days →  Today        │
  │ All time    │ 2005-01-01      →  Today        │
  └─────────────┴──────────────────────────────────┘
```

### Search

Real-time client-side text filter. Matches video titles (case-insensitive). No API calls — filters the already-loaded results instantly.

---

## Charts

### Views Over Time (Area Chart)

Shows the last 20 videos sorted by publish date, with view counts as a filled area chart.

```
  Views
  │
  │          ╱╲
  │    ╱╲   ╱  ╲      ╱╲
  │   ╱  ╲ ╱    ╲    ╱  ╲
  │  ╱    ╲╱      ╲  ╱    ╲
  │ ╱               ╲╱      ╲
  │╱                          ╲
  └──────────────────────────────── Date
    Mar 1  Mar 5  Mar 10  Mar 15
```

**What it shows:** How the channel's video performance has trended over its recent uploads. Peaks indicate viral hits; consistent lines indicate steady performance.

### Top Engagement (Bar Chart)

Top 10 videos by engagement rate.

```
  Engagement %
  │
  │  ██
  │  ██  ██
  │  ██  ██  ██
  │  ██  ██  ██  ██
  │  ██  ██  ██  ██  ██  ██
  │  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██
  └──────────────────────────────────────────
     Vid1 Vid2 Vid3 Vid4 Vid5 Vid6 ...
```

**What it shows:** Which videos drive the most audience interaction relative to their views. High engagement suggests topics or formats that resonate with the audience.

---

## Channel Card

Displays at the top after entering a channel URL:

```
  ┌────────────────────────────────────────────────┐
  │  ┌──────┐                                      │
  │  │      │  Channel Name                        │
  │  │ Logo │  @handle                             │
  │  │      │                                      │
  │  └──────┘                                      │
  │                                                │
  │  👥 150M subscribers   👁 30B views   🎬 800 videos  │
  │  📅 Joined Jan 2012                            │
  │                                                │
  │  Channel description text...                   │
  └────────────────────────────────────────────────┘
```

All numbers use abbreviated formatting (K, M, B).

---

## Input Formats

VidMetrics accepts many formats for finding a channel:

```
  ┌──────────────────────────────────────────────────────────────┐
  │ Input                                        │ Detected As  │
  ├──────────────────────────────────────────────┼──────────────┤
  │ https://youtube.com/@MrBeast                 │ Handle       │
  │ https://www.youtube.com/@MrBeast             │ Handle       │
  │ https://m.youtube.com/@MrBeast               │ Handle       │
  │ youtube.com/@MrBeast                         │ Handle       │
  │ @MrBeast                                     │ Handle       │
  │ MrBeast                                      │ Search query │
  │ https://youtube.com/channel/UCX6OQ3...       │ Channel ID   │
  │ https://youtube.com/c/MrBeast                │ Handle       │
  │ https://youtube.com/user/MrBeast             │ Handle       │
  │ UCX6OQ3DyrFP7y8USLpeAHtg                     │ Channel ID   │
  └──────────────────────────────────────────────┴──────────────┘
```

Text that doesn't match URL patterns triggers a **channel search** — showing up to 5 matching channels with thumbnails and subscriber counts.

---

## Data Flow

```
  USER
   │
   │  Pastes URL / types handle / searches
   ▼
  ┌─────────────────────┐
  │  Parse Input        │  (parse-channel-input.ts)
  │  URL? Handle? Text? │
  └──────────┬──────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
  ┌────────┐    ┌─────────────┐
  │ Direct │    │ Search API  │  Shows up to 5 results
  │ Lookup │    │ (optional)  │  User picks one
  └───┬────┘    └──────┬──────┘
      │                │
      └───────┬────────┘
              ▼
  ┌─────────────────────┐
  │  YouTube API        │  channels.list → channel info
  │  (server-side only) │  search.list   → video IDs
  │                     │  videos.list   → video details
  └──────────┬──────────┘
             │
      ┌──────┴──────┐
      ▼              ▼
  ┌────────┐   ┌──────────────┐
  │ Videos │   │ Snapshots    │  Captured in background
  │ + Sort │   │ (fire & forget) │  (never blocks response)
  └───┬────┘   └──────┬───────┘
      │               │
      │               ▼
      │        ┌──────────────┐
      │        │ View Deltas  │  Three-tier calculation
      │        │ (view-deltas)│  Est. → Live → Tracked
      │        └──────┬───────┘
      │               │
      └───────┬───────┘
              ▼
  ┌─────────────────────┐
  │  Frontend Display   │
  │                     │
  │  Channel Card       │
  │  Trending Carousel  │
  │  Charts             │
  │  Filter Bar         │
  │  Video Grid         │
  └─────────────────────┘
              │
              │  After 10 minutes (automatic)
              ▼
  ┌─────────────────────┐
  │  Silent Re-fetch    │  Captures 2nd snapshot
  │  Est. → Live        │  Upgrades data tier
  └─────────────────────┘
```

---

## YouTube API Quota

YouTube's free tier allows **10,000 units/day**. VidMetrics is designed to stay well within this:

```
  ┌────────────────────────┬───────┬─────────────────────────────┐
  │ Operation              │ Units │ When it happens             │
  ├────────────────────────┼───────┼─────────────────────────────┤
  │ search.list (find vids)│  100  │ Each channel lookup         │
  │ channels.list          │    1  │ Each channel lookup         │
  │ videos.list            │    1  │ Each channel lookup         │
  │ videos.list (cron)     │    1  │ Per 50 tracked videos/day   │
  └────────────────────────┴───────┴─────────────────────────────┘

  Per channel lookup:  ~102 units
  Daily budget:        10,000 units
  Max lookups/day:     ~98 channels

  Daily cron cost:     ~1 unit per 50 tracked videos
                       (only videos.list with statistics)
```

The daily cron job at midnight UTC snapshots all tracked channels' videos in the background, building up the historical data that powers the three-tier view calculation system.
