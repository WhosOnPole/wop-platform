import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DriverComment {
  id: string;
  driver_id: string;
  author_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateDriverCommentData {
  driver_id: string;
  content: string;
}

export const useDriverComments = (driverId: string) => {
  return useQuery({
    queryKey: ["driver-comments", driverId],
    queryFn: async (): Promise<DriverComment[]> => {
      const { data, error } = await supabase
        .from("driver_comments")
        .select(`
          id,
          driver_id,
          author_id,
          content,
          status,
          created_at,
          updated_at
        `)
        .eq("driver_id", driverId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching driver comments:", error);
        throw error;
      }

      // Get profiles for each comment
      const comments = data || [];
      const commentsWithProfiles = await Promise.all(
        comments.map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("user_id", comment.author_id)
            .maybeSingle();
          
          return {
            ...comment,
            profiles: profile,
          } as DriverComment;
        })
      );

      return commentsWithProfiles;
    },
    enabled: !!driverId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateDriverComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDriverCommentData) => {
      const { data: result, error } = await supabase
        .from("driver_comments")
        .insert([{
          driver_id: data.driver_id,
          content: data.content,
          author_id: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["driver-comments", data.driver_id] });
      toast({
        title: "Comment submitted!",
        description: "Your comment is pending approval and will appear once reviewed.",
      });
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDriverCommentsModeration = () => {
  return useQuery({
    queryKey: ["driver-comments-moderation"],
    queryFn: async (): Promise<DriverComment[]> => {
      const { data, error } = await supabase
        .from("driver_comments")
        .select(`
          id,
          driver_id,
          author_id,
          content,
          status,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching driver comments for moderation:", error);
        throw error;
      }

      // Get profiles and driver info for each comment
      const comments = data || [];
      const commentsWithDetails = await Promise.all(
        comments.map(async (comment) => {
          const [profileResult, driverResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url")
              .eq("user_id", comment.author_id)
              .maybeSingle(),
            supabase
              .from("drivers")
              .select("id, name")
              .eq("id", comment.driver_id)
              .maybeSingle()
          ]);
          
          return {
            ...comment,
            profiles: profileResult.data,
            drivers: driverResult.data,
          } as DriverComment & { drivers?: { id: string; name: string } };
        })
      );

      return commentsWithDetails as DriverComment[];
    },
    staleTime: 30 * 1000,
  });
};

export const useUpdateDriverCommentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: 'approved' | 'rejected' }) => {
      const { data, error } = await supabase
        .from("driver_comments")
        .update({ status })
        .eq("id", commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driver-comments-moderation"] });
      queryClient.invalidateQueries({ queryKey: ["driver-comments", data.driver_id] });
      toast({
        title: "Comment updated",
        description: `Comment has been ${variables.status}.`,
      });
    },
    onError: (error) => {
      console.error("Error updating comment status:", error);
      toast({
        title: "Error",
        description: "Failed to update comment status.",
        variant: "destructive",
      });
    },
  });
};