import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PollList } from '@/components/polls/poll-list'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PollsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: async() => cookieStore })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Fetch all polls
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
      // Count votes per option per poll
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Polls</h1>
        <p className="mt-2 text-gray-600">
          Share your opinion on F1 topics and see what the community thinks
        </p>
      </div>

      <PollList polls={polls || []} userResponses={userResponses} voteCounts={voteCounts} />
    </div>
  )
}

