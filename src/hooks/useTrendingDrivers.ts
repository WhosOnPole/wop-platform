import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingDriver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  team_name: string;
  fan_count: number;
  recent_grids: number;
  avg_stars: number;
  trending_score: number;
}

export const useTrendingDrivers = (limit = 5) => {
  return useQuery({
    queryKey: ["trending-drivers", limit],
    queryFn: async (): Promise<TrendingDriver[]> => {
      const { data, error } = await supabase.rpc("get_trending_drivers", {
        limit_count: limit,
      });

      if (error) {
        console.error("Error fetching trending drivers:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useDriverFanGrowth = (driverId: string) => {
  return useQuery({
    queryKey: ["driver-fan-growth", driverId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_driver_fan_growth", {
        driver_uuid: driverId,
      });

      if (error) {
        console.error("Error fetching driver fan growth:", error);
        throw error;
      }

      return data?.[0] || { recent_fans: 0, previous_fans: 0, growth_percentage: 0 };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!driverId,
  });
};