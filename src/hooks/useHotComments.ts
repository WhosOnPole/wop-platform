import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HotComment {
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
  hot_score: number;
  is_personalized: boolean; // from followed user or favorite entity
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export type TimeWindow = 'day' | 'week' | 'month' | 'all';
export type SortMode = 'hot' | 'new';

// Configurable scoring weights
const RANKING_CONFIG = {
  LIKE_WEIGHT: 1.0,
  REPLY_WEIGHT: 1.5,
  HALF_LIFE_HOURS: 18, // Time decay half-life
  MIN_ENGAGEMENT_THRESHOLD: 1, // Minimum engagement to show
  PERSONALIZATION_BOOST: 1.3, // Boost for personalized content
};

const calculateTimeDecay = (createdAt: string): number => {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return Math.pow(0.5, ageInHours / RANKING_CONFIG.HALF_LIFE_HOURS);
};

const calculateHotScore = (likes: number, replies: number, createdAt: string, isPersonalized: boolean): number => {
  const baseScore = (likes * RANKING_CONFIG.LIKE_WEIGHT) + (replies * RANKING_CONFIG.REPLY_WEIGHT);
  const timeDecay = calculateTimeDecay(createdAt);
  const personalizedMultiplier = isPersonalized ? RANKING_CONFIG.PERSONALIZATION_BOOST : 1;
  
  return baseScore * timeDecay * personalizedMultiplier;
};

const getTimeWindowCutoff = (window: TimeWindow): string => {
  const now = new Date();
  switch (window) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
    default:
      return new Date(0).toISOString(); // Beginning of time
  }
};

