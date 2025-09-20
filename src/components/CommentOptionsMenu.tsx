import { useState } from 'react';
import { MoreVertical, Flag, EyeOff, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReportComment, useDeleteComment, useHiddenComments } from '@/hooks/useCommentModeration';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';

interface CommentOptionsMenuProps {
  commentId: string;
  commentAuthorId: string;
  entityType: 'driver' | 'team' | 'track';
  entityId: string;
}

const REPORT_REASONS = [
  'Spam or unwanted commercial content',
  'Harassment or hate speech',
  'False information or misinformation',
  'Inappropriate content',
  'Copyright violation',
  'Other',
];

export const CommentOptionsMenu = ({
  commentId,
  commentAuthorId,
  entityType,
  entityId,
}: CommentOptionsMenuProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { hideComment, isHidden } = useHiddenComments();
  const reportMutation = useReportComment();
  const deleteMutation = useDeleteComment();

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  const canDelete = user && (user.id === commentAuthorId || isAdmin);
  const commentIsHidden = isHidden(commentId);

  const handleReport = async () => {
    if (!reportReason) return;
    
    await reportMutation.mutateAsync({
      commentId,
      entityType,
      reason: reportReason,
      additionalInfo: reportDetails,
    });
    
    setReportDialogOpen(false);
    setReportReason('');
    setReportDetails('');
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      commentId,
      entityType,
      entityId,
    });
    setDeleteDialogOpen(false);
  };

  const handleHide = () => {
    hideComment(commentId);
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
          
          {!commentIsHidden && (
            <DropdownMenuItem onClick={handleHide}>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">Reason for reporting</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="mt-2">
                {REPORT_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason} className="text-sm">{reason}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="report-details">Additional details (optional)</Label>
              <Textarea
                id="report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more context about why you're reporting this comment..."
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={!reportReason || reportMutation.isPending}
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};