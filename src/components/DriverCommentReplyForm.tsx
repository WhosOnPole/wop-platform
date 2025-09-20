import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDriverCommentReply } from "@/hooks/useDriverCommentReplies";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(500, "Reply is too long"),
});

type ReplyFormData = z.infer<typeof replySchema>;

interface DriverCommentReplyFormProps {
  commentId: string;
  onCancel: () => void;
}

export const DriverCommentReplyForm = ({ commentId, onCancel }: DriverCommentReplyFormProps) => {
  const createReply = useCreateDriverCommentReply();

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: "" },
  });

  const onSubmit = async (data: ReplyFormData) => {
    try {
      await createReply.mutateAsync({
        parent_comment_id: commentId,
        content: data.content.trim(),
      });
      form.reset();
      onCancel();
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-4">
      <Textarea
        {...form.register("content")}
        placeholder="Write your reply..."
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
          disabled={createReply.isPending}
          className="rounded-2xl"
        >
          {createReply.isPending ? "Posting..." : "Post Reply"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="rounded-2xl"
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your reply will be reviewed before appearing.
      </p>
    </form>
  );
};