export const useHotComments = (
  sortMode: SortMode = 'hot',
  timeWindow: TimeWindow = 'day',
  limit = 20,
  page = 1
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["hot-comments", sortMode, timeWindow, limit, page, user?.id],
    queryFn: async (): Promise<{ comments: HotComment[]; hasMore: boolean; totalCount: number }> => {
      const cutoffDate = getTimeWindowCutoff(timeWindow);
      const offset = (page - 1) * limit;
      const comments: HotComment[] = [];
      
      // Get user's follows and favorite entities for personalization
      let followingIds: string[] = [];
      let favoriteDriverId: string | null = null;
      let favoriteTeamId: string | null = null;
      let favoriteTrackIds: string[] = [];

      if (user) {
        // Get followed users
        const { data: follows } = await supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', user.id);
        
        followingIds = follows?.map(f => f.followee_id) || [];

        // Get user's favorite entities
        const { data: profile } = await supabase
          .from('profiles')
          .select('favorite_driver_id, favorite_team_id, favorite_track_ids')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          favoriteDriverId = profile.favorite_driver_id;
          favoriteTeamId = profile.favorite_team_id;
          // Handle the Json[] type safely
          if (profile.favorite_track_ids && Array.isArray(profile.favorite_track_ids)) {
            favoriteTrackIds = profile.favorite_track_ids.map(id => String(id));
          }
        }
      }

      // Fetch driver comments
      const { data: driverComments } = await supabase
        .from('driver_comments')
        .select(`
          id, content, created_at, author_id, driver_id,
          profiles!driver_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .neq("author_id", user?.id || 'none')
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (driverComments) {
        for (const comment of driverComments) {
          const [{ count: likeCount }, { count: replyCount }] = await Promise.all([
            supabase
              .from('driver_comment_likes')
              .select("*", { count: "exact", head: true })
              .eq("comment_id", comment.id),
            supabase
              .from('driver_comment_replies')
              .select("*", { count: "exact", head: true })
              .eq("parent_comment_id", comment.id)
              .eq("status", "approved")
          ]);

          const { data: driver } = await supabase
            .from('drivers')
            .select("name")
            .eq("id", comment.driver_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;

          if (likes + replies >= RANKING_CONFIG.MIN_ENGAGEMENT_THRESHOLD) {
            const isFromFollowedUser = followingIds.includes(comment.author_id);
            const isOnFavoriteEntity = comment.driver_id === favoriteDriverId;
            const isPersonalized = isFromFollowedUser || isOnFavoriteEntity;

            const hotScore = sortMode === 'hot' 
              ? calculateHotScore(likes, replies, comment.created_at, isPersonalized)
              : new Date(comment.created_at).getTime();

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
              engagement_score: (likes * RANKING_CONFIG.LIKE_WEIGHT) + (replies * RANKING_CONFIG.REPLY_WEIGHT),
              hot_score: hotScore,
              is_personalized: isPersonalized,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Fetch team comments
      const { data: teamComments } = await supabase
        .from('team_comments')
        .select(`
          id, content, created_at, author_id, team_id,
          profiles!team_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .neq("author_id", user?.id || 'none')
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (teamComments) {
        for (const comment of teamComments) {
          const [{ count: likeCount }, { count: replyCount }] = await Promise.all([
            supabase
              .from('team_comment_likes')
              .select("*", { count: "exact", head: true })
              .eq("comment_id", comment.id),
            supabase
              .from('team_comment_replies')
              .select("*", { count: "exact", head: true })
              .eq("parent_comment_id", comment.id)
              .eq("status", "approved")
          ]);

          const { data: team } = await supabase
            .from('teams')
            .select("name")
            .eq("id", comment.team_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;

          if (likes + replies >= RANKING_CONFIG.MIN_ENGAGEMENT_THRESHOLD) {
            const isFromFollowedUser = followingIds.includes(comment.author_id);
            const isOnFavoriteEntity = comment.team_id === favoriteTeamId;
            const isPersonalized = isFromFollowedUser || isOnFavoriteEntity;

            const hotScore = sortMode === 'hot' 
              ? calculateHotScore(likes, replies, comment.created_at, isPersonalized)
              : new Date(comment.created_at).getTime();

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
              engagement_score: (likes * RANKING_CONFIG.LIKE_WEIGHT) + (replies * RANKING_CONFIG.REPLY_WEIGHT),
              hot_score: hotScore,
              is_personalized: isPersonalized,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Fetch team principal comments
      const { data: tpComments } = await supabase
        .from('team_principal_comments')
        .select(`
          id, content, created_at, author_id, team_principal_id,
          profiles!team_principal_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .neq("author_id", user?.id || 'none')
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (tpComments) {
        for (const comment of tpComments) {
          const [{ count: likeCount }, { count: replyCount }] = await Promise.all([
            supabase
              .from('team_principal_comment_likes')
              .select("*", { count: "exact", head: true })
              .eq("comment_id", comment.id),
            supabase
              .from('team_principal_comment_replies')
              .select("*", { count: "exact", head: true })
              .eq("parent_comment_id", comment.id)
              .eq("status", "approved")
          ]);

          const { data: tp } = await supabase
            .from('team_principals')
            .select("name")
            .eq("id", comment.team_principal_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;

          if (likes + replies >= RANKING_CONFIG.MIN_ENGAGEMENT_THRESHOLD) {
            const isFromFollowedUser = followingIds.includes(comment.author_id);
            const isPersonalized = isFromFollowedUser; // Team principals aren't in favorites

            const hotScore = sortMode === 'hot' 
              ? calculateHotScore(likes, replies, comment.created_at, isPersonalized)
              : new Date(comment.created_at).getTime();

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
              engagement_score: (likes * RANKING_CONFIG.LIKE_WEIGHT) + (replies * RANKING_CONFIG.REPLY_WEIGHT),
              hot_score: hotScore,
              is_personalized: isPersonalized,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Fetch track comments
      const { data: trackComments } = await supabase
        .from('track_comments')
        .select(`
          id, content, created_at, author_id, track_id,
          profiles!track_comments_author_id_fkey(username, display_name, avatar_url)
        `)
        .eq("status", "approved")
        .neq("author_id", user?.id || 'none')
        .gte("created_at", cutoffDate)
        .order("created_at", { ascending: false });

      if (trackComments) {
        for (const comment of trackComments) {
          const [{ count: likeCount }, { count: replyCount }] = await Promise.all([
            supabase
              .from('track_comment_likes')
              .select("*", { count: "exact", head: true })
              .eq("comment_id", comment.id),
            supabase
              .from('track_comment_replies')
              .select("*", { count: "exact", head: true })
              .eq("parent_comment_id", comment.id)
              .eq("status", "approved")
          ]);

          const { data: track } = await supabase
            .from('tracks')
            .select("name")
            .eq("id", comment.track_id)
            .single();

          const likes = likeCount || 0;
          const replies = replyCount || 0;

          if (likes + replies >= RANKING_CONFIG.MIN_ENGAGEMENT_THRESHOLD) {
            const isFromFollowedUser = followingIds.includes(comment.author_id);
            const isOnFavoriteEntity = favoriteTrackIds.includes(comment.track_id);
            const isPersonalized = isFromFollowedUser || isOnFavoriteEntity;

            const hotScore = sortMode === 'hot' 
              ? calculateHotScore(likes, replies, comment.created_at, isPersonalized)
              : new Date(comment.created_at).getTime();

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
              engagement_score: (likes * RANKING_CONFIG.LIKE_WEIGHT) + (replies * RANKING_CONFIG.REPLY_WEIGHT),
              hot_score: hotScore,
              is_personalized: isPersonalized,
              profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            });
          }
        }
      }

      // Sort by hot score (desc) or timestamp (desc for new)
      const sortedComments = comments.sort((a, b) => {
        if (sortMode === 'hot') {
          // Hot mode: sort by hot_score, then by timestamp for ties
          if (Math.abs(b.hot_score - a.hot_score) < 0.01) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return b.hot_score - a.hot_score;
        } else {
          // New mode: sort by timestamp only
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      // Prioritize personalized content
      const personalizedComments = sortedComments.filter(c => c.is_personalized);
      const nonPersonalizedComments = sortedComments.filter(c => !c.is_personalized);
      
      // If we have fewer than 10 personalized comments, mix with non-personalized
      let finalComments = [...personalizedComments];
      if (finalComments.length < 10) {
        const needed = Math.min(20 - finalComments.length, nonPersonalizedComments.length);
        finalComments = [...finalComments, ...nonPersonalizedComments.slice(0, needed)];
        
        // Re-sort the mixed results
        finalComments.sort((a, b) => {
          if (sortMode === 'hot') {
            if (Math.abs(b.hot_score - a.hot_score) < 0.01) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return b.hot_score - a.hot_score;
          } else {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
        });
      }

      const totalCount = finalComments.length;
      const paginatedComments = finalComments.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      return {
        comments: paginatedComments,
        hasMore,
        totalCount
      };
    },
    staleTime: 60 * 1000, // 60 seconds cache
    enabled: !!user, // Only fetch if user is authenticated
  });
};