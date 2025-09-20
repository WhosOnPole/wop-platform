import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommentSortOption, TimePeriod } from "@/hooks/useEnhancedComments";

interface CommentSortControlsProps {
  sortBy: CommentSortOption;
  timePeriod: TimePeriod;
  onSortChange: (sort: CommentSortOption) => void;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const CommentSortControls = ({
  sortBy,
  timePeriod,
  onSortChange,
  onTimePeriodChange,
}: CommentSortControlsProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortBy === 'popular' && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">From:</span>
          <Select value={timePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};