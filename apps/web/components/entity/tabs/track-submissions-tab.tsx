interface TrackTip {
  id: string
  tip_content: string
  image_url?: string | null
  created_at: string
  user?: {
    id: string
    username: string
    profile_image_url?: string | null
  } | null
}

interface TrackSubmissionsTabProps {
  submissions: TrackTip[]
  typeLabel: string
}

export function TrackSubmissionsTab({ submissions, typeLabel }: TrackSubmissionsTabProps) {
  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center">
          <p className="text-white/60">No {typeLabel.toLowerCase()} submitted yet.</p>
        </div>
      ) : (
        submissions.map((submission) => (
          <div
            key={submission.id}
            className="rounded-lg border border-white/20 bg-white/5 p-6"
          >
            <div className="mb-3 flex items-center space-x-3">
              {submission.user?.profile_image_url ? (
                <img
                  src={submission.user.profile_image_url}
                  alt={submission.user.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <span className="text-xs font-medium text-white">
                    {submission.user?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {submission.user?.username || 'Unknown'}
                </p>
                <p className="text-xs text-white/60">
                  {new Date(submission.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {submission.image_url && (
              <div className="mb-3">
                <img
                  src={submission.image_url}
                  alt="Submission"
                  className="max-h-64 w-full rounded-lg object-cover"
                />
              </div>
            )}
            <p className="text-white/90">{submission.tip_content}</p>
          </div>
        ))
      )}
    </div>
  )
}
