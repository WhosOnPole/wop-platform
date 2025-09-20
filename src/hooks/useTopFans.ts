import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopFan {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  region: string | null;
  total_points: number;
  rank_position: number;
}

// Hook to get top fans for a specific driver
export const useTopFans = (driverId: string, limit = 10) => {
  return useQuery({
    queryKey: ["top-fans", driverId, limit],
    queryFn: async (): Promise<TopFan[]> => {
      const { data, error } = await supabase.rpc("get_top_fans_for_driver", {
        target_driver_id: driverId,
        limit_count: limit,
      });

      if (error) {
        console.error("Error fetching top fans:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!driverId,
    staleTime: 15 * 60 * 1000, // 15 minutes cache for leaderboards
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
};

// Hook to get user's rank for a specific driver
export const useUserFanRank = (driverId: string) => {
  return useQuery({
    queryKey: ["user-fan-rank", driverId],
    queryFn: async (): Promise<{ rank: number; total_points: number } | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get all fans ranked by points for this driver
      const { data, error } = await supabase.rpc("get_top_fans_for_driver", {
        target_driver_id: driverId,
        limit_count: 1000, // Get a large number to find user's rank
      });

      if (error) {
        console.error("Error fetching user rank:", error);
        throw error;
      }

      if (!data) return null;

      const userRank = data.find((fan: TopFan) => fan.user_id === user.id);
      
      return userRank ? {
        rank: userRank.rank_position,
        total_points: userRank.total_points
      } : null;
    },
    enabled: !!driverId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get fan count for a driver
export const useDriverFanCount = (driverId: string) => {
  return useQuery({
    queryKey: ["driver-fan-count", driverId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("driver_fan_points")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .gt("total_points", 0);

      if (error) {
        console.error("Error fetching driver fan count:", error);
        throw error;
      }

      return data?.length || 0;
    },
    enabled: !!driverId,
    staleTime: 10 * 60 * 1000,
  });
};