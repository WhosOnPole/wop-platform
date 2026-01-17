import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { PollList } from '@/components/polls/poll-list'
import { PollRail } from '@/components/polls/poll-rail'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PodiumsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: polls } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch user's poll responses if logged in
  let userResponses: Record<string, string> = {}
  if (session) {
    const { data: responses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .eq('user_id', session.user.id)

    if (responses) {
      userResponses = responses.reduce(
        (acc, r) => {
          acc[r.poll_id] = r.selected_option_id
          return acc
        },
        {} as Record<string, string>
      )
    }
  }

  // Fetch vote counts for all polls
  const pollIds = polls?.map((p) => p.id) || []
  let voteCounts: Record<string, Record<string, number>> = {}

  if (pollIds.length > 0) {
    const { data: allResponses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .in('poll_id', pollIds)

    if (allResponses) {
      voteCounts = allResponses.reduce(
        (acc, response) => {
          if (!acc[response.poll_id]) {
            acc[response.poll_id] = {}
          }
          acc[response.poll_id][response.selected_option_id] =
            (acc[response.poll_id][response.selected_option_id] || 0) + 1
          return acc
        },
        {} as Record<string, Record<string, number>>
      )
    }
  }

  const featuredPolls = (polls || []).filter((p) => p.is_featured_podium)
  const communityPolls = (polls || []).filter((p) => !p.is_featured_podium)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Podiums</h1>
        <p className="text-gray-600">
          Vote on community polls and see featured picks from the admins.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Featured Podiums</h2>
            <p className="text-sm text-gray-600">Admin-curated polls</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            curated
          </span>
        </div>
        {featuredPolls.length > 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <PollRail
              polls={featuredPolls}
              userResponses={userResponses}
              voteCounts={voteCounts}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No featured podiums yet.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Community Podiums</h2>
            <p className="text-sm text-gray-600">Polls created by the community</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            community
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <PollList
            polls={communityPolls}
            userResponses={userResponses}
            voteCounts={voteCounts}
          />
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            TODO: Replace with infinite scroll (see todo-infinite-scroll)
          </div>
        </div>
      </section>
    </div>
  )
}
