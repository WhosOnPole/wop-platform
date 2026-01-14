export default function AdminStoriesStubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Admin: User Stories (Stub)</h1>
      <p className="text-gray-600">
        This is a placeholder page. Stories submitted via the Create menu should land here as
        pending approval. Approved stories will be pushed to the feed.
      </p>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-600">
        TODO: Implement fetching pending stories, approve/reject actions, and promotion to feed.
      </div>
    </div>
  )
}
