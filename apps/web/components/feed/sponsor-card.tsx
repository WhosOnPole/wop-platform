import Link from 'next/link'

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
}

interface SponsorCardProps {
  sponsor: Sponsor
  /** Use "banner" for full-width sponsor strip with no card styling so content can stretch */
  variant?: 'card' | 'banner'
}

export function SponsorCard({ sponsor, variant = 'card' }: SponsorCardProps) {
  const isBanner = variant === 'banner'
  const content = (
    <div
      className={
        isBanner
          ? 'flex h-full w-full flex-col gap-4 py-2 sm:flex-row sm:items-center'
          : 'flex h-full w-full flex-col rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm'
      }
    >
      <div className="flex h-full min-w-0 flex-1 gap-4 sm:items-center">
        {/* Logo - Full height on left */}
        {sponsor.logo_url && (
          <div className="flex-shrink-0">
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className={
                isBanner
                  ? 'h-14 w-auto max-w-[160px] object-contain sm:h-16'
                  : 'h-full w-auto max-w-[120px] object-contain'
              }
            />
          </div>
        )}

        {/* Name and Description - Stacked on right */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="mb-1 text-xl font-bold text-white sm:mb-2">{sponsor.name}</h3>
          {sponsor.description && (
            <p className={isBanner ? 'text-sm text-white/90 line-clamp-2 sm:line-clamp-3' : 'text-sm text-white/90 line-clamp-3'}>
              {sponsor.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (sponsor.website_url) {
    return (
      <Link
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
      >
        {content}
      </Link>
    )
  }

  return content
}
