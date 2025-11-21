import Link from 'next/link'

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
}

interface FeaturedSponsorProps {
  sponsor: Sponsor
}

export function FeaturedSponsor({ sponsor }: FeaturedSponsorProps) {
  const content = (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="p-8 text-center">
        {sponsor.logo_url && (
          <div className="mb-6 flex justify-center">
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className="h-24 w-auto object-contain"
            />
          </div>
        )}
        <h3 className="mb-2 text-2xl font-bold text-foundation-black">{sponsor.name}</h3>
        {sponsor.website_url && (
          <Link
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bright-teal hover:text-racing-orange font-medium"
          >
            Visit Website →
          </Link>
        )}
      </div>
    </div>
  )

  if (sponsor.website_url) {
    return (
      <Link
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </Link>
    )
  }

  return content
}

