export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="h-[40vh] w-full animate-pulse bg-white/5" />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-32 w-full animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  )
}
