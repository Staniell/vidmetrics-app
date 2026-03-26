import Image from "next/image"
import { Users, Eye, Video, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatDate } from "@/lib/format"
import { cn, winnerClass } from "@/lib/utils"
import type { ChannelInfo } from "@/types"

interface CompareStatCardsProps {
  primary: ChannelInfo
  comparison: ChannelInfo
}

function ChannelColumn({ channel, statClasses }: {
  channel: ChannelInfo
  statClasses: { subs: string; views: string; videos: string }
}) {
  return (
    <Card className="flex-1">
      <CardContent className="flex flex-col items-center gap-3 p-5">
        {channel.thumbnailUrl && (
          <Image
            src={channel.thumbnailUrl}
            alt={channel.title}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div className="text-center min-w-0">
          <h3 className="text-base font-semibold truncate">{channel.title}</h3>
          <p className="text-xs text-muted-foreground">{channel.handle}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <StatCell
            icon={<Users className="h-3.5 w-3.5" />}
            label="Subscribers"
            value={channel.subscriberCount > 0 ? formatNumber(channel.subscriberCount) : "Hidden"}
            className={statClasses.subs}
          />
          <StatCell
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Total Views"
            value={formatNumber(channel.viewCount)}
            className={statClasses.views}
          />
          <StatCell
            icon={<Video className="h-3.5 w-3.5" />}
            label="Videos"
            value={formatNumber(channel.videoCount)}
            className={statClasses.videos}
          />
          <StatCell
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Joined"
            value={formatDate(channel.publishedAt)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCell({ icon, label, value, className }: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold", className)}>{value}</span>
    </div>
  )
}

export function CompareStatCards({ primary, comparison }: CompareStatCardsProps) {
  const subs = winnerClass(primary.subscriberCount, comparison.subscriberCount)
  const views = winnerClass(primary.viewCount, comparison.viewCount)
  const videos = winnerClass(primary.videoCount, comparison.videoCount)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ChannelColumn
        channel={primary}
        statClasses={{ subs: subs.aClass, views: views.aClass, videos: videos.aClass }}
      />
      <ChannelColumn
        channel={comparison}
        statClasses={{ subs: subs.bClass, views: views.bClass, videos: videos.bClass }}
      />
    </div>
  )
}
