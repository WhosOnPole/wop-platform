import Link from 'next/link'
import { Star } from 'lucide-react'

interface HighlightsProps {
  highlighted_fan: {
    id: string
    username: string
    profile_image_url: string | null
  } | null
  highlighted_sponsor: {
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
  } | null
}

interface HighlightsSectionProps {
  highlights: HighlightsProps
}

export function HighlightsSection({ highlights }: HighlightsSectionProps) {
  if (!highlights.highlighted_fan && !highlights.highlighted_sponsor) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center space-x-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">This Week&apos;s Highlights</h2>
      </div>

      {highlights.highlighted_fan && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Featured Fan</p>
          <Link
            href={`/u/${highlights.highlighted_fan.username}`}
            className="flex items-center space-x-3 rounded-md p-2 hover:bg-gray-50"
          >
            {highlights.highlighted_fan.profile_image_url ? (
              <img
                src={highlights.highlighted_fan.profile_image_url}
                alt={highlights.highlighted_fan.username}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                <span className="text-sm font-medium text-gray-600">
                  {highlights.highlighted_fan.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium text-gray-900">
              {highlights.highlighted_fan.username}
            </span>
          </Link>
        </div>
      )}

      {highlights.highlighted_sponsor && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Featured Sponsor</p>
          {highlights.highlighted_sponsor.website_url ? (
            <Link
              href={highlights.highlighted_sponsor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 rounded-md p-2 hover:bg-gray-50"
            >
              {highlights.highlighted_sponsor.logo_url && (
                <img
                  src={highlights.highlighted_sponsor.logo_url}
                  alt={highlights.highlighted_sponsor.name}
                  className="h-10 w-10 rounded object-contain"
                />
              )}
              <span className="font-medium text-gray-900">
                {highlights.highlighted_sponsor.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center space-x-3 rounded-md p-2">
              {highlights.highlighted_sponsor.logo_url && (
                <img
                  src={highlights.highlighted_sponsor.logo_url}
                  alt={highlights.highlighted_sponsor.name}
                  className="h-10 w-10 rounded object-contain"
                />
              )}
              <span className="font-medium text-gray-900">
                {highlights.highlighted_sponsor.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

