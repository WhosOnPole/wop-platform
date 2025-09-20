import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedFanPost {
  id: string;
  author_id: string;
  image_url: string;
  caption: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  is_spotlight?: boolean;
  like_count: number;
  comment_count: number;
  engagement_score: number;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useEnhancedFanPosts = (limit = 15, days = 14) => {
  return useQuery({
    queryKey: ["enhanced-fan-posts", limit, days],
    queryFn: async (): Promise<EnhancedFanPost[]> => {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get approved fan posts from the last X days
      const { data: posts, error } = await supabase
        .from("fan_posts")
        .select("*")
        .eq("status", "approved")
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false })
        .limit(limit * 2); // Get more to filter by engagement

      if (error) {
        console.error("Error fetching fan posts:", error);
        return [];
      }

      if (!posts || posts.length === 0) {
        return [];
      }

      // Fetch engagement metrics and profiles for each post
      const postsWithEngagement = await Promise.all(
        posts.map(async (post) => {
          // Get like count
          const { count: likeCount } = await supabase
            .from("fan_post_likes")
            .select("*", { count: "exact", head: true })
            .eq("fan_post_id", post.id);

          // Get comment count  
          const { count: commentCount } = await supabase
            .from("fan_post_comments")
            .select("*", { count: "exact", head: true })
            .eq("fan_post_id", post.id)
            .eq("status", "approved");

          // Get author profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", post.author_id)
            .single();

          const likes = likeCount || 0;
          const comments = commentCount || 0;
          const engagementScore = (likes * 2) + comments;

          return {
            ...post,
            like_count: likes,
            comment_count: comments,
            engagement_score: engagementScore,
            profiles: profile || null
          } as EnhancedFanPost;
        })
      );

      // Sort by engagement score (descending) and then by creation date
      return postsWithEngagement
        .sort((a, b) => {
          if (a.engagement_score !== b.engagement_score) {
            return b.engagement_score - a.engagement_score;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};