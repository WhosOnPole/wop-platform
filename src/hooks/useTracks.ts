import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Track {
  id: string;
  name: string;
  country: string;
  length_km: number | null;
  image_url: string | null;
  description: string | null;
  quote: string | null;
  quote_author: string | null;
}

export const useTracks = () => {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: async (): Promise<Track[]> => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching tracks:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTrack = (id: string) => {
  return useQuery({
    queryKey: ["track", id],
    queryFn: async (): Promise<Track> => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching track:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Track not found");
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};