import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

// Local storage keys for hidden comments
const HIDDEN_COMMENTS_KEY = 'hidden_comments';
const LAST_COMMENT_TIME_KEY = 'last_comment_time';
const COMMENT_COOLDOWN_MS = 30000; // 30 seconds between comments

interface ReportCommentData {
  commentId: string;
  entityType: 'driver' | 'team' | 'track';
  reason: string;
  additionalInfo?: string;
}

// Hook for managing hidden comments (client-side)
export const useHiddenComments = () => {
  const [hiddenComments, setHiddenComments] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HIDDEN_COMMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const hideComment = (commentId: string) => {
    const updated = [...hiddenComments, commentId];
    setHiddenComments(updated);
    localStorage.setItem(HIDDEN_COMMENTS_KEY, JSON.stringify(updated));
  };

  const unhideComment = (commentId: string) => {
    const updated = hiddenComments.filter(id => id !== commentId);
    setHiddenComments(updated);
    localStorage.setItem(HIDDEN_COMMENTS_KEY, JSON.stringify(updated));
  };

  const isHidden = (commentId: string) => hiddenComments.includes(commentId);

  return { hideComment, unhideComment, isHidden, hiddenComments };
};

// Hook for spam prevention
export const useSpamPrevention = () => {
  const [canComment, setCanComment] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkCooldown = () => {
      const lastCommentTime = localStorage.getItem(LAST_COMMENT_TIME_KEY);
      if (lastCommentTime) {
        const timeSince = Date.now() - parseInt(lastCommentTime);
        if (timeSince < COMMENT_COOLDOWN_MS) {
          const remaining = Math.ceil((COMMENT_COOLDOWN_MS - timeSince) / 1000);
          setTimeRemaining(remaining);
          setCanComment(false);
          
          const timer = setTimeout(() => {
            setCanComment(true);
            setTimeRemaining(0);
          }, COMMENT_COOLDOWN_MS - timeSince);
          
          return () => clearTimeout(timer);
        }
      }
      setCanComment(true);
      setTimeRemaining(0);
    };

    checkCooldown();
  }, []);

  const recordCommentTime = () => {
    localStorage.setItem(LAST_COMMENT_TIME_KEY, Date.now().toString());
    setCanComment(false);
    setTimeRemaining(30);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setCanComment(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return { canComment, timeRemaining, recordCommentTime };
};

// Hook for reporting comments
export const useReportComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ReportCommentData) => {
      if (!user) throw new Error('User must be logged in to report');

      // For now, we'll log the report. In a real app, this would go to a reports table
      console.log('Comment Report:', {
        reporterId: user.id,
        commentId: data.commentId,
        entityType: data.entityType,
        reason: data.reason,
        additionalInfo: data.additionalInfo,
        timestamp: new Date().toISOString(),
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Report Submitted',
        description: 'Thank you for helping keep our community safe. The comment has been reported for review.',
      });
    },
    onError: (error) => {
      console.error('Error reporting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Hook for deleting comments (admin/author only)
export const useDeleteComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      entityType, 
      entityId 
    }: { 
      commentId: string; 
      entityType: 'driver' | 'team' | 'track';
      entityId: string;
    }) => {
      if (!user) throw new Error('User must be logged in');

      let error;
      if (entityType === 'driver') {
        const result = await supabase.from('driver_comments').delete().eq('id', commentId);
        error = result.error;
      } else if (entityType === 'team') {
        const result = await supabase.from('team_comments').delete().eq('id', commentId);
        error = result.error;
      } else {
        const result = await supabase.from('track_comments').delete().eq('id', commentId);
        error = result.error;
      }

      if (error) throw error;

      return { commentId, entityType, entityId };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: [`enhanced-${data.entityType}-comments`, data.entityId] 
      });
      
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been successfully deleted.',
      });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. You may not have permission.',
        variant: 'destructive',
      });
    },
  });
};