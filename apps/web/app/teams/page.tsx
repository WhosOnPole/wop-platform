import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getTeamIconUrl } from '@/utils/storage-urls'
import { TeamCard } from '@/components/teams/team-card'

export const revalidate = 3600 // Revalidate every hour

export default async function TeamsPage() {
  const supabase = createServerComponentClient({ cookies })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 teams and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
          <p className="text-red-800">
            Error loading teams. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 teams and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No teams available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="mt-2 text-gray-600">
          Explore all Formula 1 teams and their profiles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {teams.map((team) => {
          // Generate slug from team name
          const slug = team.name.toLowerCase().replace(/\s+/g, '-')
          const iconUrl = supabaseUrl ? getTeamIconUrl(team.name, supabaseUrl) : null
          
          return (
            <TeamCard
              key={team.id}
              team={team}
              slug={slug}
              iconUrl={iconUrl}
            />
          )
        })}
      </div>
    </div>
  )
}
