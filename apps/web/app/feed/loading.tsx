export default function Loading() {
  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-white/5" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-white/5" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}
