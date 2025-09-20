import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegionalFanBadge {
  driver_id: string;
  driver_name: string;
  region: string;
  total_points: number;
  is_tied: boolean;
}

export const useRegionalFanBadges = () => {
  return useQuery({
    queryKey: ["regional-fan-badges"],
    queryFn: async (): Promise<RegionalFanBadge[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_regional_fan_leaders", {
        target_user_id: user.id
      });

      if (error) {
        console.error("Error fetching regional fan badges:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};