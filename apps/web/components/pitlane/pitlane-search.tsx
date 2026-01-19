'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface PitlaneSearchProps {
  onSearchChange: (query: string) => void
}

export function PitlaneSearch({ onSearchChange }: PitlaneSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearchChange(value)
  }

  return (
    <div className="space-y-3 px-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#838383]" />
        <input
          type="search"
          placeholder="Search pit lane"
          value={searchQuery}
          onChange={handleChange}
          className="w-full rounded-full bg-[#1D1D1D] px-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  )
}
