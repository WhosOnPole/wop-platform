import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, number>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Rate limiting check (1 vote per second per user)
    const rateLimitKey = user.id
    const now = Date.now()
    const lastVote = rateLimitStore.get(rateLimitKey) || 0
    
    if (now - lastVote < 1000) {
      console.log('Rate limit exceeded for user:', user.id)
      return new Response(
        JSON.stringify({ error: 'Please wait before voting again' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { poll_id, option_id } = await req.json()
    
    if (!poll_id || !option_id) {
      return new Response(
        JSON.stringify({ error: 'poll_id and option_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing vote for user:', user.id, 'poll:', poll_id, 'option:', option_id)

    // Verify poll exists and is live
    const { data: poll, error: pollError } = await supabaseClient
      .from('polls')
      .select('id, status')
      .eq('id', poll_id)
      .single()

    if (pollError || !poll) {
      console.error('Poll not found:', pollError)
      return new Response(
        JSON.stringify({ error: 'Poll not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (poll.status !== 'live') {
      return new Response(
        JSON.stringify({ error: 'Poll is not accepting votes' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify option exists for this poll
    const { data: option, error: optionError } = await supabaseClient
      .from('poll_options')
      .select('id')
      .eq('id', option_id)
      .eq('poll_id', poll_id)
      .single()

    if (optionError || !option) {
      console.error('Option not found:', optionError)
      return new Response(
        JSON.stringify({ error: 'Invalid option for this poll' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for existing vote
    const { data: existingVote } = await supabaseClient
      .from('votes')
      .select('id, option_id')
      .eq('poll_id', poll_id)
      .eq('user_id', user.id)
      .maybeSingle()

    let voteResult
    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabaseClient
        .from('votes')
        .update({ option_id })
        .eq('id', existingVote.id)
        .select()
        .single()
      
      voteResult = { data, error }
      console.log('Updated existing vote')
    } else {
      // Create new vote
      const { data, error } = await supabaseClient
        .from('votes')
        .insert({
          poll_id,
          option_id,
          user_id: user.id
        })
        .select()
        .single()
      
      voteResult = { data, error }
      console.log('Created new vote')
    }

    if (voteResult.error) {
      console.error('Vote operation failed:', voteResult.error)
      return new Response(
        JSON.stringify({ error: 'Failed to cast vote' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update rate limit store
    rateLimitStore.set(rateLimitKey, now)

    // Get updated vote counts for all options in this poll
    const { data: allVotes, error: countError } = await supabaseClient
      .from('votes')
      .select('option_id')
      .eq('poll_id', poll_id)

    if (countError) {
      console.error('Error fetching vote counts:', countError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch updated counts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate vote counts per option
    const voteCounts = (allVotes || []).reduce((acc, vote) => {
      acc[vote.option_id] = (acc[vote.option_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0)

    console.log('Vote cast successfully, returning counts:', voteCounts)

    return new Response(
      JSON.stringify({
        success: true,
        vote: voteResult.data,
        voteCounts,
        totalVotes,
        updated: existingVote ? 'updated' : 'created'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})