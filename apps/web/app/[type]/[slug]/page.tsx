import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { EntityHeroBackground } from '@/components/entity/entity-hero-background'
import { EntityHeaderWrapper } from '@/components/entity/entity-header-wrapper'
import { PageBackButton } from '@/components/page-back-button'
import { EntityOverview } from '@/components/entity/entity-overview'
import { EntityImageGallery } from '@/components/entity/entity-image-gallery'
import { EntityTabs } from '@/components/entity/entity-tabs'
import { TrackSubmissionsTab } from '@/components/entity/tabs/track-submissions-tab'
import { StatsTab } from '@/components/entity/tabs/stats-tab'
import { TeamDriversTab } from '@/components/entity/tabs/team-drivers-tab'
import { DiscussionTab } from '@/components/entity/tabs/discussion-tab'
import { CheckInSection } from '@/components/race/check-in-section'
import { getRecentInstagramMedia } from '@/services/instagram'
import { getInstagramUsernameFromEmbed } from '@/utils/instagram'
import { getTeamLogoUrl, getTeamBackgroundUrl, getTeamIconUrl, getTrackSlug } from '@/utils/storage-urls'
import { isRaceWeekendActive } from '@/utils/race-weekend'

export const runtime = 'nodejs'
export const revalidate = 3600 // Revalidate every hour

// Normalize accented characters and create slug
function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
}

function getIlikeQueryFromSlug(slug: string): string {
  return slug
    .trim()
    .replace(/-+/g, '%')
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
  let instagramPosts: Array<{ id: string; href: string; imageUrl: string }> = []

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

    if (driver?.instagram_url) {
      const parsed = getInstagramUsernameFromEmbed({ embedHtml: driver.instagram_url })
      if (parsed?.username) {
        try {
          instagramPosts = await getRecentInstagramMedia({ username: parsed.username, limit: 20 })
        } catch (err) {
          console.error('Failed to load Instagram posts', err)
        }
      }
    }
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

      // Fetch Instagram posts if possible
      if (team.instagram_url) {
        const parsed = getInstagramUsernameFromEmbed({ embedHtml: team.instagram_url })
        if (parsed?.username) {
          try {
            instagramPosts = await getRecentInstagramMedia({ username: parsed.username, limit: 20 })
          } catch (err) {
            console.error('Failed to load Instagram posts', err)
          }
        }
      }
    }
  } else if (type === 'tracks') {
    // Decode URL-encoded slug and normalize
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = normalizeSlug(decodedSlug)
    const ilikeQuery = getIlikeQueryFromSlug(decodedSlug)
    
    const { data: tracks } = await supabase
      .from('tracks')
      .select('*')
      .ilike('name', `%${ilikeQuery}%`)

    const track = tracks?.find(
      (t) => normalizeSlug(t.name) === normalizedSlug
    ) || tracks?.[0]

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

  if (type === 'tracks') {
    const { data: allSubmissions } = await supabase
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
      .order('created_at', { ascending: false })

    if (allSubmissions) {
      trackTips = allSubmissions.filter((s) => s.type === 'tips' || !s.type)
      trackStays = allSubmissions.filter((s) => s.type === 'stays')
      trackMeetups = allSubmissions.filter((s) => s.type === 'meetups')
      trackTransit = allSubmissions.filter((s) => s.type === 'transit')
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

  // Collect images for gallery
  const galleryImages: string[] = []
  
  // Admin images first
  if (entity.admin_images && Array.isArray(entity.admin_images)) {
    galleryImages.push(...entity.admin_images.filter((url: string) => url))
  }

  // Then user submission images (tracks) or Instagram (teams/drivers)
  if (type === 'tracks') {
    const allSubmissions = [...trackTips, ...trackStays, ...trackMeetups, ...trackTransit]
    const submissionImages = allSubmissions
      .map((s) => s.image_url)
      .filter((url): url is string => Boolean(url))
    galleryImages.push(...submissionImages)
  } else {
    // Teams and drivers: Instagram images
    const instagramImages = instagramPosts.map((p) => p.imageUrl)
    galleryImages.push(...instagramImages)
  }

  // Get background image
  let backgroundImage: string | null | undefined
  if (type === 'drivers') {
    backgroundImage = entity.headshot_url || entity.image_url
  } else if (type === 'teams') {
    if (!supabaseUrl) {
      backgroundImage = entity.image_url
    } else {
      const backgroundUrl = getTeamBackgroundUrl(entity.name, supabaseUrl)
      const logoUrl = getTeamLogoUrl(entity.name, supabaseUrl)
      try {
        const headRes = await fetch(backgroundUrl, { method: 'HEAD' })
        backgroundImage = headRes.ok ? backgroundUrl : logoUrl
      } catch {
        backgroundImage = logoUrl
      }
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
      label: 'General tips',
      content: <TrackSubmissionsTab submissions={trackTips} typeLabel="General tips" />,
    })
    tabs.push({
      id: 'stays',
      label: 'Stay tips',
      content: <TrackSubmissionsTab submissions={trackStays} typeLabel="Stay tips" />,
    })
    tabs.push({
      id: 'transit',
      label: 'Transit tips',
      content: <TrackSubmissionsTab submissions={trackTransit} typeLabel="Transit tips" />,
    })
    tabs.push({
      id: 'meetups',
      label: 'Meetups',
      content: <TrackSubmissionsTab submissions={trackMeetups} typeLabel="Meetups" />,
    })
  } else if (type === 'teams') {
    tabs.push({
      id: 'stats',
      label: 'Stats',
      content: <StatsTab type="team" stats={entity} />,
    })
    tabs.push({
      id: 'drivers',
      label: 'Drivers',
      content: <TeamDriversTab drivers={relatedData || []} />,
    })
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
  } else {
    // Drivers
    tabs.push({
      id: 'stats',
      label: 'Stats',
      content: <StatsTab type="driver" stats={entity} />,
    })
    tabs.push({
      id: 'discussion',
      label: 'Discussion',
      content: (
        <DiscussionTab
          posts={posts || []}
          parentPageType="driver"
          parentPageId={entity.id}
        />
      ),
    })
  }

  return (
    <div className="relative min-h-screen">
      {/* Top Section with Background Image - in flow */}
      <div className="relative z-10 h-[40vh] min-h-[40vh]">
        {/* Hero Background */}
        <EntityHeroBackground
          imageUrl={backgroundImage}
          alt={entity.name}
          entityType={entityType}
          entityId={entity.id}
          trackSlug={trackSlugForHero ?? undefined}
          trackName={type === 'tracks' ? entity.name : undefined}
          supabaseUrl={type === 'tracks' || type === 'teams' ? supabaseUrl : undefined}
          teamDrivers={type === 'teams' ? relatedData : undefined}
        />
        
        {/* Content over background */}
        <div className="relative z-10 h-full flex flex-col">
          <div className="shrink-0 pt-4 px-4">
            <PageBackButton variant="dark" />
          </div>
          {/* Overview (Tracks only) */}
          {type === 'tracks' && <EntityOverview overviewText={entity.overview_text} />}

          {/* Image Gallery */}
          <EntityImageGallery images={galleryImages} />

          {/* Entity Header - Positioned at bottom */}
          <EntityHeaderWrapper
            type={entityType}
            entity={entity}
            drivers={type === 'teams' ? relatedData : undefined}
            supabaseUrl={supabaseUrl}
          />
        </div>
      </div>

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
          <EntityTabs tabs={tabs} />
        </div>
      </div>
    </div>
  )
}
