"use client"

import { useRef, useState, useEffect } from "react"
import { Users } from "lucide-react"

type Creator = {
  id: string
  name: string
  handle: string
  avatarUrl: string
  subscribers: string
}

type CarouselData = {
  row1: Creator[]
  row2: Creator[]
}

// Hardcoded fallback so the carousel renders instantly while the API loads
const FALLBACK_ROW_1: Creator[] = [
  { id: "1", name: "MrBeast", handle: "@MrBeast", avatarUrl: "", subscribers: "358M" },
  { id: "2", name: "T-Series", handle: "@tseries", avatarUrl: "", subscribers: "283M" },
  { id: "3", name: "Cocomelon", handle: "@Cocomelon", avatarUrl: "", subscribers: "185M" },
  { id: "4", name: "SET India", handle: "@setindia", avatarUrl: "", subscribers: "178M" },
  { id: "5", name: "PewDiePie", handle: "@PewDiePie", avatarUrl: "", subscribers: "111M" },
  { id: "6", name: "Kids Diana Show", handle: "@KidsDianaShow", avatarUrl: "", subscribers: "129M" },
  { id: "7", name: "Like Nastya", handle: "@LikeNastya", avatarUrl: "", subscribers: "122M" },
  { id: "8", name: "Vlad and Niki", handle: "@VladandNiki", avatarUrl: "", subscribers: "121M" },
  { id: "9", name: "Zee Music", handle: "@zeemusiccompany", avatarUrl: "", subscribers: "113M" },
  { id: "10", name: "WWE", handle: "@WWE", avatarUrl: "", subscribers: "103M" },
  { id: "11", name: "BLACKPINK", handle: "@BLACKPINK", avatarUrl: "", subscribers: "97M" },
  { id: "12", name: "Goldmines", handle: "@GoldminesTelefilms", avatarUrl: "", subscribers: "96M" },
]

const FALLBACK_ROW_2: Creator[] = [
  { id: "13", name: "5-Minute Crafts", handle: "@5MinuteCraftsYouTube", avatarUrl: "", subscribers: "80M" },
  { id: "14", name: "Dude Perfect", handle: "@DudePerfect", avatarUrl: "", subscribers: "60M" },
  { id: "15", name: "Mark Rober", handle: "@MarkRober", avatarUrl: "", subscribers: "55M" },
  { id: "16", name: "Marques Brownlee", handle: "@mkbhd", avatarUrl: "", subscribers: "20M" },
  { id: "17", name: "Veritasium", handle: "@veritasium", avatarUrl: "", subscribers: "17M" },
  { id: "18", name: "Linus Tech Tips", handle: "@LinusTechTips", avatarUrl: "", subscribers: "16M" },
  { id: "19", name: "Casey Neistat", handle: "@casey", avatarUrl: "", subscribers: "12M" },
  { id: "20", name: "Ali Abdaal", handle: "@aliabdaal", avatarUrl: "", subscribers: "6M" },
  { id: "21", name: "Fireship", handle: "@Fireship", avatarUrl: "", subscribers: "4M" },
  { id: "22", name: "Theo Browne", handle: "@t3dotgg", avatarUrl: "", subscribers: "600K" },
  { id: "23", name: "The Primeagen", handle: "@ThePrimeTimeagen", avatarUrl: "", subscribers: "750K" },
  { id: "24", name: "Web Dev Simplified", handle: "@WebDevSimplified", avatarUrl: "", subscribers: "1.6M" },
]

// Consistent color from channel name
function colorFromName(name: string): string {
  const colors = [
    "#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f97316",
    "#ec4899", "#14b8a6", "#eab308", "#6366f1", "#dc2626",
    "#f472b6", "#d97706", "#06b6d4", "#2563eb", "#059669",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function MarqueeRow({
  creators,
  direction = "left",
  speed = 35,
  onSelect,
}: {
  creators: Creator[]
  direction?: "left" | "right"
  speed?: number
  onSelect: (handle: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const items = [...creators, ...creators]

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={rowRef}
        className="flex gap-3 w-max"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: isHovered ? "paused" : "running",
        }}
      >
        {items.map((creator, i) => (
          <CreatorCard
            key={`${creator.handle}-${i}`}
            creator={creator}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function CreatorCard({
  creator,
  onSelect,
}: {
  creator: Creator
  onSelect: (handle: string) => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(creator.handle)}
      className="flex-shrink-0 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all duration-200 hover:shadow-md hover:scale-[1.03] hover:border-primary/30 active:scale-[0.98] cursor-pointer"
      style={{ minWidth: 220 }}
    >
      {/* Avatar */}
      {creator.avatarUrl && !imgError ? (
        <img
          src={creator.avatarUrl}
          alt={creator.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: colorFromName(creator.name) }}
        >
          {creator.name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-semibold truncate max-w-[140px]">
          {creator.name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {creator.subscribers}
        </span>
      </div>
    </button>
  )
}

interface HeroCarouselProps {
  onSelect: (handle: string) => void
}

export function HeroCarousel({ onSelect }: HeroCarouselProps) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<CarouselData>({
    row1: FALLBACK_ROW_1,
    row2: FALLBACK_ROW_2,
  })

  useEffect(() => {
    setMounted(true)

    fetch("/api/carousel")
      .then((res) => res.json())
      .then((json: CarouselData) => {
        if (json.row1?.length > 0) setData(json)
      })
      .catch(() => {})
  }, [])

  if (!mounted) {
    return <div className="h-[140px]" />
  }

  return (
    <div
      className="relative w-screen left-1/2 -translate-x-1/2 mt-20 select-none overflow-hidden"
    >
      <div className="space-y-3">
        <MarqueeRow creators={data.row1} direction="left" speed={40} onSelect={onSelect} />
        <MarqueeRow creators={data.row2} direction="right" speed={45} onSelect={onSelect} />
      </div>
    </div>
  )
}
