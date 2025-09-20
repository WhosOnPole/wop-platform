import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateDriverComment } from "@/hooks/useDriverComments";
import { useSpamPrevention } from "@/hooks/useCommentModeration";
import { MessageSquarePlus } from "lucide-react";

const commentSchema = z.object({
  content: z
    .string()
    .min(5, "Comment must be at least 5 characters")
    .max(500, "Comment must be less than 500 characters")
    .trim(),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  driverId: string;
  driverName: string;
}

export const CommentForm = ({ driverId, driverName }: CommentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { canComment, timeRemaining, recordCommentTime } = useSpamPrevention();
  const createComment = useCreateDriverComment();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentFormData) => {
    if (!canComment) return;
    
    setIsSubmitting(true);
    try {
      await createComment.mutateAsync({
        driver_id: driverId,
        content: data.content,
      });
      form.reset();
      recordCommentTime();
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = form.watch("content")?.length || 0;
  const isOverLimit = characterCount > 500;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="w-5 h-5" />
          Share your thoughts about {driverName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!canComment && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Please wait {timeRemaining} seconds before posting another comment
            </p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you think about this driver? Share your thoughts, insights, or favorite moments..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <p className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {characterCount}/500
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isSubmitting || !canComment || isOverLimit || characterCount < 5}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Comment"}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Comments are reviewed before appearing publicly to maintain a positive community environment.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};