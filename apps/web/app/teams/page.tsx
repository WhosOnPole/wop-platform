import { cache } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Cache team data per request (session-level caching)
const getCachedTeams = cache(async () => {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  return teams || []
})

export default async function TeamsPage() {
  const teams = await getCachedTeams()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="mt-2 text-gray-600">
          Explore all Formula 1 teams and their profiles
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No teams available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {teams.map((team) => {
            // Generate slug from team name
            const slug = team.name.toLowerCase().replace(/\s+/g, '-')
            
            return (
              <Link
                key={team.id}
                href={`/teams/${slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-all hover:shadow-lg hover:scale-105"
              >
                {/* Team Image */}
                <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                  {team.image_url ? (
                    <img
                      src={team.image_url}
                      alt={team.name}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl font-bold text-gray-400">
                        {team.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team Info */}
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {team.name}
                  </h3>
                  
                  {team.overview_text && (
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {team.overview_text}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

