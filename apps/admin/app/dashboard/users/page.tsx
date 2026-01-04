import UsersTable from '@/components/users/users-table'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users (Points & Strikes)</h1>
        <p className="text-gray-600">
          Review users with strikes or low points. Adjust points, reset strikes, ban/unban, and view
          related reports.
        </p>
      </div>
      <UsersTable />
    </div>
  )
}

