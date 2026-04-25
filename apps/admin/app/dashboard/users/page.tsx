import { AdminPageHeader } from '@/components/admin/page-header'
import UsersTable from '@/components/users/users-table'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="User Control"
        title="Users (Points & Strikes)"
        description="Review users with strikes or low points. Adjust points, reset strikes, ban or unban, and view related reports."
      />
      <UsersTable />
    </div>
  )
}

