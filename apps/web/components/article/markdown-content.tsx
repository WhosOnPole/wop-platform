'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-gray-800 prose-pre:bg-gray-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

