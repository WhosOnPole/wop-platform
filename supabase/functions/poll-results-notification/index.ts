import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pollId } = await req.json();

    if (!pollId) {
      throw new Error('Poll ID is required');
    }

    console.log(`Notifying poll results for poll: ${pollId}`);

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new Error(`Poll not found: ${pollError?.message}`);
    }

    // Get all users who voted in this poll
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('user_id')
      .eq('poll_id', pollId);

    if (votesError) {
      throw new Error(`Error fetching votes: ${votesError.message}`);
    }

    if (!votes || votes.length === 0) {
      console.log('No votes found for this poll');
      return new Response(
        JSON.stringify({ message: 'No votes found for this poll' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique user IDs who voted
    const userIds = [...new Set(votes.map(vote => vote.user_id))];

    console.log(`Found ${userIds.length} users who voted in this poll`);

    // Create notifications for all users who voted
    const notifications = userIds.map(userId => ({
      user_id: userId,
      kind: 'poll_results',
      payload: {
        poll_id: pollId,
        poll_title: poll.title
      }
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      throw new Error(`Error creating notifications: ${notificationError.message}`);
    }

    console.log(`Successfully created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        message: `Notifications sent to ${notifications.length} users`,
        poll_title: poll.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in poll-results-notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});