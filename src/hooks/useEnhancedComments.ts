import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CommentSortOption = 'popular' | 'newest' | 'oldest';
export type TimePeriod = 'day' | 'week' | 'month' | 'all';

export interface EnhancedComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  like_count: number;
  reply_count: number;
  popularity_score: number;
}

interface CommentFilters {
  sortBy: CommentSortOption;
  timePeriod: TimePeriod;
}

const calculatePopularityScore = (
  likeCount: number,
  replyCount: number,
  createdAt: string,
  timePeriod: TimePeriod
): number => {
  const now = new Date();
  const commentDate = new Date(createdAt);
  const hoursDiff = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);

  // Base score from engagement
  const likeWeight = 3;
  const replyWeight = 2;
  const baseScore = (likeCount * likeWeight) + (replyCount * replyWeight);

  // Recency boost (newer comments get slight advantage)
  let recencyMultiplier = 1;
  if (hoursDiff < 24) recencyMultiplier = 1.2;
  else if (hoursDiff < 168) recencyMultiplier = 1.1; // 1 week
  else if (hoursDiff < 720) recencyMultiplier = 1.05; // 1 month

  return baseScore * recencyMultiplier;
};

const getTimeFilter = (timePeriod: TimePeriod): string => {
  const now = new Date();
  switch (timePeriod) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
    default:
      return new Date(0).toISOString();
  }
};

export const useEnhancedDriverComments = (
  driverId: string,
  filters: CommentFilters
) => {
  return useQuery({
    queryKey: ['enhanced-driver-comments', driverId, filters],
    queryFn: async (): Promise<EnhancedComment[]> => {
      const timeFilter = getTimeFilter(filters.timePeriod);
      
      // Fetch comments
      const { data: comments, error } = await supabase
        .from('driver_comments')
        .select(`
          id,
          content,
          created_at,
          author_id
        `)
        .eq('driver_id', driverId)
        .eq('status', 'approved')
        .gte('created_at', timeFilter);

      if (error) throw error;

      // Enhance each comment with like, reply counts, and profile data
      const enhancedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          const [likesResult, repliesResult, profileResult] = await Promise.all([
            supabase.rpc('get_driver_comment_like_count', {
              target_comment_id: comment.id
            }),
            supabase
              .from('driver_comment_replies')
              .select('id', { count: 'exact' })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved'),
            supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('user_id', comment.author_id)
              .maybeSingle()
          ]);

          const likeCount = likesResult.data || 0;
          const replyCount = repliesResult.count || 0;
          const popularityScore = calculatePopularityScore(
            likeCount,
            replyCount,
            comment.created_at,
            filters.timePeriod
          );

          return {
            ...comment,
            profiles: profileResult.data,
            like_count: likeCount,
            reply_count: replyCount,
            popularity_score: popularityScore,
          } as EnhancedComment;
        })
      );

      // Sort comments based on filters
      const sortedComments = [...enhancedComments].sort((a, b) => {
        switch (filters.sortBy) {
          case 'popular':
            return b.popularity_score - a.popularity_score;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
            return b.popularity_score - a.popularity_score;
        }
      });

      return sortedComments;
    },
    enabled: !!driverId,
    staleTime: 30 * 1000,
  });
};

export const useEnhancedTeamComments = (
  teamId: string,
  filters: CommentFilters
) => {
  return useQuery({
    queryKey: ['enhanced-team-comments', teamId, filters],
    queryFn: async (): Promise<EnhancedComment[]> => {
      const timeFilter = getTimeFilter(filters.timePeriod);
      
      const { data: comments, error } = await supabase
        .from('team_comments')
        .select(`
          id,
          content,
          created_at,
          author_id
        `)
        .eq('team_id', teamId)
        .eq('status', 'approved')
        .gte('created_at', timeFilter);

      if (error) throw error;

      const enhancedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          const [likesResult, repliesResult, profileResult] = await Promise.all([
            supabase.rpc('get_team_comment_like_count', {
              target_comment_id: comment.id
            }),
            supabase
              .from('team_comment_replies')
              .select('id', { count: 'exact' })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved'),
            supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('user_id', comment.author_id)
              .maybeSingle()
          ]);

          const likeCount = likesResult.data || 0;
          const replyCount = repliesResult.count || 0;
          const popularityScore = calculatePopularityScore(
            likeCount,
            replyCount,
            comment.created_at,
            filters.timePeriod
          );

          return {
            ...comment,
            profiles: profileResult.data,
            like_count: likeCount,
            reply_count: replyCount,
            popularity_score: popularityScore,
          } as EnhancedComment;
        })
      );

      const sortedComments = [...enhancedComments].sort((a, b) => {
        switch (filters.sortBy) {
          case 'popular':
            return b.popularity_score - a.popularity_score;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
            return b.popularity_score - a.popularity_score;
        }
      });

      return sortedComments;
    },
    enabled: !!teamId,
    staleTime: 30 * 1000,
  });
};

export const useEnhancedTrackComments = (
  trackId: string,
  filters: CommentFilters
) => {
  return useQuery({
    queryKey: ['enhanced-track-comments', trackId, filters],
    queryFn: async (): Promise<EnhancedComment[]> => {
      const timeFilter = getTimeFilter(filters.timePeriod);
      
      const { data: comments, error } = await supabase
        .from('track_comments')
        .select(`
          id,
          content,
          created_at,
          author_id
        `)
        .eq('track_id', trackId)
        .eq('status', 'approved')
        .gte('created_at', timeFilter);

      if (error) throw error;

      const enhancedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          const [likesResult, repliesResult, profileResult] = await Promise.all([
            supabase.rpc('get_track_comment_like_count', {
              target_comment_id: comment.id
            }),
            supabase
              .from('track_comment_replies')
              .select('id', { count: 'exact' })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved'),
            supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('user_id', comment.author_id)
              .maybeSingle()
          ]);

          const likeCount = likesResult.data || 0;
          const replyCount = repliesResult.count || 0;
          const popularityScore = calculatePopularityScore(
            likeCount,
            replyCount,
            comment.created_at,
            filters.timePeriod
          );

          return {
            ...comment,
            profiles: profileResult.data,
            like_count: likeCount,
            reply_count: replyCount,
            popularity_score: popularityScore,
          } as EnhancedComment;
        })
      );

      const sortedComments = [...enhancedComments].sort((a, b) => {
        switch (filters.sortBy) {
          case 'popular':
            return b.popularity_score - a.popularity_score;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
            return b.popularity_score - a.popularity_score;
        }
      });

      return sortedComments;
    },
    enabled: !!trackId,
    staleTime: 30 * 1000,
  });
};