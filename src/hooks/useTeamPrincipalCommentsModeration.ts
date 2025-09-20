import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamPrincipalCommentModeration {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  author_id: string;
  team_principal_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  team_principals: {
    name: string;
  } | null;
}

export const useTeamPrincipalCommentsModeration = () => {
  return useQuery({
    queryKey: ['team-principal-comments-moderation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_principal_comments')
        .select(`
          *,
          profiles!author_id(username, display_name, avatar_url),
          team_principals!team_principal_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
  });
};

export const useUpdateTeamPrincipalCommentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('team_principal_comments')
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['team-principal-comments-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['team-principal-comments'] });
      toast({
        title: status === 'approved' ? 'Comment approved' : 'Comment rejected',
        description: `The team principal comment has been ${status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update comment status.',
        variant: 'destructive',
      });
    },
  });
};