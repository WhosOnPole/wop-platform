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
}

export function SponsorCard({ sponsor }: SponsorCardProps) {
  const content = (
    <div className="flex h-full w-full flex-col rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm">
      <div className="flex h-full gap-4">
        {/* Logo - Full height on left */}
        {sponsor.logo_url && (
          <div className="flex-shrink-0">
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className="h-full w-auto max-w-[120px] object-contain"
            />
          </div>
        )}
        
        {/* Name and Description - Stacked on right */}
        <div className="flex flex-1 flex-col justify-center">
          <h3 className="mb-2 text-xl font-bold text-white">{sponsor.name}</h3>
          {sponsor.description && (
            <p className="text-sm text-white/90 line-clamp-3">
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
