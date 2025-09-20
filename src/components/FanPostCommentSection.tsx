import { useState } from "react";
import { MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversalCommentCard } from "@/components/UniversalCommentCard";
import { useFanPostComments, useCreateFanPostComment } from "@/hooks/useFanPostComments";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface FanPostCommentSectionProps {
  fanPostId: string;
  isExpanded?: boolean;
}

export const FanPostCommentSection = ({ fanPostId, isExpanded = false }: FanPostCommentSectionProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = useFanPostComments(fanPostId);
  const createComment = useCreateFanPostComment();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = async (data: CommentFormData) => {
    try {
      await createComment.mutateAsync({
        fan_post_id: fanPostId,
        content: data.content.trim(),
      });
      form.reset();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowForm(!showForm)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{comments?.length || 0} comments</span>
      </Button>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments
          {comments && comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {user && (
          <div className="space-y-4">
            {!showForm ? (
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="w-full justify-start text-muted-foreground"
              >
                Write a comment...
              </Button>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <Textarea
                  {...form.register("content")}
                  placeholder="Share your thoughts..."
                  className="resize-none rounded-2xl"
                  rows={3}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.content.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createComment.isPending}
                    className="rounded-2xl"
                  >
                    {createComment.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      form.reset();
                    }}
                    className="rounded-2xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Comments List */}
        {!comments || comments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your thoughts!
            </p>
            {!user && (
              <p className="text-sm text-muted-foreground">
                Sign in to leave a comment and join the conversation.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <UniversalCommentCard
                key={comment.id}
                comment={comment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};