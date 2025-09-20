import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableBioProps {
  shortBio?: string | null;
  fullBio?: string | null;
  className?: string;
}

export const ExpandableBio = ({ shortBio, fullBio, className = '' }: ExpandableBioProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If we only have one bio, show it as is
  if (!shortBio && !fullBio) return null;
  if (!shortBio && fullBio) return <p className={`text-muted-foreground leading-relaxed ${className}`}>{fullBio}</p>;
  if (shortBio && !fullBio) return <p className={`text-muted-foreground leading-relaxed ${className}`}>{shortBio}</p>;

  // We have both bios - show expandable version
  return (
    <div className={className}>
      <p className="text-muted-foreground leading-relaxed mb-3">
        {shortBio}
      </p>
      
      {fullBio && (
        <>
          {isExpanded && (
            <p className="text-muted-foreground leading-relaxed mb-3">
              {fullBio}
            </p>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-auto p-0 text-primary hover:text-primary/80 font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Read more
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};