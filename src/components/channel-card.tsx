import Image from "next/image"
import { Users, Eye, Video, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatDate } from "@/lib/format"
import type { ChannelInfo } from "@/types"

interface ChannelCardProps {
  channel: ChannelInfo
}

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        {channel.thumbnailUrl && (
          <Image
            src={channel.thumbnailUrl}
            alt={channel.title}
            width={80}
            height={80}
            className="rounded-full"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{channel.title}</h2>
          <p className="text-sm text-muted-foreground">{channel.handle}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Subscribers"
            value={
              channel.subscriberCount > 0
                ? formatNumber(channel.subscriberCount)
                : "Hidden"
            }
          />
          <Stat
            icon={<Eye className="h-4 w-4" />}
            label="Total Views"
            value={formatNumber(channel.viewCount)}
          />
          <Stat
            icon={<Video className="h-4 w-4" />}
            label="Videos"
            value={formatNumber(channel.videoCount)}
          />
          <Stat
            icon={<Calendar className="h-4 w-4" />}
            label="Joined"
            value={formatDate(channel.publishedAt)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
