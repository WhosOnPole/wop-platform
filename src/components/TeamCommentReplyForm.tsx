import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTeamCommentReply } from '@/hooks/useTeamCommentReplies';

interface TeamCommentReplyFormProps {
  commentId: string;
  onCancel: () => void;
}

export const TeamCommentReplyForm: React.FC<TeamCommentReplyFormProps> = ({
  commentId,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const createReply = useCreateTeamCommentReply();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createReply.mutate(
        { commentId, content: content.trim() },
        {
          onSuccess: () => {
            setContent('');
            onCancel();
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 p-3 bg-muted/50 rounded-lg">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        className="min-h-[80px] resize-none"
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/500
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || createReply.isPending}
          >
            {createReply.isPending ? 'Posting...' : 'Reply'}
          </Button>
        </div>
      </div>
    </form>
  );
};