import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Trophy, MapPin, Calendar, Users } from 'lucide-react'
import { TrackTipsSection } from '@/components/dtt/track-tips-section'
import { CommunityGridsSection } from '@/components/dtt/community-grids-section'
import { DiscussionSection } from '@/components/dtt/discussion-section'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface PageProps {
  params: {
    type: string
    slug: string
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { type, slug } = params
  const supabase = createServerComponentClient({ cookies })

  if (!['drivers', 'teams', 'tracks'].includes(type)) {
    notFound()
  }

  // Fetch the entity based on type
  let entity: any = null
  let relatedData: any = null

  if (type === 'drivers') {
    // Try to find driver by slug (name converted to slug format)
    const slugName = slug.replace(/-/g, ' ')
    const { data: drivers } = await supabase
      .from('drivers')
      .select(
        `
        *,
        teams:team_id (
          id,
          name,
          image_url
        )
      `
      )
      .ilike('name', `%${slugName}%`)

    // Find the best match (exact match preferred)
    const driver = drivers?.find(
      (d) => d.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) || drivers?.[0]

    entity = driver
  } else if (type === 'teams') {
    const slugName = slug.replace(/-/g, ' ')
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', `%${slugName}%`)

    const team = teams?.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) || teams?.[0]

    entity = team
  } else if (type === 'tracks') {
    const slugName = slug.replace(/-/g, ' ')
    const { data: tracks } = await supabase
      .from('tracks')
      .select('*')
      .ilike('name', `%${slugName}%`)

    const track = tracks?.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) || tracks?.[0]

    entity = track
  }

  if (!entity) {
    notFound()
  }

  // Fetch related content
  const [grids, posts] = await Promise.all([
    // Community grids for this entity
    supabase
      .from('grids')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('type', type.slice(0, -1)) // Remove 's' from 'drivers' -> 'driver'
      .order('created_at', { ascending: false })
      .limit(10),
    // Discussion posts for this entity
    supabase
      .from('posts')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('parent_page_type', type.slice(0, -1))
      .eq('parent_page_id', entity.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-lg">
        {(type === 'drivers' && (entity.headshot_url || entity.image_url)) || (type !== 'drivers' && entity.image_url) ? (
          <div className="relative h-64 w-full md:h-96">
            <img
              src={type === 'drivers' ? (entity.headshot_url || entity.image_url) : entity.image_url}
              alt={entity.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{entity.name}</h1>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {type === 'drivers' && (
              <>
                {entity.teams && (
                  <div>
                    <p className="text-sm text-gray-500">Team</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {entity.teams.name}
                    </p>
                  </div>
                )}
                {entity.age && (
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-lg font-semibold text-gray-900">{entity.age}</p>
                  </div>
                )}
                {entity.nationality && (
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {entity.nationality}
                    </p>
                  </div>
                )}
                {entity.podiums_total !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Podiums</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {entity.podiums_total}
                    </p>
                  </div>
                )}
                {entity.world_championships !== null && (
                  <div>
                    <p className="text-sm text-gray-500">World Championships</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {entity.world_championships}
                    </p>
                  </div>
                )}
                {entity.current_standing && (
                  <div>
                    <p className="text-sm text-gray-500">Current Standing</p>
                    <p className="text-lg font-semibold text-gray-900">
                      #{entity.current_standing}
                    </p>
                  </div>
                )}
              </>
            )}

            {type === 'teams' && entity.overview_text && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-gray-700">{entity.overview_text}</p>
              </div>
            )}

            {type === 'tracks' && (
              <>
                {entity.built_date && (
                  <div>
                    <p className="text-sm text-gray-500">Built</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(entity.built_date).getFullYear()}
                    </p>
                  </div>
                )}
                {entity.track_length && (
                  <div>
                    <p className="text-sm text-gray-500">Length</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {entity.track_length} km
                    </p>
                  </div>
                )}
                {entity.overview_text && (
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-gray-700">{entity.overview_text}</p>
                  </div>
                )}
                {entity.history_text && (
                  <div className="col-span-2 md:col-span-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">History</h3>
                    <p className="text-gray-700">{entity.history_text}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Track Tips Section (Tracks Only) */}
      {type === 'tracks' && <TrackTipsSection trackId={entity.id} />}

      {/* Community Grids Section */}
      {grids.data && grids.data.length > 0 && (
        <CommunityGridsSection
          grids={grids.data}
          entityType={type.slice(0, -1)}
          entityName={entity.name}
        />
      )}

      {/* Discussion Section */}
      <DiscussionSection
        posts={posts.data || []}
        parentPageType={type.slice(0, -1) as 'driver' | 'team' | 'track'}
        parentPageId={entity.id}
      />
    </div>
  )
}

