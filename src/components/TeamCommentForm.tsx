import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTeamComment } from '@/hooks/useTeamComments';
import { useSpamPrevention } from '@/hooks/useCommentModeration';

const commentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be 500 characters or less")
    .transform(val => val.trim()),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface TeamCommentFormProps {
  teamId: string;
  teamName: string;
}

export const TeamCommentForm = ({ teamId, teamName }: TeamCommentFormProps) => {
  const { canComment, timeRemaining, recordCommentTime } = useSpamPrevention();
  const createComment = useCreateTeamComment();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentFormData) => {
    if (!canComment) return;
    
    try {
      await createComment.mutateAsync({
        teamId,
        content: data.content,
      });
      form.reset();
      recordCommentTime();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        {!canComment && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Please wait {timeRemaining} seconds before posting another comment
            </p>
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            {...form.register("content")}
            placeholder={`Share your thoughts about ${teamName}...`}
            className="resize-none rounded-2xl"
            rows={4}
          />
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {500 - (form.watch("content")?.length || 0)} characters remaining
            </div>
            <Button
              type="submit"
              disabled={createComment.isPending || !canComment || !form.formState.isValid}
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
      </CardContent>
    </Card>
  );
};