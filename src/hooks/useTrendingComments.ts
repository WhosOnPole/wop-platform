import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  entity_type: 'driver' | 'team' | 'team_principal' | 'track';
  entity_id: string;
  entity_name: string;
  like_count: number;
  reply_count: number;
  engagement_score: number;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useTrendingComments = (limit = 5, days = 7) => {
  return useQuery({
    queryKey: ["trending-comments", limit, days],
    queryFn: async (): Promise<TrendingComment[]> => {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const comments: TrendingComment[] = [];

      // Driver comments
      const { data: driverComments } = await supabase
        .from("driver_comments")
        .select(`
          id, content, created_at, author_id, driver_id,
          profiles!driver_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (driverComments) {
        for (const comment of driverComments) {
          // Get like count
          const { count: likeCount } = await supabase
            .from("driver_comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          // Get reply count
          const { count: replyCount } = await supabase
            .from("driver_comment_replies")
            .select("*", { count: "exact", head: true })
            .eq("parent_comment_id", comment.id)
            .eq("status", "approved");

          // Get driver name
          const { data: driver } = await supabase
            .from("drivers")
            .select("name")
            .eq("id", comment.driver_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;
          const engagementScore = (likes * 2) + replies;

          if (engagementScore >= 3) {
            comments.push({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_id: comment.author_id,
              entity_type: 'driver',
              entity_id: comment.driver_id,
              entity_name: driver?.name || 'Unknown Driver',
              like_count: likes,
              reply_count: replies,
              engagement_score: engagementScore,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Team comments
      const { data: teamComments } = await supabase
        .from("team_comments")
        .select(`
          id, content, created_at, author_id, team_id,
          profiles!team_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (teamComments) {
        for (const comment of teamComments) {
          const { count: likeCount } = await supabase
            .from("team_comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          const { count: replyCount } = await supabase
            .from("team_comment_replies")
            .select("*", { count: "exact", head: true })
            .eq("parent_comment_id", comment.id)
            .eq("status", "approved");

          const { data: team } = await supabase
            .from("teams")
            .select("name")
            .eq("id", comment.team_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;
          const engagementScore = (likes * 2) + replies;

          if (engagementScore >= 3) {
            comments.push({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_id: comment.author_id,
              entity_type: 'team',
              entity_id: comment.team_id,
              entity_name: team?.name || 'Unknown Team',
              like_count: likes,
              reply_count: replies,
              engagement_score: engagementScore,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Team Principal comments
      const { data: tpComments } = await supabase
        .from("team_principal_comments")
        .select(`
          id, content, created_at, author_id, team_principal_id,
          profiles!team_principal_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (tpComments) {
        for (const comment of tpComments) {
          const { count: likeCount } = await supabase
            .from("team_principal_comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          const { count: replyCount } = await supabase
            .from("team_principal_comment_replies")
            .select("*", { count: "exact", head: true })
            .eq("parent_comment_id", comment.id)
            .eq("status", "approved");

          const { data: tp } = await supabase
            .from("team_principals")
            .select("name")
            .eq("id", comment.team_principal_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;
          const engagementScore = (likes * 2) + replies;

          if (engagementScore >= 3) {
            comments.push({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_id: comment.author_id,
              entity_type: 'team_principal',
              entity_id: comment.team_principal_id,
              entity_name: tp?.name || 'Unknown Team Principal',
              like_count: likes,
              reply_count: replies,
              engagement_score: engagementScore,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Track comments
      const { data: trackComments } = await supabase
        .from("track_comments")
        .select(`
          id, content, created_at, author_id, track_id,
          profiles!track_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (trackComments) {
        for (const comment of trackComments) {
          const { count: likeCount } = await supabase
            .from("track_comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          const { count: replyCount } = await supabase
            .from("track_comment_replies")
            .select("*", { count: "exact", head: true })
            .eq("parent_comment_id", comment.id)
            .eq("status", "approved");

          const { data: track } = await supabase
            .from("tracks")
            .select("name")
            .eq("id", comment.track_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;
          const engagementScore = (likes * 2) + replies;

          if (engagementScore >= 3) {
            comments.push({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_id: comment.author_id,
              entity_type: 'track',
              entity_id: comment.track_id,
              entity_name: track?.name || 'Unknown Track',
              like_count: likes,
              reply_count: replies,
              engagement_score: engagementScore,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Sort by engagement score and limit
      return comments
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};