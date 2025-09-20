import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QualifyingTag {
  id: string;
  name: string;
  color_class: string;
  category: string;
}

export interface QualifyingEntity {
  id: string;
  name: string;
  entity_type: 'driver' | 'team' | 'track' | 'team_principal';
  country: string;
  image_url: string | null;
  additional_info: string;
  fan_count: number;
  comment_count: number;
  grid_count: number;
  trending_score: number;
  tags: QualifyingTag[];
}

export const useQualifyingEntities = (limit = 10) => {
  return useQuery({
    queryKey: ["qualifying-entities", limit],
    queryFn: async (): Promise<QualifyingEntity[]> => {
      const { data, error } = await supabase.rpc("get_qualifying_entities", {
        limit_count: limit,
      });

      if (error) {
        console.error("Error fetching qualifying entities:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        entity_type: item.entity_type as QualifyingEntity['entity_type'],
        tags: item.tags || []
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};