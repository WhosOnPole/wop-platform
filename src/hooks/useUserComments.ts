import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommentSortOption = 'newest' | 'most_liked' | 'most_replied';

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  entity_type: 'driver' | 'team' | 'track' | 'team_principal';
  entity_id: string;
  entity_name: string;
  entity_image?: string;
  entity_additional_info?: string;
  like_count: number;
  reply_count: number;
  snippet: string;
  deep_link: string;
  is_hidden_from_profile?: boolean;
}

const generateDeepLink = (entityType: string, entityId: string, commentId: string): string => {
  const baseRoutes = {
    driver: '/drivers',
    team: '/teams', 
    track: '/tracks',
    team_principal: '/team-principals'
  };
  
  const route = baseRoutes[entityType as keyof typeof baseRoutes] || '/';
  return `${route}/${entityId}#comment-${commentId}`;
};

const createSnippet = (content: string, maxLength: number = 240): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

export const useUserComments = (
  userId: string, 
  sortBy: CommentSortOption = 'newest',
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['user-comments', userId, sortBy, page, pageSize],
    queryFn: async (): Promise<{ comments: UserComment[], hasMore: boolean, totalCount: number }> => {
      const offset = (page - 1) * pageSize;
      
      // Fetch driver comments
      const driverCommentsQuery = supabase
        .from('driver_comments')
        .select(`
          id,
          content,
          created_at,
          driver_id,
          drivers!inner (
            id,
            name,
            headshot_url,
            number
          )
        `)
        .eq('author_id', userId)
        .eq('status', 'approved')
        .neq('is_hidden_from_profile', true);

      // Fetch team comments  
      const teamCommentsQuery = supabase
        .from('team_comments')
        .select(`
          id,
          content,
          created_at,
          team_id,
          teams!inner (
            id,
            name,
            logo_url,
            championship_standing
          )
        `)
        .eq('author_id', userId)
        .eq('status', 'approved')
        .neq('is_hidden_from_profile', true);

      // Fetch track comments
      const trackCommentsQuery = supabase
        .from('track_comments')
        .select(`
          id,
          content,
          created_at,
          track_id,
          tracks!inner (
            id,
            name,
            image_url,
            length_km
          )
        `)
        .eq('author_id', userId)
        .eq('status', 'approved')
        .neq('is_hidden_from_profile', true);

      // Fetch team principal comments
      const teamPrincipalCommentsQuery = supabase
        .from('team_principal_comments')
        .select(`
          id,
          content,
          created_at,
          team_principal_id,
          team_principals!inner (
            id,
            name,
            photo_url,
            teams (name)
          )
        `)
        .eq('author_id', userId)
        .eq('status', 'approved')
        .neq('is_hidden_from_profile', true);

      // Execute all queries
      const [
        { data: driverComments = [] },
        { data: teamComments = [] }, 
        { data: trackComments = [] },
        { data: teamPrincipalComments = [] }
      ] = await Promise.all([
        driverCommentsQuery,
        teamCommentsQuery,
        trackCommentsQuery,
        teamPrincipalCommentsQuery
      ]);

      // Transform and combine all comments
      let allComments: UserComment[] = [];

      // Process driver comments
      driverComments.forEach((comment: any) => {
        allComments.push({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          entity_type: 'driver',
          entity_id: comment.driver_id,
          entity_name: comment.drivers.name,
          entity_image: comment.drivers.headshot_url,
          entity_additional_info: comment.drivers.number ? `#${comment.drivers.number}` : undefined,
          like_count: 0, // Will be populated separately
          reply_count: 0, // Will be populated separately
          snippet: createSnippet(comment.content),
          deep_link: generateDeepLink('driver', comment.driver_id, comment.id)
        });
      });

      // Process team comments
      teamComments.forEach((comment: any) => {
        allComments.push({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          entity_type: 'team',
          entity_id: comment.team_id,
          entity_name: comment.teams.name,
          entity_image: comment.teams.logo_url,
          entity_additional_info: comment.teams.championship_standing ? `P${comment.teams.championship_standing}` : undefined,
          like_count: 0,
          reply_count: 0,
          snippet: createSnippet(comment.content),
          deep_link: generateDeepLink('team', comment.team_id, comment.id)
        });
      });

      // Process track comments
      trackComments.forEach((comment: any) => {
        allComments.push({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          entity_type: 'track',
          entity_id: comment.track_id,
          entity_name: comment.tracks.name,
          entity_image: comment.tracks.image_url,
          entity_additional_info: comment.tracks.length_km ? `${comment.tracks.length_km} km` : undefined,
          like_count: 0,
          reply_count: 0,
          snippet: createSnippet(comment.content),
          deep_link: generateDeepLink('track', comment.track_id, comment.id)
        });
      });

      // Process team principal comments
      teamPrincipalComments.forEach((comment: any) => {
        allComments.push({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          entity_type: 'team_principal',
          entity_id: comment.team_principal_id,
          entity_name: comment.team_principals.name,
          entity_image: comment.team_principals.photo_url,
          entity_additional_info: comment.team_principals.teams?.name,
          like_count: 0,
          reply_count: 0,
          snippet: createSnippet(comment.content),
          deep_link: generateDeepLink('team_principal', comment.team_principal_id, comment.id)
        });
      });

      // Get like and reply counts for all comments using separate queries for each type
      if (allComments.length > 0) {
        // Get like counts for each comment type
        for (const comment of allComments) {
          let likeCount = 0;
          let replyCount = 0;

          // Get like count based on entity type
          if (comment.entity_type === 'driver') {
            const { count } = await supabase
              .from('driver_comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id);
            likeCount = count || 0;

            const { count: repliesCount } = await supabase
              .from('driver_comment_replies')
              .select('*', { count: 'exact', head: true })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved');
            replyCount = repliesCount || 0;
          } else if (comment.entity_type === 'team') {
            const { count } = await supabase
              .from('team_comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id);
            likeCount = count || 0;

            const { count: repliesCount } = await supabase
              .from('team_comment_replies')
              .select('*', { count: 'exact', head: true })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved');
            replyCount = repliesCount || 0;
          } else if (comment.entity_type === 'track') {
            const { count } = await supabase
              .from('track_comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id);
            likeCount = count || 0;

            const { count: repliesCount } = await supabase
              .from('track_comment_replies')
              .select('*', { count: 'exact', head: true })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved');
            replyCount = repliesCount || 0;
          } else if (comment.entity_type === 'team_principal') {
            const { count } = await supabase
              .from('team_principal_comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id);
            likeCount = count || 0;

            const { count: repliesCount } = await supabase
              .from('team_principal_comment_replies')
              .select('*', { count: 'exact', head: true })
              .eq('parent_comment_id', comment.id)
              .eq('status', 'approved');
            replyCount = repliesCount || 0;
          }

          comment.like_count = likeCount;
          comment.reply_count = replyCount;
        }
      }

      // Sort comments
      allComments.sort((a, b) => {
        switch (sortBy) {
          case 'most_liked':
            return b.like_count - a.like_count;
          case 'most_replied':
            return b.reply_count - a.reply_count;
          case 'newest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      const totalCount = allComments.length;
      const paginatedComments = allComments.slice(offset, offset + pageSize);
      const hasMore = offset + pageSize < totalCount;

      return {
        comments: paginatedComments,
        hasMore,
        totalCount
      };
    },
    staleTime: 60 * 1000, // 60 seconds cache
    enabled: !!userId
  });
};

export const useHideCommentFromProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, entityType, hidden }: { 
      commentId: string;
      entityType: 'driver' | 'team' | 'track' | 'team_principal';
      hidden: boolean;
    }) => {
      let error;
      
      // Update the appropriate table based on entity type
      if (entityType === 'driver') {
        const result = await supabase
          .from('driver_comments')
          .update({ is_hidden_from_profile: hidden })
          .eq('id', commentId);
        error = result.error;
      } else if (entityType === 'team') {
        const result = await supabase
          .from('team_comments')
          .update({ is_hidden_from_profile: hidden })
          .eq('id', commentId);
        error = result.error;
      } else if (entityType === 'track') {
        const result = await supabase
          .from('track_comments')
          .update({ is_hidden_from_profile: hidden })
          .eq('id', commentId);
        error = result.error;
      } else if (entityType === 'team_principal') {
        const result = await supabase
          .from('team_principal_comments')
          .update({ is_hidden_from_profile: hidden })
          .eq('id', commentId);
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-comments'] });
    }
  });
};