export default function AdminTipsStubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Admin: Track Tips (Stub)</h1>
      <p className="text-gray-600">
        This is a placeholder page. Tips submitted via the Create menu should appear here for
        approval. Approved tips attach to tracks; admins can mark or unmark top tips.
      </p>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-600">
        TODO: Implement pending tips list, approve/reject actions, and top-tip toggles per track.
      </div>
    </div>
  )
}
