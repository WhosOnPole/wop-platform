import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delete Your Data | Who\'s on Pole?',
  description: 'Request deletion of your account and associated data.',
}

export default function DeleteDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
