import { useAuth } from '@/contexts/AuthContext';
import { useTrackComments, useCreateTrackComment } from '@/hooks/useTrackComments';
import { EnhancedCommentCard } from '@/components/EnhancedCommentCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const commentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be 500 characters or less")
    .transform(val => val.trim()),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface TrackCommentsProps {
  trackId: string;
  trackName: string;
}

const TrackComments = ({ trackId, trackName }: TrackCommentsProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = useTrackComments(trackId);
  const createComment = useCreateTrackComment();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentFormData) => {
    try {
      await createComment.mutateAsync({
        trackId,
        content: data.content,
      });
      form.reset();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments about {trackName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Textarea
              {...form.register("content")}
              placeholder={`Share your thoughts about ${trackName}...`}
              className="resize-none rounded-2xl"
              rows={4}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {500 - (form.watch("content")?.length || 0)} characters remaining
              </div>
              <Button
                type="submit"
                disabled={createComment.isPending || !form.formState.isValid}
                className="rounded-2xl"
              >
                {createComment.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
            {form.formState.errors.content && (
              <p className="text-sm text-destructive">
                {form.formState.errors.content.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Your comment will be reviewed before appearing.
            </p>
          </form>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="mb-4">Sign in to share your thoughts about {trackName}</p>
            <Link to="/auth">
              <Button className="rounded-2xl">Sign In</Button>
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <EnhancedCommentCard key={comment.id} comment={comment} type="track_comment" />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet.</p>
              {!user && (
                <p className="mt-2">
                  <Link to="/auth" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to be the first to comment!
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackComments;