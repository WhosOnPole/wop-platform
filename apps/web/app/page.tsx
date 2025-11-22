import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { FeaturedGrid } from '@/components/home/featured-grid'
import { WinnersPodium } from '@/components/home/winners-podium'
import { FeaturedNews } from '@/components/home/featured-news'
import { FeaturedSponsor } from '@/components/home/featured-sponsor'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If logged in, redirect to logged-in home
  if (session) {
    redirect('/feed')
  }

  const weekStart = await getCurrentWeekStart()

  // Fetch featured content
  const [
    weeklyHighlights,
    topUsers,
    featuredNews,
    weeklyHighlightsFull,
  ] = await Promise.all([
    // Weekly highlights - fetch separately to avoid type issues
    (async () => {
      const { data: highlights } = await supabase
        .from('weekly_highlights')
        .select('highlighted_fan_id, highlighted_sponsor_id')
        .eq('week_start_date', weekStart)
        .single()

      if (highlights) {
        const [fan, sponsor] = await Promise.all([
          highlights.highlighted_fan_id
            ? supabase
                .from('profiles')
                .select('id, username, profile_image_url')
                .eq('id', highlights.highlighted_fan_id)
                .single()
            : Promise.resolve({ data: null }),
          highlights.highlighted_sponsor_id
            ? supabase
                .from('sponsors')
                .select('*')
                .eq('id', highlights.highlighted_sponsor_id)
                .single()
            : Promise.resolve({ data: null }),
        ])
        return {
          data: {
            highlighted_fan: fan.data,
            highlighted_sponsor: sponsor.data,
          },
        }
      }
      return { data: null }
    })(),
    // Top 3 users by points
    supabase
      .from('profiles')
      .select('id, username, profile_image_url, points')
      .order('points', { ascending: false })
      .limit(3),
    // Featured news story
    supabase
      .from('news_stories')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    // Full weekly highlights for sponsor
    (async () => {
      const { data: highlights } = await supabase
        .from('weekly_highlights')
        .select('highlighted_fan_id, highlighted_sponsor_id')
        .eq('week_start_date', weekStart)
        .single()

      if (highlights?.highlighted_sponsor_id) {
        const { data: sponsor } = await supabase
          .from('sponsors')
          .select('*')
          .eq('id', highlights.highlighted_sponsor_id)
          .single()
        return sponsor
      }
      return null
    })(),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Split Layout */}
      <div className="hidden lg:flex lg:h-screen lg:overflow-hidden">
        {/* Left Panel - Login/Create Account (1/3) */}
        <div className="w-1/3 bg-foundation-black flex flex-col items-center justify-center p-12">
          <div className="w-full max-w-sm space-y-8">
            <Logo variant="gradient" size="lg" href="/" className="mx-auto" />
            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full rounded-full bg-white px-6 py-3 text-center text-base font-medium text-foundation-black transition-colors hover:bg-gray-100"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block w-full rounded-full border-2 border-white px-6 py-3 text-center text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>
            <p className="text-center text-sm text-gray-400">
              Join the F1 fan community
            </p>
          </div>
        </div>

        {/* Right Panel - Scrollable Content (2/3) */}
        <div className="w-2/3 overflow-y-auto">
          {/* Hero Section */}
          <section
            className="relative min-h-[80vh] flex flex-col items-center justify-center p-0"
            style={{
              backgroundImage: "url('/images/backsplash.png')",
              backgroundSize: '200%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="relative z-10 text-center max-w-3xl text-white p-16">
              <Logo variant="white" size="lg" href="/" className="mx-auto mb-8" />
              <h1 className="font-secondary text-3xl mb-6">
                Building community. Highlighting fan stories. Making a space for women in the world of F1.
              </h1>
              <p className="text-lg mb-8 leading-relaxed">
                Follow now to be a part of a racing community where no one will accuse you of being a &quot;Drive to Survive&quot; fan.
                <br />
                <br />
                Build your dream grid, connect with fans, chat during race weekends, and so much more!
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-full bg-foundation-black px-8 py-4 text-lg font-bold italic text-white transition-colors hover:bg-foundation-black/90"
              >
                Join Us!
              </Link>
            </div>
          </section>

          {/* Featured Grid Section */}
          {weeklyHighlights.data?.highlighted_fan && (
            <section className="py-12 px-8 bg-white">
              <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-racing-orange" />
                  <h2 className="font-display text-2xl font-bold text-foundation-black">
                    Featured Fan of the Week
                  </h2>
                </div>
                <FeaturedGrid
                  highlightedFan={weeklyHighlights.data.highlighted_fan as {
                    id: string
                    username: string
                    profile_image_url: string | null
                  }}
                />
              </div>
            </section>
          )}

          {/* Week's Winners Podium */}
          {topUsers.data && topUsers.data.length > 0 && (
            <section className="py-12 px-8 bg-gray-50">
              <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-racing-orange" />
                  <h2 className="font-display text-2xl font-bold text-foundation-black">
                    Week&apos;s Winners Podium
                  </h2>
                </div>
                <WinnersPodium
                  users={
                    (topUsers.data as Array<{
                      id: string
                      username: string
                      profile_image_url: string | null
                      points: number
                    }>) || []
                  }
                />
              </div>
            </section>
          )}

          {/* Featured News/Sponsor Section */}
          {(featuredNews.data || weeklyHighlightsFull) && (
            <section className="py-12 px-8 bg-white">
              <div className="mx-auto max-w-7xl space-y-8">
                {featuredNews.data && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foundation-black mb-6">
                      Featured News
                    </h2>
                    <FeaturedNews newsStory={featuredNews.data} />
                  </div>
                )}
                {weeklyHighlightsFull && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foundation-black mb-6">
                      Featured Sponsor
                    </h2>
                    <FeaturedSponsor sponsor={weeklyHighlightsFull} />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/backsplash.png')",
              backgroundSize: '200%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="relative z-10 text-center max-w-2xl">
            <Logo variant="white" size="lg" href="/" className="mx-auto mb-8" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
              Building community. Highlighting fan stories. Making a space for women in the world of F1.
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-8 leading-relaxed">
              Follow now to be a part of a racing community where no one will accuse you of being a &quot;Drive to Survive&quot; fan.
              <br />
              <br />
              Build your dream grid, connect with fans, chat during race weekends, and so much more!
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-foundation-black px-8 py-4 text-lg font-bold italic text-white transition-colors hover:bg-foundation-black/90"
            >
              Join Us!
            </Link>
          </div>
        </section>

        {/* Featured Grid Section */}
        {weeklyHighlights.data?.highlighted_fan && (
          <section className="py-12 px-6 bg-white">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-racing-orange" />
                <h2 className="font-display text-2xl font-bold text-foundation-black">
                  Featured Fan of the Week
                </h2>
              </div>
              <FeaturedGrid
                highlightedFan={weeklyHighlights.data.highlighted_fan as {
                  id: string
                  username: string
                  profile_image_url: string | null
                }}
              />
            </div>
          </section>
        )}

        {/* Week's Winners Podium */}
        {topUsers.data && topUsers.data.length > 0 && (
          <section className="py-12 px-6 bg-gray-50">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-racing-orange" />
                <h2 className="font-display text-2xl font-bold text-foundation-black">
                  Week&apos;s Winners Podium
                </h2>
              </div>
              <WinnersPodium
                users={
                  (topUsers.data as Array<{
                    id: string
                    username: string
                    profile_image_url: string | null
                    points: number
                  }>) || []
                }
              />
            </div>
          </section>
        )}

        {/* Featured News/Sponsor Section */}
        {(featuredNews.data || weeklyHighlightsFull) && (
          <section className="py-12 px-6 bg-white">
            <div className="mx-auto max-w-7xl space-y-8">
              {featuredNews.data && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-foundation-black mb-6">
                    Featured News
                  </h2>
                  <FeaturedNews newsStory={featuredNews.data} />
                </div>
              )}
              {weeklyHighlightsFull && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-foundation-black mb-6">
                    Featured Sponsor
                  </h2>
                  <FeaturedSponsor sponsor={weeklyHighlightsFull} />
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
