import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold tracking-tight">VidMetrics</span>
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              Competitor Analysis
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            How It Works
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
