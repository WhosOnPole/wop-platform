import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FanPost {
  id: string;
  author_id: string;
  image_url: string;
  caption: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  is_spotlight?: boolean;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useFanPosts = (status?: string, limit = 10) => {
  return useQuery({
    queryKey: ["fan-posts", status, limit],
    queryFn: async (): Promise<FanPost[]> => {
      // Simple query without complex joins for now
      let query = supabase
        .from("fan_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error("Error fetching fan posts:", error);
        // Return empty array instead of throwing to prevent crashes
        return [];
      }

      if (!posts || posts.length === 0) {
        return [];
      }

      // Fetch profiles separately for each post
      const postsWithProfiles = await Promise.all(
        posts.map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", post.author_id)
            .single();

          return {
            ...post,
            profiles: profile || null
          };
        })
      );

      return postsWithProfiles as FanPost[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateFanPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ image_url, caption }: { image_url: string; caption: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("fan_posts")
        .insert({
          author_id: user.id,
          image_url,
          caption,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fan-posts"] });
      toast({
        title: "Post submitted!",
        description: "Your fan post is now pending approval.",
      });
    },
    onError: (error) => {
      console.error("Error creating fan post:", error);
      toast({
        title: "Error",
        description: "Failed to submit your post. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFanPostStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { data, error } = await supabase
        .from("fan_posts")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fan-posts"] });
      toast({
        title: "Post updated",
        description: `Post has been ${data.status}.`,
      });
    },
    onError: (error) => {
      console.error("Error updating fan post:", error);
      toast({
        title: "Error",
        description: "Failed to update post status.",
        variant: "destructive",
      });
    },
  });
};

export const useUploadFanPostImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fan_posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fan_posts')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onError: (error) => {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });
};