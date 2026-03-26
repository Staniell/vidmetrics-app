import { formatNumber, formatDate } from "@/lib/format"
import { GREEN_600, MUTED_FOREGROUND, BORDER } from "@/lib/pdf-theme"
import type { ChannelInfo } from "@/types"

interface PdfChannelHeaderProps {
  channel: ChannelInfo
  comparisonChannel?: ChannelInfo
  period: string
  rangeStart: string
  rangeEnd: string
  sort: string
}

const SORT_LABELS: Record<string, string> = {
  views: "Most Views",
  viewsInRange: "Views This Period",
  likes: "Most Likes",
  comments: "Most Comments",
  date: "Newest",
  engagement: "Top Engagement",
}

const PERIOD_LABELS: Record<string, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  all: "All time",
  custom: "Custom range",
}

function winnerColor(a: number, b: number): { aColor: string; bColor: string } {
  if (a > b) return { aColor: GREEN_600, bColor: "inherit" }
  if (b > a) return { aColor: "inherit", bColor: GREEN_600 }
  return { aColor: "inherit", bColor: "inherit" }
}

function ChannelBlock({
  channel,
  statColors,
}: {
  channel: ChannelInfo
  statColors?: { subs: string; views: string; videos: string }
}) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {channel.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={channel.thumbnailUrl}
          alt={channel.title}
          width={56}
          height={56}
          style={{ borderRadius: "50%" }}
          crossOrigin="anonymous"
        />
      )}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{channel.title}</div>
        <div style={{ fontSize: 11, color: MUTED_FOREGROUND }}>{channel.handle}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
        <StatItem
          label="Subscribers"
          value={channel.subscriberCount > 0 ? formatNumber(channel.subscriberCount) : "Hidden"}
          color={statColors?.subs}
        />
        <StatItem label="Total Views" value={formatNumber(channel.viewCount)} color={statColors?.views} />
        <StatItem label="Videos" value={formatNumber(channel.videoCount)} color={statColors?.videos} />
        <StatItem label="Joined" value={formatDate(channel.publishedAt)} />
      </div>
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: MUTED_FOREGROUND }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || "inherit" }}>{value}</div>
    </div>
  )
}

export function PdfChannelHeader({
  channel,
  comparisonChannel,
  period,
  rangeStart,
  rangeEnd,
  sort,
}: PdfChannelHeaderProps) {
  const subs = comparisonChannel
    ? winnerColor(channel.subscriberCount, comparisonChannel.subscriberCount)
    : undefined
  const views = comparisonChannel
    ? winnerColor(channel.viewCount, comparisonChannel.viewCount)
    : undefined
  const videos = comparisonChannel
    ? winnerColor(channel.videoCount, comparisonChannel.videoCount)
    : undefined

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Branding */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>VidMetrics Report</div>
        <div style={{ fontSize: 11, color: MUTED_FOREGROUND }}>
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Channel cards */}
      {comparisonChannel ? (
        <div style={{ display: "flex", gap: 12 }}>
          <ChannelBlock
            channel={channel}
            statColors={{ subs: subs!.aColor, views: views!.aColor, videos: videos!.aColor }}
          />
          <ChannelBlock
            channel={comparisonChannel}
            statColors={{ subs: subs!.bColor, views: views!.bColor, videos: videos!.bColor }}
          />
        </div>
      ) : (
        <ChannelBlock channel={channel} />
      )}

      {/* Filter context */}
      <div style={{ fontSize: 11, color: MUTED_FOREGROUND, display: "flex", gap: 16 }}>
        <span>Sort: {SORT_LABELS[sort] || sort}</span>
        <span>Period: {PERIOD_LABELS[period] || period}</span>
        <span>Range: {rangeStart} to {rangeEnd}</span>
      </div>
    </div>
  )
}
