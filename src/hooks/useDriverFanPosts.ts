import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DriverFanPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useDriverFanPosts = (driverId: string, limit?: number) => {
  return useQuery({
    queryKey: ["driver-fan-posts", driverId, limit],
    queryFn: async (): Promise<DriverFanPost[]> => {
      // First get the fan post IDs for this driver
      const { data: driverPosts, error: driverError } = await supabase
        .from("fan_post_drivers")
        .select("fan_post_id")
        .eq("driver_id", driverId);

      if (driverError) {
        console.error("Error fetching driver post IDs:", driverError);
        throw driverError;
      }

      if (!driverPosts || driverPosts.length === 0) {
        return [];
      }

      const fanPostIds = driverPosts.map(item => item.fan_post_id);

      // Get fan posts
      const { data: fanPosts, error: postsError } = await supabase
        .from("fan_posts")
        .select(`
          id,
          image_url,
          caption,
          created_at,
          author_id
        `)
        .in("id", fanPostIds)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit || 50);

      if (postsError) {
        console.error("Error fetching fan posts:", postsError);
        throw postsError;
      }

      if (!fanPosts || fanPosts.length === 0) {
        return [];
      }

      // Get author profiles
      const authorIds = fanPosts.map(post => post.author_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", authorIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Map profiles to posts
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return fanPosts.map(post => {
        const profile = profileMap.get(post.author_id);
        return {
          ...post,
          profiles: {
            username: profile?.username || 'Unknown',
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null
          }
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!driverId,
  });
};

export const useTagDriversInPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      fanPostId, 
      driverIds 
    }: { 
      fanPostId: string; 
      driverIds: string[] 
    }) => {
      // First, remove existing driver tags for this post
      await supabase
        .from("fan_post_drivers")
        .delete()
        .eq("fan_post_id", fanPostId);

      // Then add new driver tags
      if (driverIds.length > 0) {
        const { error } = await supabase
          .from("fan_post_drivers")
          .insert(
            driverIds.map(driverId => ({
              fan_post_id: fanPostId,
              driver_id: driverId
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fan-posts"] });
      queryClient.invalidateQueries({ queryKey: ["driver-fan-posts"] });
      toast({
        title: "Success",
        description: "Driver tags updated successfully"
      });
    },
    onError: (error) => {
      console.error("Error tagging drivers:", error);
      toast({
        title: "Error",
        description: "Failed to update driver tags",
        variant: "destructive"
      });
    }
  });
};

export const usePostDrivers = (fanPostId: string) => {
  return useQuery({
    queryKey: ["post-drivers", fanPostId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("fan_post_drivers")
        .select("driver_id")
        .eq("fan_post_id", fanPostId);

      if (error) {
        console.error("Error fetching post drivers:", error);
        throw error;
      }

      return data?.map(item => item.driver_id) || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!fanPostId,
  });
};