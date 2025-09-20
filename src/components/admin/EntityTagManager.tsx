import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { useEntityTags, usePredefinedTags, useAddEntityTag, useRemoveEntityTag } from "@/hooks/useEntityTags";

interface EntityTagManagerProps {
  entityId: string;
  entityType: 'driver' | 'team' | 'track' | 'team_principal';
  entityName: string;
}

export const EntityTagManager = ({ entityId, entityType, entityName }: EntityTagManagerProps) => {
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  
  const { data: predefinedTags = [], isLoading: tagsLoading } = usePredefinedTags();
  const { data: entityTags = [], isLoading: entityTagsLoading } = useEntityTags(entityId, entityType);
  const addTagMutation = useAddEntityTag();
  const removeTagMutation = useRemoveEntityTag();

  const availableTags = predefinedTags.filter(
    tag => !entityTags.some(entityTag => entityTag.tag_id === tag.id)
  );

  const handleAddTag = () => {
    if (!selectedTagId) return;
    
    addTagMutation.mutate({
      entityId,
      entityType,
      tagId: selectedTagId
    });
    
    setSelectedTagId("");
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate(tagId);
  };

  if (tagsLoading || entityTagsLoading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Manage Tags for {entityName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tags */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Tags</h4>
          {entityTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {entityTags.map((entityTag) => (
                <Badge
                  key={entityTag.id}
                  className={`${entityTag.predefined_tags.color_class} rounded-2xl flex items-center gap-1`}
                >
                  {entityTag.predefined_tags.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => handleRemoveTag(entityTag.id)}
                    disabled={removeTagMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No tags assigned</p>
          )}
        </div>

        {/* Add New Tag */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Add Tag</h4>
            <div className="flex gap-2">
              <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a tag to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${tag.color_class} rounded-2xl text-xs`}>
                          {tag.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({tag.category})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddTag}
                disabled={!selectedTagId || addTagMutation.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        {availableTags.length === 0 && entityTags.length > 0 && (
          <p className="text-muted-foreground text-sm">All available tags have been assigned</p>
        )}
      </CardContent>
    </Card>
  );
};