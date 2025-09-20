import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Poll {
  id: string;
  title: string;
  status: string;
  type: string;
  created_at: string;
  vote_count: number;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  label: string;
  vote_count: number;
  percentage: number;
}

export const usePolls = (limit = 3) => {
  return useQuery({
    queryKey: ["polls", limit],
    queryFn: async (): Promise<Poll[]> => {
      // Get polls with their options and vote counts
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
        .order("created_at", { ascending: false })
        .limit(limit);

      if (pollsError) {
        console.error("Error fetching polls:", pollsError);
        throw pollsError;
      }

      if (!polls) return [];

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
              })) || []
            };
          }

          const totalVotes = votes?.length || 0;
          
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
            options: optionsWithVotes
          };
        })
      );

      return pollsWithVotes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};