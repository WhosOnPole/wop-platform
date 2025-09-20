import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamComment {
  id: string;
  team_id: string;
  author_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useTeamComments = (teamId: string) => {
  return useQuery({
    queryKey: ['team-comments', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_comments')
        .select(`
          id,
          team_id,
          author_id,
          content,
          status,
          created_at,
          updated_at,
          profiles!team_comments_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team comments:', error);
        throw error;
      }

      return data as TeamComment[];
    },
    enabled: !!teamId,
  });
};

export const useCreateTeamComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, content }: { teamId: string; content: string }) => {
      if (!user) {
        throw new Error('You must be logged in to comment');
      }

      const { data, error } = await supabase
        .from('team_comments')
        .insert([
          {
            team_id: teamId,
            author_id: user.id,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating team comment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-comments', variables.teamId] });
      toast({
        title: "Comment submitted!",
        description: "Your comment will be reviewed before appearing.",
      });
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      toast({
        title: "Failed to submit comment",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
};