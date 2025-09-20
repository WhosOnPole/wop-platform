import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpotlightPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useSpotlightPost = () => {
  return useQuery({
    queryKey: ["spotlight-post"],
    queryFn: async (): Promise<SpotlightPost | null> => {
      // First get the spotlight post
      const { data: postData, error: postError } = await supabase
        .from("fan_posts")
        .select("*")
        .eq("is_spotlight", true)
        .eq("status", "approved")
        .single();

      if (postError) {
        if (postError.code === "PGRST116") {
          // No spotlight post found
          return null;
        }
        throw postError;
      }

      // Then get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", postData.author_id)
        .single();

      if (profileError) {
        console.warn("Profile not found for spotlight post author:", profileError);
      }

      return {
        id: postData.id,
        image_url: postData.image_url,
        caption: postData.caption,
        created_at: postData.created_at,
        author_id: postData.author_id,
        profiles: profileData || null,
      };
    },
  });
};

export const useSetSpotlight = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("set_spotlight_post", {
        post_id: postId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotlight-post"] });
      queryClient.invalidateQueries({ queryKey: ["fan-posts"] });
      toast({
        title: "Success",
        description: "Post has been set as spotlight feature",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set spotlight post",
        variant: "destructive",
      });
      console.error("Error setting spotlight:", error);
    },
  });
};

export const useRemoveSpotlight = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("remove_spotlight_post", {
        post_id: postId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotlight-post"] });
      queryClient.invalidateQueries({ queryKey: ["fan-posts"] });
      toast({
        title: "Success",
        description: "Spotlight has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove spotlight",
        variant: "destructive",
      });
      console.error("Error removing spotlight:", error);
    },
  });
};