import { formatNumber, formatDate, formatDuration, formatEngagement } from "@/lib/format"
import { MUTED_FOREGROUND, BORDER, FOREGROUND } from "@/lib/pdf-theme"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface PdfVideoTableProps {
  videos: VideoMetrics[]
  rangeVideos: VideoViewDelta[]
  sort: string
  channelName?: string
  isComparing: boolean
  comparisonVideos?: VideoMetrics[]
  comparisonRangeVideos?: VideoViewDelta[]
  comparisonName?: string
}

interface MergedRow {
  videoId: string
  title: string
  publishedAt: string
  videoType: string
  duration: string
  viewCount: number
  likeCount: number
  commentCount: number
  engagementRate: number
  viewsInRange?: number
  dataSource?: string
}

function mergeVideoData(
  videos: VideoMetrics[],
  rangeVideos: VideoViewDelta[],
  sort: string
): MergedRow[] {
  const rangeMap = new Map(rangeVideos.map((rv) => [rv.videoId, rv]))

  const sortField = sort.endsWith("_asc") ? sort.slice(0, -4) : sort
  const sortAsc = sort.endsWith("_asc")

  if (sortField === "viewsInRange" && rangeVideos.length > 0) {
    const videoMap = new Map(videos.map((v) => [v.id, v]))
    const ordered = sortAsc ? [...rangeVideos].reverse() : rangeVideos
    return ordered.slice(0, 50).map((rv) => {
      const base = videoMap.get(rv.videoId)
      return {
        videoId: rv.videoId,
        title: rv.title,
        publishedAt: rv.publishedAt,
        videoType: rv.videoType,
        duration: rv.duration,
        viewCount: base?.viewCount ?? rv.totalViews,
        likeCount: rv.likeCount,
        commentCount: rv.commentCount,
        engagementRate: rv.engagementRate,
        viewsInRange: rv.viewsInRange,
        dataSource: rv.dataSource,
      }
    })
  }

  return videos.slice(0, 50).map((v) => {
    const range = rangeMap.get(v.id)
    return {
      videoId: v.id,
      title: v.title,
      publishedAt: v.publishedAt,
      videoType: v.videoType,
      duration: v.duration,
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      commentCount: v.commentCount,
      engagementRate: v.engagementRate,
      viewsInRange: range?.viewsInRange,
      dataSource: range?.dataSource,
    }
  })
}

const ROWS_PER_CHUNK = 20

const thStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  color: MUTED_FOREGROUND,
  textAlign: "left",
  padding: "6px 6px",
  borderBottom: `1px solid ${BORDER}`,
  whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "5px 6px",
  borderBottom: `1px solid ${BORDER}`,
  color: FOREGROUND,
  verticalAlign: "top",
}

function VideoTableChunk({
  rows,
  startIndex,
  channelName,
}: {
  rows: MergedRow[]
  startIndex: number
  channelName?: string
}) {
  return (
    <div>
      {channelName && startIndex === 0 && (
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{channelName}</div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        {startIndex === 0 && (
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 24 }}>#</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Published</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Duration</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Views</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Period Views</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Likes</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Comments</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Eng.</th>
              <th style={thStyle}>Source</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={startIndex + i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
              <td style={{ ...tdStyle, color: MUTED_FOREGROUND }}>{startIndex + i + 1}</td>
              <td style={{ ...tdStyle, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <a
                  href={`https://www.youtube.com/watch?v=${row.videoId}`}
                  style={{ color: FOREGROUND, textDecoration: "none" }}
                >
                  {row.title}
                </a>
              </td>
              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDate(row.publishedAt)}</td>
              <td style={tdStyle}>{row.videoType}</td>
              <td style={tdStyle}>{formatDuration(row.duration)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{formatNumber(row.viewCount)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                {row.viewsInRange != null ? formatNumber(row.viewsInRange) : "-"}
              </td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{formatNumber(row.likeCount)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{formatNumber(row.commentCount)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{formatEngagement(row.engagementRate)}</td>
              <td style={{ ...tdStyle, fontSize: 9, color: MUTED_FOREGROUND }}>{row.dataSource || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PdfVideoTable({
  videos,
  rangeVideos,
  sort,
  channelName,
  isComparing,
  comparisonVideos,
  comparisonRangeVideos,
  comparisonName,
}: PdfVideoTableProps) {
  const primaryRows = mergeVideoData(videos, rangeVideos, sort)
  const comparisonRows =
    isComparing && comparisonVideos && comparisonRangeVideos
      ? mergeVideoData(comparisonVideos, comparisonRangeVideos, sort)
      : []

  // Split primary rows into chunks for pagination
  const primaryChunks: MergedRow[][] = []
  for (let i = 0; i < primaryRows.length; i += ROWS_PER_CHUNK) {
    primaryChunks.push(primaryRows.slice(i, i + ROWS_PER_CHUNK))
  }

  const comparisonChunks: MergedRow[][] = []
  for (let i = 0; i < comparisonRows.length; i += ROWS_PER_CHUNK) {
    comparisonChunks.push(comparisonRows.slice(i, i + ROWS_PER_CHUNK))
  }

  return (
    <>
      {primaryChunks.map((chunk, idx) => (
        <div key={`primary-${idx}`} data-section="videos">
          <VideoTableChunk
            rows={chunk}
            startIndex={idx * ROWS_PER_CHUNK}
            channelName={isComparing ? channelName : undefined}
          />
        </div>
      ))}
      {comparisonChunks.map((chunk, idx) => (
        <div key={`comparison-${idx}`} data-section="videos">
          <VideoTableChunk
            rows={chunk}
            startIndex={idx * ROWS_PER_CHUNK}
            channelName={comparisonName}
          />
        </div>
      ))}
    </>
  )
}
