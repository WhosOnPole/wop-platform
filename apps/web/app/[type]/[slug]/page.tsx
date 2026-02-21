import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { EntityHeroBackground } from '@/components/entity/entity-hero-background'
import { EntityHeaderWrapper } from '@/components/entity/entity-header-wrapper'
import { PageBackButton } from '@/components/page-back-button'
import { EntityOverview } from '@/components/entity/entity-overview'
import { EntityTabs } from '@/components/entity/entity-tabs'
import { TrackSubmissionsTab } from '@/components/entity/tabs/track-submissions-tab'
import { TrackTipsTab } from '@/components/entity/tabs/track-tips-tab'
import { TrackScheduleTab } from '@/components/entity/tabs/track-schedule-tab'
import { TeamDriversTab } from '@/components/entity/tabs/team-drivers-tab'
import { DiscussionTab } from '@/components/entity/tabs/discussion-tab'
import { CheckInSection } from '@/components/race/check-in-section'
import { getTeamLogoUrl, getTeamBackgroundUrl, getTrackSlug } from '@/utils/storage-urls'
import { getCountryFlagPath } from '@/utils/flags'
import { isRaceWeekendActive } from '@/utils/race-weekend'

export const runtime = 'nodejs'
export const revalidate = 3600 // Revalidate every hour

// Normalize accented characters and create slug (hyphen-separated for URLs)
function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
}

// For comparison: strip all separators so "autodromo-hermanos-rodriguez" === "autodromo_hermanos_rodriguez"
function slugCompare(a: string, b: string): boolean {
  const strip = (s: string) =>
    normalizeSlug(s)
      .replace(/[-_]/g, '')
      .toLowerCase()
  return strip(a) === strip(b)
}

function getIlikeQueryFromSlug(slug: string): string {
  return slug
    .trim()
    .replace(/-+/g, '%')
    .replace(/_/g, '%') // Also treat underscores as word boundaries for tracks
    .replace(/%+/g, '%')
}

interface PageProps {
  params: Promise<{
    type: string
    slug: string
  }>
}

