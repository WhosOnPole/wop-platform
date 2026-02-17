interface TeamQuotesTabProps {
  teamId: string
}

export function TeamQuotesTab({ teamId }: TeamQuotesTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center">
      <p className="text-white/60">Team quotes coming soon.</p>
    </div>
  )
}
