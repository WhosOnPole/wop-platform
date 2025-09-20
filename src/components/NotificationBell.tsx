import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications();

  if (!user) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case 'follow':
        return '👤';
      case 'fan_post_approved':
        return '✅';
      case 'grid_likes_milestone':
        return '🏆';
      case 'poll_results':
        return '📊';
      default:
        return '🔔';
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const { kind, payload } = notification;
    
    switch (kind) {
      case 'follow':
        return `${payload.follower_display_name || payload.follower_username} started following you`;
      case 'fan_post_approved':
        return 'Your fan post has been approved and is now live!';
      case 'grid_likes_milestone':
        return `Your grid reached ${payload.milestone} likes! 🎉`;
      case 'poll_results':
        return `Results are in for the poll "${payload.poll_title}"`;
      default:
        return 'You have a new notification';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    const { kind, payload } = notification;
    
    switch (kind) {
      case 'follow':
        navigate(`/u/${payload.follower_username}`);
        break;
      case 'fan_post_approved':
        // Could navigate to the user's own profile or fan posts section
        navigate('/profile');
        break;
      case 'grid_likes_milestone':
        navigate('/my-grid');
        break;
      case 'poll_results':
        if (payload.poll_id) {
          navigate(`/polls/${payload.poll_id}`);
        } else {
          navigate('/polls');
        }
        break;
      default:
        break;
    }
    
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "p-3 cursor-pointer focus:bg-accent",
                    !notification.read_at && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0">
                      {notification.kind === 'follow' && notification.payload.follower_avatar_url ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={notification.payload.follower_avatar_url} />
                          <AvatarFallback>
                            {notification.payload.follower_username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                          {getNotificationIcon(notification.kind)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    
                    {!notification.read_at && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;