import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, Plus, X } from "lucide-react";
import { useDrivers } from "@/hooks/useDrivers";
import { useTagDriversInPost, usePostDrivers } from "@/hooks/useDriverFanPosts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DriverTagSelectorProps {
  fanPostId: string;
}

export const DriverTagSelector = ({ fanPostId }: DriverTagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  
  const { data: drivers } = useDrivers();
  const { data: currentDriverIds } = usePostDrivers(fanPostId);
  const tagDrivers = useTagDriversInPost();

  useEffect(() => {
    if (currentDriverIds) {
      setSelectedDrivers(currentDriverIds);
    }
  }, [currentDriverIds]);

  const handleDriverToggle = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleSave = () => {
    tagDrivers.mutate({ 
      fanPostId, 
      driverIds: selectedDrivers 
    }, {
      onSuccess: () => {
        setIsOpen(false);
      }
    });
  };

  const getSelectedDriverNames = () => {
    if (!drivers || !currentDriverIds) return [];
    return drivers
      .filter(d => currentDriverIds.includes(d.id))
      .map(d => d.name);
  };

  const selectedDriverNames = getSelectedDriverNames();

  return (
    <div className="border-t border-border pt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto">
            <div className="flex items-center gap-2 w-full">
              <Tag className="h-4 w-4" />
              <span className="text-sm">
                {selectedDriverNames.length > 0 
                  ? `Tagged: ${selectedDriverNames.join(', ')}`
                  : 'Tag drivers mentioned'
                }
              </span>
              {isOpen ? <X className="h-3 w-3 ml-auto" /> : <Plus className="h-3 w-3 ml-auto" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Select Drivers Featured in This Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-2">
                {drivers?.map((driver) => (
                  <div key={driver.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={driver.id}
                      checked={selectedDrivers.includes(driver.id)}
                      onCheckedChange={() => handleDriverToggle(driver.id)}
                    />
                    <label 
                      htmlFor={driver.id} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {driver.name}
                      {driver.teams && (
                        <span className="text-muted-foreground ml-1">
                          ({driver.teams.name})
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSave}
                  disabled={tagDrivers.isPending}
                  size="sm"
                  className="flex-1"
                >
                  Save Tags
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              
              {selectedDrivers.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Selected drivers:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDrivers.map(driverId => {
                      const driver = drivers?.find(d => d.id === driverId);
                      return (
                        <Badge key={driverId} variant="secondary" className="text-xs">
                          {driver?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};