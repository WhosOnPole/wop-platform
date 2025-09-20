import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DriverRegion {
  region: string;
  fan_count: number;
  top_fan_points: number;
}

export const useDriverRegions = (driverId: string) => {
  return useQuery({
    queryKey: ["driver-regions", driverId],
    queryFn: async (): Promise<DriverRegion[]> => {
      const { data, error } = await supabase.rpc("get_driver_regions_with_fans", {
        target_driver_id: driverId
      });

      if (error) {
        console.error("Error fetching driver regions:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!driverId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};