import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EnhancedPoll {
  id: string;
  title: string;
  status: string;
  type: string;
  created_at: string;
  vote_count: number;
  options: PollOption[];
  user_voted: boolean;
  user_selected_option?: string;
}

export interface PollOption {
  id: string;
  label: string;
  vote_count: number;
  percentage: number;
}

export const useEnhancedPolls = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enhanced-polls", limit, user?.id],
    queryFn: async (): Promise<EnhancedPoll[]> => {
      // Get recent polls (both active and recently closed)
      const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: polls, error: pollsError } = await supabase
        .from("polls")
        .select(`
          id,
          title,
          status,
          type,
          created_at,
          poll_options (
            id,
            label
          )
        `)
        .in("status", ["live", "closed"])
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (pollsError) {
        console.error("Error fetching polls:", pollsError);
        throw pollsError;
      }

      if (!polls) return [];

      // Get user's votes if authenticated
      let userVotes: any[] = [];
      if (user) {
        const { data: votes } = await supabase
          .from("votes")
          .select("poll_id, option_id, poll_options!inner(label)")
          .eq("user_id", user.id);
        
        userVotes = votes || [];
      }

      // Get vote counts for each poll
      const pollsWithVotes = await Promise.all(
        polls.map(async (poll) => {
          const { data: votes, error: votesError } = await supabase
            .from("votes")
            .select("option_id")
            .eq("poll_id", poll.id);

          if (votesError) {
            console.error("Error fetching votes:", votesError);
            return {
              ...poll,
              vote_count: 0,
              options: poll.poll_options?.map(option => ({
                ...option,
                vote_count: 0,
                percentage: 0
              })) || [],
              user_voted: false
            };
          }

          const totalVotes = votes?.length || 0;
          const userVote = userVotes.find(v => v.poll_id === poll.id);
          
          // Calculate vote counts and percentages for each option
          const optionsWithVotes = poll.poll_options?.map(option => {
            const optionVotes = votes?.filter(vote => vote.option_id === option.id).length || 0;
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            
            return {
              ...option,
              vote_count: optionVotes,
              percentage
            };
          }) || [];

          return {
            ...poll,
            vote_count: totalVotes,
            options: optionsWithVotes,
            user_voted: !!userVote,
            user_selected_option: userVote?.poll_options?.label
          };
        })
      );

      return pollsWithVotes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};