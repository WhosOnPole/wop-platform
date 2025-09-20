import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPrincipal {
  id: string;
  name: string;
  country: string;
  team_id: string | null;
  photo_url: string | null;
  bio: string | null;
  quote: string | null;
  quote_author: string | null;
  years_with_team: number | null;
  created_at: string;
  teams?: { id: string; name: string; logo_url: string | null };
}

export const useTeamPrincipals = () => {
  return useQuery({
    queryKey: ["teamPrincipals"],
    queryFn: async (): Promise<TeamPrincipal[]> => {
      const { data, error } = await supabase
        .from("team_principals")
        .select(`
          *,
          teams:team_id (
            id,
            name,
            logo_url
          )
        `)
        .order("name");

      if (error) {
        console.error("Error fetching team principals:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};


export const useTeamPrincipal = (id: string) => {
  return useQuery({
    queryKey: ["teamPrincipal", id],
    queryFn: async (): Promise<TeamPrincipal> => {
      const { data, error } = await supabase
        .from("team_principals")
        .select(`
          *,
          teams:team_id (
            id,
            name,
            logo_url
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching team principal:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Team principal not found");
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};