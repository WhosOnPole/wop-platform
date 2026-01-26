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
    <div className="space-y-3 px-4 mb-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
        <input
          type="search"
          placeholder="Search pit lane"
          value={searchQuery}
          onChange={handleChange}
          className="w-full rounded-full bg-[#FFFFFF29] text-[#6B6B6B] px-12 py-[.45em] text-sm shadow-sm focus:border-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-[#6B6B6B]"
        />
      </div>
    </div>
  )
}
