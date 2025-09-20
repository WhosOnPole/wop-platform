import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamPrincipalComment {
  id: string;
  team_principal_id: string;
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

export const useTeamPrincipalComments = (teamPrincipalId: string) => {
  return useQuery({
    queryKey: ['team-principal-comments', teamPrincipalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_principal_comments')
        .select(`
          id,
          team_principal_id,
          author_id,
          content,
          status,
          created_at,
          updated_at,
          profiles!team_principal_comments_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('team_principal_id', teamPrincipalId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team principal comments:', error);
        throw error;
      }

      return data as TeamPrincipalComment[];
    },
    enabled: !!teamPrincipalId,
  });
};

export const useCreateTeamPrincipalComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamPrincipalId, content }: { teamPrincipalId: string; content: string }) => {
      if (!user) {
        throw new Error('You must be logged in to comment');
      }

      const { data, error } = await supabase
        .from('team_principal_comments')
        .insert([
          {
            team_principal_id: teamPrincipalId,
            author_id: user.id,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating team principal comment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-principal-comments', variables.teamPrincipalId] });
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