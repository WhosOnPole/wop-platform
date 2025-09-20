import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserVotedPoll {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  voted_at: string;
  selected_option: {
    id: string;
    label: string;
  };
}

interface UserFanPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  status: string;
}

export const useUserVotedPolls = (userId: string) => {
  return useQuery({
    queryKey: ["user-voted-polls", userId],
    queryFn: async (): Promise<UserVotedPoll[]> => {
      const { data, error } = await supabase
        .from("votes")
        .select(`
          created_at,
          polls!inner (
            id,
            title,
            type,
            status,
            created_at
          ),
          poll_options!inner (
            id,
            label
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching user voted polls:", error);
        throw error;
      }

      return (data || []).map((vote: any) => ({
        id: vote.polls.id,
        title: vote.polls.title,
        type: vote.polls.type,
        status: vote.polls.status,
        created_at: vote.polls.created_at,
        voted_at: vote.created_at,
        selected_option: {
          id: vote.poll_options.id,
          label: vote.poll_options.label,
        },
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
};

export const useUserFanPosts = (userId: string) => {
  return useQuery({
    queryKey: ["user-fan-posts", userId],
    queryFn: async (): Promise<UserFanPost[]> => {
      const { data, error } = await supabase
        .from("fan_posts")
        .select("*")
        .eq("author_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user fan posts:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
};