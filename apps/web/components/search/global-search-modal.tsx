'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getAvatarUrl } from '@/utils/avatar'
import { getTeamIconUrl } from '@/utils/storage-urls'

interface ProfileResult {
  id: string
  username: string
  profile_image_url: string | null
}

interface DriverResult {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
}

interface TeamResult {
  id: string
  name: string
  image_url?: string | null
}

interface TrackResult {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  country?: string | null
  circuit_ref?: string | null
}

interface GlobalSearchModalProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const supabase = createClientComponentClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue({ value: query, delayMs: 150 })

  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<GlobalSearchResults>({
    profiles: [],
    drivers: [],
    teams: [],
    tracks: [],
  })
  const [results, setResults] = useState<GlobalSearchResults>({
    profiles: [],
    drivers: [],
    teams: [],
    tracks: [],
  })

  const activeQuery = debouncedQuery.trim()
  const usernameQuery = normalizeUsernameQuery(activeQuery)
  const hasQuery = activeQuery.length > 0
  const activeResults = hasQuery ? results : suggestions

  const hasAnyResults = useMemo(() => {
    return (
      activeResults.profiles.length > 0 ||
      activeResults.drivers.length > 0 ||
      activeResults.teams.length > 0 ||
      activeResults.tracks.length > 0
    )
  }, [activeResults])

  useEffect(() => {
    if (!open) return

    setQuery('')
    setResults({ profiles: [], drivers: [], teams: [], tracks: [] })

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const t = window.setTimeout(() => inputRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    async function loadSuggestions() {
      const id = ++requestIdRef.current
      setIsLoading(true)
      try {
        const [profilesRes, driversRes, teamsRes, tracksRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, profile_image_url')
            .not('username', 'is', null)
            .order('username', { ascending: true })
            .limit(8),
          supabase.from('drivers').select('id, name, headshot_url, image_url').eq('active', true).order('name', { ascending: true }).limit(8),
          supabase.from('teams').select('id, name, image_url').eq('active', true).order('name', { ascending: true }).limit(8),
          supabase.from('tracks').select('id, name, image_url, location, country, circuit_ref').order('name', { ascending: true }).limit(8),
        ])

        if (id !== requestIdRef.current) return

        setSuggestions({
          profiles: (profilesRes.data || []).filter((p) => !!p.username) as ProfileResult[],
          drivers: (driversRes.data || []) as DriverResult[],
          teams: (teamsRes.data || []) as TeamResult[],
          tracks: (tracksRes.data || []) as TrackResult[],
        })
      } finally {
        if (id === requestIdRef.current) setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [open, supabase])

  useEffect(() => {
    if (!open) return
    if (!activeQuery) return

    async function searchAll() {
      const id = ++requestIdRef.current
      setIsLoading(true)
      try {
        const q = activeQuery
        const qUser = usernameQuery

        const [profilesRes, driversRes, teamsRes, tracksRes] = await Promise.all([
          qUser && qUser !== q
            ? supabase
                .from('profiles')
                .select('id, username, profile_image_url')
                .not('username', 'is', null)
                .or(`username.ilike.%${q}%,username.ilike.%${qUser}%`)
                .limit(12)
            : supabase
                .from('profiles')
                .select('id, username, profile_image_url')
                .not('username', 'is', null)
                .ilike('username', `%${q}%`)
                .limit(12),
          supabase.from('drivers').select('id, name, headshot_url, image_url').eq('active', true).ilike('name', `%${q}%`).limit(12),
          supabase.from('teams').select('id, name, image_url').eq('active', true).ilike('name', `%${q}%`).limit(12),
          supabase
            .from('tracks')
            .select('id, name, image_url, location, country, circuit_ref')
            .or(`name.ilike.%${q}%,circuit_ref.ilike.%${q}%`)
            .limit(12),
        ])

        if (id !== requestIdRef.current) return

        setResults({
          profiles: rankByQuery(
            (profilesRes.data || []).filter((p) => !!p.username) as ProfileResult[],
            qUser || q,
            (p) => p.username
          ),
          drivers: rankByQuery((driversRes.data || []) as DriverResult[], q, (d) => d.name),
          teams: rankByQuery((teamsRes.data || []) as TeamResult[], q, (t) => t.name),
          tracks: rankByQuery((tracksRes.data || []) as TrackResult[], q, (t) => t.name),
        })
      } finally {
        if (id === requestIdRef.current) setIsLoading(false)
      }
    }

    searchAll()
  }, [activeQuery, open, supabase, usernameQuery])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-4xl flex-col">
        <div className="border-b border-white/10 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drivers, teams, tracks, users…"
                className="w-full rounded-full bg-white/10 px-10 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#3BEFEB]/40"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              {isLoading ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/60" />
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <p className="mt-2 text-xs text-white/50">
            {hasQuery ? (
              <>
                Showing results for <span className="text-white/80">&quot;{activeQuery}&quot;</span>
              </>
            ) : (
              <>Start typing for instant matches (suggestions shown below).</>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {!hasAnyResults ? (
            <div className="py-10 text-center text-sm text-white/60">
              {hasQuery ? 'No matches yet.' : 'Try searching for a driver, team, track, or username.'}
            </div>
          ) : (
            <div className="space-y-8">
              {activeResults.drivers.length > 0 ? (
                <ResultSection title={`Drivers (${activeResults.drivers.length})`}>
                  {activeResults.drivers.map((d) => (
                    <ResultRow
                      key={d.id}
                      href={`/drivers/${slugify(d.name)}`}
                      label={d.name}
                      sublabel="Driver"
                      imageUrl={d.headshot_url || d.image_url || null}
                      fallback={d.name.charAt(0).toUpperCase()}
                      onSelect={onClose}
                    />
                  ))}
                </ResultSection>
              ) : null}

              {activeResults.teams.length > 0 ? (
                <ResultSection title={`Teams (${activeResults.teams.length})`}>
                  {activeResults.teams.map((t) => (
                    <ResultRow
                      key={t.id}
                      href={`/teams/${slugify(t.name)}`}
                      label={t.name}
                      sublabel="Team"
                      imageUrl={supabaseUrl ? getTeamIconUrl(t.name, supabaseUrl) : t.image_url || null}
                      fallback={t.name.charAt(0).toUpperCase()}
                      onSelect={onClose}
                      imageVariant="team"
                    />
                  ))}
                </ResultSection>
              ) : null}

              {activeResults.tracks.length > 0 ? (
                <ResultSection title={`Tracks (${activeResults.tracks.length})`}>
                  {activeResults.tracks.map((t) => (
                    <ResultRow
                      key={t.id}
                      href={`/tracks/${slugify(t.name)}`}
                      label={t.circuit_ref ? `${t.circuit_ref} — ${t.name}` : t.name}
                      sublabel="Track"
                      imageUrl={t.image_url || null}
                      fallback={t.name.charAt(0).toUpperCase()}
                      onSelect={onClose}
                    />
                  ))}
                </ResultSection>
              ) : null}

              {activeResults.profiles.length > 0 ? (
                <ResultSection title={`Users (${activeResults.profiles.length})`}>
                  {activeResults.profiles.map((p) => (
                    <ResultRow
                      key={p.id}
                      href={`/u/${p.username}`}
                      label={p.username}
                      sublabel="User"
                      imageUrl={getAvatarUrl(p.profile_image_url)}
                      fallback={p.username.charAt(0).toUpperCase()}
                      onSelect={onClose}
                    />
                  ))}
                </ResultSection>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface GlobalSearchResults {
  profiles: ProfileResult[]
  drivers: DriverResult[]
  teams: TeamResult[]
  tracks: TrackResult[]
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function ResultRow(params: {
  href: string
  label: string
  sublabel: string
  imageUrl: string | null
  fallback: string
  onSelect: () => void
  imageVariant?: 'default' | 'team'
}) {
  const { href, label, sublabel, imageUrl, fallback, onSelect, imageVariant = 'default' } = params
  const isTeam = imageVariant === 'team'

  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors"
    >
      <div className={`h-10 w-10 overflow-hidden rounded-full ${isTeam ? 'bg-white/10 p-2' : 'bg-white/10'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className={`h-full w-full ${isTeam ? 'object-contain brightness-0 invert' : 'object-cover'}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
            {fallback}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/50">{sublabel}</div>
      </div>
    </Link>
  )
}

function useDebouncedValue<T>(params: { value: T; delayMs: number }) {
  const { value, delayMs } = params
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])

  return debounced
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '-')
}

function rankByQuery<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items

  return [...items].sort((a, b) => {
    const aText = getText(a).toLowerCase()
    const bText = getText(b).toLowerCase()

    const aRank = scoreText(aText, q)
    const bRank = scoreText(bText, q)
    if (aRank !== bRank) return aRank - bRank

    return aText.localeCompare(bText)
  })
}

function scoreText(text: string, q: string) {
  if (text === q) return 0
  if (text.startsWith(q)) return 1
  if (text.includes(q)) return 2
  return 3
}

function normalizeUsernameQuery(query: string) {
  const raw = query.trim()
  if (!raw) return ''

  const withoutPrefix = raw.startsWith('@') ? raw.slice(1) : raw
  return withoutPrefix
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}

