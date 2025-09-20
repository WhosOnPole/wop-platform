import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  name: string;
  type: 'driver' | 'team' | 'track';
  country: string;
  additional_info: string;
  rank: number;
}

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim() || query.length < 2) {
        return [];
      }

      const { data, error } = await supabase.rpc('search_all', {
        search_query: query.trim()
      });

      if (error) {
        console.error("Error searching:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        type: item.type as 'driver' | 'team' | 'track'
      }));
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};