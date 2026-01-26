'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="text-black prose prose-lg max-w-none prose-headings:text-black prose-p:text-black prose-a:text-sunset-gradient prose-strong:text-gray-900 prose-code:text-black prose-pre:bg-gray-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

