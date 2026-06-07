import { AdminPageHeader } from '@/components/admin/page-header'
import UsersTable from '@/components/users/users-table'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="User Control"
        title="Users (Points & Strikes)"
        description="Browse all accounts, search by username or email, and manage points, strikes, bans, and reports. Use the moderation queue filter for flagged users only."
      />
      <UsersTable />
    </div>
  )
}

