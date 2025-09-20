import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PredefinedTag {
  id: string;
  name: string;
  color_class: string;
  category: string;
}

export interface EntityTag {
  id: string;
  entity_id: string;
  entity_type: 'driver' | 'team' | 'track' | 'team_principal';
  tag_id: string;
  predefined_tags: PredefinedTag;
}

// Hook to fetch all predefined tags
export const usePredefinedTags = () => {
  return useQuery({
    queryKey: ["predefined-tags"],
    queryFn: async (): Promise<PredefinedTag[]> => {
      const { data, error } = await supabase
        .from("predefined_tags")
        .select("*")
        .order("category, name");

      if (error) {
        console.error("Error fetching predefined tags:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch tags for a specific entity
export const useEntityTags = (entityId: string, entityType: string) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: async (): Promise<EntityTag[]> => {
      const { data, error } = await supabase
        .from("entity_tags")
        .select(`
          *,
          predefined_tags (*)
        `)
        .eq("entity_id", entityId)
        .eq("entity_type", entityType);

      if (error) {
        console.error("Error fetching entity tags:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        entity_type: item.entity_type as EntityTag['entity_type']
      }));
    },
    enabled: !!entityId && !!entityType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to add a tag to an entity
export const useAddEntityTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityId, entityType, tagId }: {
      entityId: string;
      entityType: string;
      tagId: string;
    }) => {
      const { data, error } = await supabase
        .from("entity_tags")
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          tag_id: tagId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["entity-tags", variables.entityId, variables.entityType]
      });
      queryClient.invalidateQueries({
        queryKey: ["qualifying-entities"]
      });
      toast.success("Tag added successfully!");
    },
    onError: (error) => {
      console.error("Error adding entity tag:", error);
      toast.error("Failed to add tag");
    }
  });
};

// Hook to remove a tag from an entity
export const useRemoveEntityTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from("entity_tags")
        .delete()
        .eq("id", tagId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["entity-tags"]
      });
      queryClient.invalidateQueries({
        queryKey: ["qualifying-entities"]
      });
      toast.success("Tag removed successfully!");
    },
    onError: (error) => {
      console.error("Error removing entity tag:", error);
      toast.error("Failed to remove tag");
    }
  });
};