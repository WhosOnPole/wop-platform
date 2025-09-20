import { MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentCard } from "@/components/CommentCard";
import { CommentForm } from "@/components/CommentForm";
import { useDriverComments } from "@/hooks/useDriverComments";
import { useAuth } from "@/contexts/AuthContext";

interface DriverCommentsProps {
  driverId: string;
  driverName: string;
}

export const DriverComments = ({ driverId, driverName }: DriverCommentsProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = useDriverComments(driverId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {user && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}
        
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form - Only show if user is authenticated */}
      {user && (
        <CommentForm driverId={driverId} driverName={driverName} />
      )}
      
      {/* Comments Section */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Fan Comments
            {comments && comments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!comments || comments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your thoughts about {driverName}!
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
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};