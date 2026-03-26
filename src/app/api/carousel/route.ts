import { NextResponse } from "next/server"
import { fetchChannelsBatch } from "@/lib/youtube"

// Hardcoded YouTube channel IDs — one batch call (1 quota unit), cached 24h.
// Row 1: mega-channels
// Row 2: tech/educational creators
const CHANNEL_IDS = [
  // Row 1
  "UCX6OQ3DkcsbYNE6H8uQQuVA", // MrBeast
  "UCq-Fj5jknLsUf-MWSy4_brA", // T-Series
  "UCbCmjCuTUZos6Inko4u57UQ", // Cocomelon
  "UCpEhnqL0y41EpW2TvWAHD7Q", // SET India
  "UC-lHJZR3Gqxm24_Vd_AJ5Yw", // PewDiePie
  "UCk8GzjMOrta8yxDcKfylJYw", // Kids Diana Show
  "UCJplp5SWAQtC6yQiDTsxMg",  // Like Nastya (wrong id will just be filtered)
  "UCvlE5gTbOvjiolFlEm-c_Ow", // Vlad and Niki
  "UCFFbwnve3yF62-tVXkTyHqg", // Zee Music Company
  "UCJ5v_MCY6GNUBTO8-D3XoAg", // WWE
  "UCOmHUn--16B90oW2L6FRR3A", // BLACKPINK
  "UCyoXW-Dse7fQ6pMC4GEmGNw", // Goldmines Telefilms
  // Row 2
  "UC295-Dw_tDNtZXFeAPAQKEw", // 5-Minute Crafts
  "UCRijo3ddMTht_IHyNSNXpNQ", // Dude Perfect
  "UCY1kMZp36IQSyNx_9h4mpCg", // Mark Rober
  "UCBJycsmduvYEL83R_U4JriQ", // MKBHD
  "UCHnyfMqiRRG1u-2MsSQLbXA", // Veritasium
  "UCXuqSBlHAE6Xw-yeJA0Tunw", // Linus Tech Tips
  "UCtinbF-Q-fVthA0qrFQTgXQ", // Casey Neistat
  "UCoOae5nYA7VqaXzerajD0lg", // Ali Abdaal
  "UCsBjURrPoezykLs9EqgamOA", // Fireship
  "UCbRP3c757lWg9M-U7TyEkXA", // Theo - t3.gg
  "UCUyeluBRhGPCW4rPe_UvBZQ", // ThePrimeagen
  "UCFbNIlppjAuEX4znoulh0Cw", // Web Dev Simplified
]

const ROW_1_COUNT = 12

function formatSubscribers(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${Math.round(count / 1_000_000)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`
  return String(count)
}

export async function GET() {
  try {
    const channels = await fetchChannelsBatch(CHANNEL_IDS)

    const creators = channels.map((ch) => ({
      id: ch.id,
      name: ch.title,
      handle: ch.handle,
      avatarUrl: ch.thumbnailUrl,
      subscribers: formatSubscribers(ch.subscriberCount),
      subscriberCount: ch.subscriberCount,
    }))

    // Split into rows based on the original ordering
    const idIndexMap = new Map(CHANNEL_IDS.map((id, i) => [id, i]))
    creators.sort((a, b) => (idIndexMap.get(a.id) ?? 99) - (idIndexMap.get(b.id) ?? 99))

    const row1 = creators.slice(0, ROW_1_COUNT)
    const row2 = creators.slice(ROW_1_COUNT)

    return NextResponse.json(
      { row1, row2 },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    )
  } catch {
    return NextResponse.json({ row1: [], row2: [] }, { status: 500 })
  }
}
