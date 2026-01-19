interface EntityOverviewProps {
  overviewText: string | null | undefined
}

export function EntityOverview({ overviewText }: EntityOverviewProps) {
  if (!overviewText) return null

  return (
    <div className="relative z-10 px-4 py-8 text-center">
      <p className="mx-auto max-w-3xl text-lg text-white/90 leading-relaxed">
        {overviewText}
      </p>
    </div>
  )
}
