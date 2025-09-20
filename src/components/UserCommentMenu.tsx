import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, EyeOff } from 'lucide-react';

interface UserCommentMenuProps {
  commentId: string;
  onAction: (action: string) => void;
}

export const UserCommentMenu: React.FC<UserCommentMenuProps> = ({
  commentId,
  onAction
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-3 w-3" />
          <span className="sr-only">Comment options</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => onAction('hide')}
          className="text-muted-foreground"
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Hide on my profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};