export default async function DynamicPage({ params }: PageProps) {
  const { type, slug } = await params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase public env vars are missing for DynamicPage')
    notFound()
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!)

  if (!['drivers', 'teams', 'tracks'].includes(type)) {
    notFound()
  }

  // Fetch the entity based on type
  let entity: any = null
  let relatedData: any = null

  if (type === 'drivers') {
    // Decode URL-encoded slug and normalize
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = normalizeSlug(decodedSlug)
    const ilikeQuery = getIlikeQueryFromSlug(decodedSlug)
    
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
      .eq('active', true)
      .ilike('name', `%${ilikeQuery}%`)

    const driver = drivers?.find(
      (d) => normalizeSlug(d.name) === normalizedSlug
    ) || drivers?.[0]

    entity = driver

  } else if (type === 'teams') {
    // Decode URL-encoded slug and normalize
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = normalizeSlug(decodedSlug)
    const ilikeQuery = getIlikeQueryFromSlug(decodedSlug)
    
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .eq('active', true)
      .ilike('name', `%${ilikeQuery}%`)

    const team = teams?.find(
      (t) => normalizeSlug(t.name) === normalizedSlug
    ) || teams?.[0]

    entity = team

    if (team) {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name, headshot_url, image_url, nationality')
        .eq('team_id', team.id)
        .eq('active', true)
        .order('name')

      relatedData = drivers || []

    }
  } else if (type === 'tracks') {
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = normalizeSlug(decodedSlug)

    // Use segments for accent-insensitive matching (e.g. "hermanos" matches "Hermanos Rodríguez")
    const segments = decodedSlug.split(/[-_]+/).filter((s) => s.length >= 2)
    const orFilters = segments.map((seg) => `name.ilike.%${seg}%`).join(',')
    const tracksQuery = supabase.from('tracks').select('*')
    const { data: tracks } = orFilters
      ? await tracksQuery.or(orFilters)
      : await tracksQuery

    const track =
      tracks?.find(
        (t) =>
          slugCompare(t.name, decodedSlug) ||
          getTrackSlug(t.name) === decodedSlug ||
          normalizeSlug(t.name) === normalizedSlug
      ) ??
      // Fallback: when multiple matches (e.g. "autodromo" matches Monza + Mexico), pick the one with most segment matches
      (tracks && segments.length > 0
        ? tracks.reduce((best, t) => {
            const nameLower = t.name.toLowerCase()
            const bestMatches = (best ? segments.filter((s) => nameLower.includes(s.toLowerCase())).length : 0)
            const tMatches = segments.filter((s) => nameLower.includes(s.toLowerCase())).length
            return tMatches > bestMatches ? t : best
          }, null as (typeof tracks)[0] | null)
        : null) ??
      tracks?.[0]

    entity = track
  }

  if (!entity) {
    notFound()
  }

  // Fetch track submissions by type (for tracks)
  let trackTips: any[] = []
  let trackStays: any[] = []
  let trackMeetups: any[] = []
  let trackTransit: any[] = []
  let trackEvents: Array<{ event_type: string; scheduled_at: string; duration_minutes: number | null }> = []

  if (type === 'tracks') {
    const currentSeason = new Date().getFullYear()
    const [submissionsRes, eventsRes] = await Promise.all([
      supabase
        .from('track_tips')
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
        .eq('track_id', entity.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      supabase
        .from('track_events')
        .select('event_type, scheduled_at, duration_minutes')
        .eq('track_id', entity.id)
        .eq('season_year', currentSeason)
        .order('scheduled_at', { ascending: true }),
    ])

    const allSubmissions = submissionsRes.data
    if (allSubmissions) {
      trackTips = allSubmissions.filter((s) => s.type === 'tips' || !s.type)
      trackStays = allSubmissions.filter((s) => s.type === 'stays')
      trackMeetups = allSubmissions.filter((s) => s.type === 'meetups')
      trackTransit = allSubmissions.filter((s) => s.type === 'transit')
    }

    if (eventsRes.data?.length) {
      trackEvents = eventsRes.data.map((row) => ({
        event_type: row.event_type ?? '',
        scheduled_at: row.scheduled_at ?? '',
        duration_minutes: row.duration_minutes ?? null,
      }))
    }
  }

  // Fetch discussion posts
  const { data: posts } = await supabase
    .from('posts')
    .select(
      `
      *,
      like_count,
      user:profiles!user_id (
        id,
        username,
        profile_image_url
      )
    `
    )
    .eq('parent_page_type', type === 'tracks' ? 'track' : type.slice(0, -1))
    .eq('parent_page_id', entity.id)
    .order('created_at', { ascending: false })

  // Get background image
  let backgroundImage: string | null | undefined
  if (type === 'drivers') {
    backgroundImage = entity.headshot_url || entity.image_url
  } else if (type === 'teams') {
    if (!supabaseUrl) {
      backgroundImage = entity.image_url
    } else {
      const backgroundUrl = getTeamBackgroundUrl(entity.name, supabaseUrl)
      backgroundImage = backgroundUrl || getTeamLogoUrl(entity.name, supabaseUrl)
    }
  } else if (type === 'tracks') {
    backgroundImage = '/images/entity_bg.png'
  } else {
    backgroundImage = entity.image_url
  }

  const trackSlugForHero = type === 'tracks' && entity?.name ? getTrackSlug(entity.name) : null

  // Determine entity type for components
  const entityType = type === 'tracks' ? 'track' : type === 'teams' ? 'team' : 'driver'

  // Track page: when race weekend has started, fetch check-ins and show CheckInSection
  let trackCheckIns: any[] = []
  let trackUserCheckIn: any = null
  const trackRaceWeekendActive = type === 'tracks' && entity && isRaceWeekendActive(entity)

  if (trackRaceWeekendActive && type === 'tracks' && entity) {
    const cookieStore = await cookies()
    const authClient = createServerComponentClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )
    const { data: { session } } = await authClient.auth.getSession()

    const { data: checkIns } = await supabase
      .from('race_checkins')
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
      .eq('track_id', entity.id)
      .order('created_at', { ascending: false })

    trackCheckIns = checkIns ?? []

    if (session) {
      const { data: userCheckIn } = await supabase
        .from('race_checkins')
        .select('*')
        .eq('track_id', entity.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      trackUserCheckIn = userCheckIn
    }
  }

  // Build tabs based on entity type
  const tabs = []
  
  if (type === 'tracks') {
    tabs.push({
      id: 'tips',
      label: 'Tips',
      content: (
        <TrackTipsTab
          trackTips={trackTips}
          trackStays={trackStays}
          trackTransit={trackTransit}
        />
      ),
    })
    tabs.push({
      id: 'meetups',
      label: 'Meetups',
      content: (
        <DiscussionTab
          posts={posts || []}
          parentPageType="track"
          parentPageId={entity.id}
        />
      ),
    })
    tabs.push({
      id: 'schedule',
      label: 'Schedule',
      content: (
        <TrackScheduleTab
          events={trackEvents}
          track={
            type === 'tracks' && entity
              ? {
                  start_date: entity.start_date,
                  end_date: entity.end_date,
                  name: entity.name,
                  location: entity.location,
                  country: entity.country,
                }
              : null
          }
        />
      ),
    })
  } else if (type === 'teams') {
    tabs.push({
      id: 'discussion',
      label: 'Discussion',
      content: (
        <DiscussionTab
          posts={posts || []}
          parentPageType="team"
          parentPageId={entity.id}
        />
      ),
    })
    tabs.push({
      id: 'drivers',
      label: 'Drivers',
      content: <TeamDriversTab drivers={relatedData || []} />,
    })
  } else {
    // Drivers: no tabs; only Discussions section is rendered below
  }

  return (
    <div className="relative min-h-screen -mt-14">
      {/* Top Section with Background Image - extends to top of view */}
      <div className="relative z-10 h-[60vh] min-h-[60vh] pt-14">
        {/* Hero Background */}
        <EntityHeroBackground
          imageUrl={backgroundImage}
          alt={entity.name}
          entityType={entityType}
          entityId={entity.id}
          trackSlug={trackSlugForHero ?? undefined}
          trackName={type === 'tracks' ? entity.name : undefined}
          supabaseUrl={type === 'tracks' || type === 'teams' ? supabaseUrl : undefined}
          teamName={type === 'teams' ? entity.name : undefined}
          teamOverviewText={type === 'teams' ? (entity as { overview_text?: string | null }).overview_text : undefined}
        />
        
        {/* Content over background */}
        <div className="relative z-10 h-full flex flex-col">
          <div className="shrink-0 pt-2 px-4">
            
            {/* Track title at top: Title, under -> Flag, City, Country */}
            {type === 'tracks' && (
              <div className="mb-4 text-white">
                <h1 className="font-display text-2xl tracking-wider sm:text-3xl md:text-4xl">
                  {entity.name}
                </h1>
                <div className="mt-2 flex items-center gap-2 font-sans text-sm text-white/90 sm:text-base">
                  {getCountryFlagPath(entity.country) && (
                    <Image
                      src={getCountryFlagPath(entity.country)!}
                      alt={entity.country || 'Flag'}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  )}
                  <span>
                    {[entity.location, entity.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}
            <PageBackButton variant="dark" />
          </div>

          {/* Entity Header - Positioned at bottom */}
          <EntityHeaderWrapper
            type={entityType}
            entity={entity}
            drivers={type === 'teams' ? relatedData : undefined}
            supabaseUrl={supabaseUrl}
          />
        </div>
      </div>

      {/* Overview Section - Black background, above tabs (tracks + drivers) */}
      {(type === 'tracks' || type === 'drivers') && (
        <div className="relative z-20 w-full overflow-visible bg-black">
          {type === 'tracks' && (
            <EntityOverview
              type="track"
              entity={{
                laps: entity.laps,
                overview_text: entity.overview_text,
              }}
            />
          )}
          {type === 'drivers' && (
            <EntityOverview
              type="driver"
              entity={{
                name: entity.name,
                racing_number: entity.racing_number,
                overview_text: (entity as { overview_text?: string | null }).overview_text ?? null,
              }}
            />
          )}
        </div>
      )}

      {/* Tabs Section */}
      <div className="relative z-20 bg-[#000000] min-h-[30vh]">
        <div className="mx-auto max-w-7xl px-6">
          {/* Race check-in: track page when race weekend has started */}
          {trackRaceWeekendActive && type === 'tracks' && entity && (
            <div className="pt-6 pb-4">
              <CheckInSection
                trackId={entity.id}
                raceName={entity.name}
                userCheckIn={trackUserCheckIn}
                checkIns={trackCheckIns}
              />
            </div>
          )}
          {type === 'drivers' ? (
            <div className="sticky top-[10vh] z-30 bg-black pt-8">
              <h2 className="mb-6 px-4 text-2xl text-right font-semibold capitalize text-white font-sageva tracking-wider">Discussions</h2>
              <DiscussionTab
                posts={posts || []}
                parentPageType="driver"
                parentPageId={entity.id}
              />
            </div>
          ) : (
            <EntityTabs tabs={tabs} />
          )}
        </div>
      </div>
    </div>
  )
}
