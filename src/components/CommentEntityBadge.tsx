import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Flag, MapPin, Crown } from 'lucide-react';

interface CommentEntityBadgeProps {
  entityType: 'driver' | 'team' | 'track' | 'team_principal';
  entityName: string;
  entityImage?: string;
  additionalInfo?: string;
  size?: 'sm' | 'md';
}

export const CommentEntityBadge: React.FC<CommentEntityBadgeProps> = ({
  entityType,
  entityName,
  entityImage,
  additionalInfo,
  size = 'sm'
}) => {
  const getIcon = () => {
    switch (entityType) {
      case 'driver':
        return <User className="h-3 w-3" />;
      case 'team':
        return <Flag className="h-3 w-3" />;
      case 'track':
        return <MapPin className="h-3 w-3" />;
      case 'team_principal':
        return <Crown className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getColorClass = () => {
    switch (entityType) {
      case 'driver':
        return 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950';
      case 'team':
        return 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950';
      case 'track':
        return 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950';
      case 'team_principal':
        return 'border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950';
      default:
        return 'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950';
    }
  };

  const avatarSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 ${getColorClass()}`}>
      {getIcon()}
      
      {entityImage && (
        <Avatar className={avatarSize}>
          <AvatarImage src={entityImage} alt={entityName} />
          <AvatarFallback className="text-xs">
            {entityName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <span className={`font-medium ${textSize}`}>
        {entityName}
      </span>
      
      {additionalInfo && (
        <span className={`${textSize} opacity-75`}>
          • {additionalInfo}
        </span>
      )}
    </Badge>
  );
};