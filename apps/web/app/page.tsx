import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

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

  // If logged in, check onboarding status
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .maybeSingle()

    // If no username, redirect to onboarding
    if (!profile?.username) {
      redirect('/onboarding')
    }

    // Otherwise redirect to feed
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
      <div className="flex h-screen">
        {/* Left Panel - Login/Create Account (1/3) */}
        <div className="hidden lg:flex lg:w-1/3 bg-foundation-black flex-col items-center justify-center p-12">
          <div className="w-full max-w-sm space-y-8">
            <Logo variant="gradient" size="md" href="/" className="mx-auto w-full" />
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
        <div className="w-full lg:w-2/3 m-0 p-0">
          {/* Hero Section */}
          <section className="relative min-h-[100vh] flex flex-row overflow-hidden m-0 p-0">
            {/* Background Image - Flush with top */}
            <Image
              src="/images/backsplash.png"
              alt="Backsplash"
              fill
              className="object-cover object-top"
              style={{ top: 0, left: 0 }}
              priority
            />
            {/* Content Overlay */}
            <div className="relative z-10 h-full w-full text-center max-w-3xl mx-auto text-white flex flex-col items-center justify-center px-10 pt-8">
              <Logo variant="white" size="lg" href="/" className="mx-auto mb-8" />
              <h1 className="font-secondary text-xl lg:text-3xl mb-6">
                Building community. Highlighting fan stories. Making a space for women in the world of F1.
              </h1>
              <p className="text-sm lg:text-lg mb-8 leading-relaxed">
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
        </div>
      </div>
    </div>
  )
}
