import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Calendar, TrendingUp, History } from 'lucide-react';
import { TimeWindow, SortMode } from '@/hooks/useHotComments';

interface CommentsHighlightsTabsProps {
  sortMode: SortMode;
  timeWindow: TimeWindow;
  onSortModeChange: (mode: SortMode) => void;
  onTimeWindowChange: (window: TimeWindow) => void;
  hotCommentCount: number;
  newCommentCount: number;
}

export const CommentsHighlightsTabs = ({
  sortMode,
  timeWindow,
  onSortModeChange,
  onTimeWindowChange,
  hotCommentCount,
  newCommentCount
}: CommentsHighlightsTabsProps) => {
  
  const timeWindowOptions = [
    { value: 'day' as TimeWindow, label: 'Day', icon: Calendar },
    { value: 'week' as TimeWindow, label: 'Week', icon: Calendar },
    { value: 'month' as TimeWindow, label: 'Month', icon: Calendar },
    { value: 'all' as TimeWindow, label: 'All-Time', icon: History },
  ];

  return (
    <div className="space-y-4">
      {/* Main Sort Mode Tabs */}
      <Tabs value={sortMode} onValueChange={(value) => onSortModeChange(value as SortMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hot" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Hot
            {hotCommentCount > 0 && (
              <Badge variant="secondary" className="text-xs py-0 px-1 ml-1">
                {hotCommentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            New
            {newCommentCount > 0 && (
              <Badge variant="secondary" className="text-xs py-0 px-1 ml-1">
                {newCommentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Time Window Filter - Only show for Hot mode */}
      {sortMode === 'hot' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
            <TrendingUp className="h-4 w-4" />
            Trending:
          </div>
          <div className="flex gap-1">
            {timeWindowOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={timeWindow === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => onTimeWindowChange(option.value)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* New mode time info */}
      {sortMode === 'new' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Showing newest comments from all time</span>
        </div>
      )}
    </div>
  );
};