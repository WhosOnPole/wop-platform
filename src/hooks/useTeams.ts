import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  country: string;
  logo_url: string | null;
  bio: string | null;
  short_bio: string | null;
  quote: string | null;
  quote_author: string | null;
  championship_standing: number | null;
  created_at: string;
}

export const useTeams = () => {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching teams:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ["team", id],
    queryFn: async (): Promise<Team> => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching team:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Team not found");
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};