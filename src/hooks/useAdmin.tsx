import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("useAdmin: No user found");
        return false;
      }

      console.log("useAdmin: Checking admin status for user:", user.id);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      console.log("useAdmin: Query result:", data);
      const hasAdminRole = data && data.length > 0;
      console.log("useAdmin: Is admin?", hasAdminRole);
      
      return hasAdminRole;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { isAdmin, isLoading, user };
};