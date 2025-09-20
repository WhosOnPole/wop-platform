import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FanPoint {
  id: string;
  user_id: string;
  driver_id: string;
  total_points: number;
  last_decay_applied: string;
  created_at: string;
  updated_at: string;
}

export interface FanPointActivity {
  id: string;
  user_id: string;
  driver_id: string;
  activity_type: 'grid_ranking' | 'favorite_selection' | 'poll_vote' | 'comment' | 'fan_post';
  points_awarded: number;
  activity_reference_id?: string;
  metadata: any;
  created_at: string;
}

// Hook to get user's fan points for a specific driver
export const useUserFanPoints = (driverId: string) => {
  return useQuery({
    queryKey: ["user-fan-points", driverId],
    queryFn: async (): Promise<FanPoint | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("driver_fan_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("driver_id", driverId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user fan points:", error);
        throw error;
      }

      return data;
    },
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get user's top driver fan points
export const useUserTopDrivers = (limit = 5) => {
  return useQuery({
    queryKey: ["user-top-drivers", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("driver_fan_points")
        .select(`
          *,
          drivers!inner (
            id,
            name,
            headshot_url,
            number,
            teams:team_id (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .gt("total_points", 0)
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user top drivers:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get user's recent fan point activities
export const useUserFanPointActivities = (limit = 10) => {
  return useQuery({
    queryKey: ["user-fan-point-activities", limit],
    queryFn: async (): Promise<FanPointActivity[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("fan_point_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user activities:", error);
        throw error;
      }

      return (data || []).map(activity => ({
        ...activity,
        activity_type: activity.activity_type as 'grid_ranking' | 'favorite_selection' | 'poll_vote' | 'comment' | 'fan_post'
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to award fan points
export const useAwardFanPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      driverId,
      points,
      activityType,
      activityRefId,
      metadata = {}
    }: {
      driverId: string;
      points: number;
      activityType: 'grid_ranking' | 'favorite_selection' | 'poll_vote' | 'comment' | 'fan_post';
      activityRefId?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("update_driver_fan_points", {
        target_user_id: user.id,
        target_driver_id: driverId,
        points_to_add: points,
        activity_type: activityType,
        activity_ref_id: activityRefId || null,
        activity_metadata: metadata
      });

      if (error) {
        console.error("Error awarding fan points:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user-fan-points", variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ["user-top-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["user-fan-point-activities"] });
      queryClient.invalidateQueries({ queryKey: ["top-fans", variables.driverId] });
    },
  });
};

// Utility functions for point calculations
export const POINT_VALUES = {
  GRID_POSITION_MAX: 20, // Position 1 = 20 points
  FAVORITE_DRIVER: 50,
  POLL_VOTE: 10,
  COMMENT: 5,
  FAN_POST: 15,
};

export const calculateGridRankingPoints = (position: number): number => {
  if (position < 1 || position > 20) return 0;
  return 21 - position;
};