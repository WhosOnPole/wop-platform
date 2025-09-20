import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  bio: string | null;
  short_bio: string | null;
  quote: string | null;
  quote_author: string | null;
  team_id: string | null;
  teams?: { id: string; name: string; logo_url: string | null };
}

export const useDrivers = () => {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async (): Promise<Driver[]> => {
      const { data, error } = await supabase
        .from("drivers")
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
        console.error("Error fetching drivers:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: ["driver", id],
    queryFn: async (): Promise<Driver> => {
      const { data, error } = await supabase
        .from("drivers")
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
        console.error("Error fetching driver:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Driver not found");
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};