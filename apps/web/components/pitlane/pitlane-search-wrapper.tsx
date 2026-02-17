'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { PitlaneSearch } from './pitlane-search'
import { PitlaneTabs } from './pitlane-tabs'
import { PitlaneSearchResults } from './pitlane-search-results'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
  nationality?: string | null
  racing_number?: number | null
}

interface Team {
  id: string
  name: string
  image_url?: string | null
}

interface Track {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  country?: string | null
}

interface ScheduleTrack {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  country?: string | null
  start_date: string | null
  end_date: string | null
  circuit_ref?: string | null
}

interface PitlaneSearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const PitlaneSearchContext = createContext<PitlaneSearchContextType | undefined>(undefined)

function usePitlaneSearch() {
  const context = useContext(PitlaneSearchContext)
  if (!context) {
    throw new Error('usePitlaneSearch must be used within PitlaneSearchProvider')
  }
  return context
}

interface PitlaneSearchProviderProps {
  children: ReactNode
}

function PitlaneSearchProvider({ children }: PitlaneSearchProviderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <PitlaneSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </PitlaneSearchContext.Provider>
  )
}

interface PitlaneSearchWrapperProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  supabaseUrl?: string
}

export function PitlaneSearchWrapper({ drivers, teams, tracks, schedule, supabaseUrl }: PitlaneSearchWrapperProps) {
  return (
    <PitlaneSearchProvider>
      <PitlaneSearchComponent />
      <PitlaneTabsComponent 
        drivers={drivers} 
        teams={teams} 
        tracks={tracks}
        schedule={schedule}
        supabaseUrl={supabaseUrl}
      />
    </PitlaneSearchProvider>
  )
}

function PitlaneSearchComponent() {
  const { setSearchQuery } = usePitlaneSearch()
  return <PitlaneSearch onSearchChange={setSearchQuery} />
}

interface PitlaneSearchResultsWrapperProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  supabaseUrl?: string
}

function PitlaneSearchResultsWrapper({ drivers, teams, tracks, schedule, supabaseUrl }: PitlaneSearchResultsWrapperProps) {
  const { searchQuery, setSearchQuery } = usePitlaneSearch()
  
  const handleClose = () => {
    setSearchQuery('')
  }

  return (
    <PitlaneSearchResults
      searchQuery={searchQuery}
      drivers={drivers}
      teams={teams}
      tracks={tracks}
      schedule={schedule}
      onClose={handleClose}
      supabaseUrl={supabaseUrl}
    />
  )
}

interface PitlaneTabsComponentProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  supabaseUrl?: string
}

function PitlaneTabsComponent({ drivers, teams, tracks, schedule, supabaseUrl }: PitlaneTabsComponentProps) {
  const { searchQuery } = usePitlaneSearch()
  return (
    <div className="px-4 mb-10">
      <PitlaneTabs 
        drivers={drivers} 
        teams={teams} 
        tracks={tracks}
        schedule={schedule}
        searchQuery={searchQuery}
        supabaseUrl={supabaseUrl}
      />
    </div>
  )
}

export { PitlaneSearchComponent, PitlaneTabsComponent, PitlaneSearchProvider, PitlaneSearchResultsWrapper, usePitlaneSearch }
