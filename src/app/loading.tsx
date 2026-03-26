import { LoadingState } from "@/components/loading-state"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <LoadingState />
    </div>
  )
}
