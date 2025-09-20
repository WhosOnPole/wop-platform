import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegionalTopFan {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  region: string;
  total_points: number;
  rank_position: number;
}

export const useRegionalTopFans = (driverId: string, region: string, limit = 10) => {
  return useQuery({
    queryKey: ["regional-top-fans", driverId, region, limit],
    queryFn: async (): Promise<RegionalTopFan[]> => {
      const { data, error } = await supabase.rpc("get_regional_top_fans_for_driver", {
        target_driver_id: driverId,
        target_region: region,
        limit_count: limit
      });

      if (error) {
        console.error("Error fetching regional top fans:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!driverId && !!region,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useUserRegionalRank = (driverId: string) => {
  return useQuery({
    queryKey: ["user-regional-rank", driverId],
    queryFn: async (): Promise<{ rank_position: number; total_points: number; region: string } | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_user_regional_rank_for_driver", {
        target_driver_id: driverId,
        target_user_id: user.id
      });

      if (error) {
        console.error("Error fetching user regional rank:", error);
        throw error;
      }

      return data?.[0] || null;
    },
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};