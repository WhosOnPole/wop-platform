'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTeamIconUrl } from '@/utils/storage-urls'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
  nationality?: string | null
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
  race_day_date: string | null
  circuit_ref?: string | null
}

interface PitlaneTabsProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  searchQuery: string
  supabaseUrl?: string
}

type TabKey = 'drivers' | 'teams' | 'tracks' | 'schedule'

export function PitlaneTabs({ drivers = [], teams = [], tracks = [], schedule = [], searchQuery = '', supabaseUrl }: PitlaneTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('drivers')

  // Filter function for search
  const filterItems = <T extends { name: string }>(items: T[] | undefined, query: string): T[] => {
    if (!items) return []
    if (!query.trim()) return items
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lowerQuery))
  }

  // Special filter for schedule that includes circuit_ref
  const filterSchedule = (items: ScheduleTrack[] | undefined, query: string): ScheduleTrack[] => {
    if (!items) return []
    if (!query.trim()) return items
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(lowerQuery)
      const circuitRefMatch = item.circuit_ref?.toLowerCase().includes(lowerQuery) || false
      return nameMatch || circuitRefMatch
    })
  }

  const filteredDrivers = useMemo(() => filterItems(drivers, searchQuery), [drivers, searchQuery])
  const filteredTeams = useMemo(() => filterItems(teams, searchQuery), [teams, searchQuery])
  const filteredTracks = useMemo(() => filterItems(tracks, searchQuery), [tracks, searchQuery])
  const filteredSchedule = useMemo(() => filterSchedule(schedule, searchQuery), [schedule, searchQuery])

  const items = useMemo(() => {
    if (activeTab === 'drivers') return filteredDrivers
    if (activeTab === 'teams') return filteredTeams
    if (activeTab === 'schedule') return filteredSchedule
    return filteredTracks
  }, [activeTab, filteredDrivers, filteredTeams, filteredTracks, filteredSchedule])

  return (
    <section>
      <sup className="w-full text-left block text-xs text-[#838383] ">Explore the sport and voice your opinion</sup>
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden">
        <div className="flex w-full">
          <TabButton
            label="DRIVERS"
            active={activeTab === 'drivers'}
            onClick={() => setActiveTab('drivers')}
            showDivider={true}
          />
          <TabButton
            label="TRACKS"
            active={activeTab === 'tracks'}
            onClick={() => setActiveTab('tracks')}
            showDivider={true}
          />
          <TabButton
            label="TEAMS"
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
            showDivider={true}
          />
          <TabButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                <path d="M3.27769 0V1.45494C3.27769 1.54871 3.40449 1.8659 3.45687 1.96244C3.90895 2.79679 5.10945 2.84092 5.65664 2.07001C5.7228 1.97623 5.89095 1.61905 5.89095 1.51975V0H11.1175V1.55285C11.1175 2.02174 11.797 2.57062 12.2449 2.61475C12.9258 2.68232 13.7307 2.14724 13.7307 1.42184V0H15.1849C16.1497 0 17.0304 1.03294 16.9973 1.97761V13.6805C16.9394 14.6776 16.424 15.4113 15.4316 15.643C10.9576 15.7533 6.46571 15.6568 1.98484 15.6912C1.01038 15.6319 0.27023 15.0955 0.0565926 14.1218C-0.0274839 9.96528 -0.00680938 5.78251 0.0469445 1.62181C0.150317 0.790217 1.01451 0 1.85666 0H3.27769ZM1.36598 3.9235L1.31636 3.97315V13.7798C1.31636 13.795 1.36322 13.9508 1.37425 13.9826C1.48727 14.2956 1.74777 14.3563 2.04962 14.3853H14.9244C15.2124 14.3673 15.5074 14.3025 15.619 14.0019C15.6356 13.955 15.6907 13.7481 15.6907 13.715V3.97177L15.6411 3.92212H1.36598V3.9235Z" fill="white" fillOpacity="0.4"/>
              </svg>
            }
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          />
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 h-[400px] overflow-scroll">
        {activeTab === 'schedule' ? (
          <div className="space-y-0 md:grid md:grid-cols-2 md:gap-4">
            {!filteredSchedule || filteredSchedule.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50 md:col-span-2">
                {searchQuery ? 'No races found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              filteredSchedule.map((race) => (
                <ScheduleCard key={race.id} race={race} />
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-x-7 gap-y-6 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50">
                {searchQuery ? 'No results found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              items.map((item) => {
                if (activeTab === 'drivers') {
                  const driver = item as Driver
                  const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
                  const imageSrc = driver.headshot_url || driver.image_url
                  return (
                    <Link
                      key={driver.id}
                      href={`/drivers/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-25 h-28 overflow-hidden rounded-2xl">
                        <Avatar src={imageSrc} alt={driver.name} fallback={driver.name.charAt(0)} />
                      </div>
                    </Link>
                  )
                }

                if (activeTab === 'teams') {
                  const team = item as Team
                  const slug = team.name.toLowerCase().replace(/\s+/g, '-')
                  const iconUrl = supabaseUrl ? getTeamIconUrl(team.name, supabaseUrl) : null
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }}
                        />
                        <Avatar src={iconUrl} alt={team.name} fallback={team.name.charAt(0)} variant="team" />
                      </div>
                    </Link>
                  )
                }

                const track = item as Track
                const slug = track.name.toLowerCase().replace(/\s+/g, '-')
                const countryText = track.country ? track.country.toUpperCase() : ''
                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }}
                      />
                      {/* Overlay gradient for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Vertical country name on left edge */}
                      {countryText && (
                        <div className="absolute left-1 top-1 flex flex-col items-start z-10">
                          <div 
                            className="text-white font-bold leading-tight"
                            style={{
                              fontSize: '7px',
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '0',
                            }}
                          >
                            {countryText.split('').map((char, i) => (
                              <span key={i} className="block">{char}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Track SVG outline in center */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="72" height="48" viewBox="0 0 288 192" fill="none" className="opacity-80">
                          <path d="M264.48 192C260.123 192 256.579 188.458 256.566 184.1C256.46 184.097 256.354 184.09 256.248 184.087C255.683 184.064 255.108 184.042 254.513 184.039L172.789 183.794L95.9837 183.576L87.1414 183.447L40.2049 183.373H38.1164L15.2008 183.276C13.9927 186.149 11.1588 188.124 7.91036 188.124C3.54702 188.124 -0.00341797 184.569 -0.00341797 180.201C-0.00341797 175.833 3.54702 172.279 7.91036 172.279C9.42051 172.279 10.8857 172.719 12.1388 173.511L16.0458 168.927C16.6885 168.171 17.2443 167.444 17.8098 166.614C17.6331 165.951 17.5431 165.273 17.5431 164.578C17.5431 163.43 17.7905 162.307 18.2629 161.278C17.405 158.534 16.3736 155.915 15.4514 153.574C14.5678 151.332 13.6618 149.032 12.8585 146.577C12.0906 146.822 11.2777 146.95 10.4519 146.95C6.08855 146.95 2.53812 143.396 2.53812 139.028C2.53812 134.66 6.08855 131.105 10.4519 131.105C10.8246 131.105 11.1973 131.131 11.5604 131.182L29.1005 14.2306C27.1598 12.7541 25.9742 10.4381 25.9742 7.92267C25.9742 3.55442 29.5247 0 33.888 0C38.2514 0 41.8018 3.55442 41.8018 7.92267C41.8018 8.6432 41.7022 9.36052 41.5094 10.0489C42.7207 11.1522 43.7714 12.4035 44.6646 13.4714L57.8575 29.1881C61.4336 33.447 65.5463 36.9982 69.9 40.7617L69.9322 40.7906C70.9475 41.6656 71.9885 42.5662 73.0296 43.4798C75.5615 43.7564 77.7753 45.2232 79.0252 47.4363L87.6651 50.7655C89.1399 51.3349 90.4251 51.9846 91.5304 52.7309C92.9249 50.4599 95.4279 48.9449 98.2779 48.9449C102.641 48.9449 106.192 52.4993 106.192 56.8676C106.192 61.2358 102.641 64.7902 98.2779 64.7902C97.8216 64.7902 97.3686 64.7484 96.9219 64.6712C96.8737 65.5365 96.7774 66.45 96.6263 67.415C96.0094 71.4069 95.4986 75.7012 95.8777 80.1659C97.5806 81.6585 98.567 83.804 98.567 86.1135C98.567 86.2937 98.5606 86.4738 98.5477 86.654C100.231 88.8316 101.928 90.5043 103.962 92.0001L134.945 114.787C135.993 114.295 137.14 114.034 138.309 114.034C142.673 114.034 146.223 117.589 146.223 121.957C146.223 126.325 142.673 129.88 138.309 129.88C134.406 129.88 131.154 127.036 130.511 123.311C130.463 123.305 130.412 123.298 130.364 123.295L130.264 123.282L63.6635 115.459C62.2626 116.08 60.7139 116.289 59.1588 116.022C54.4034 117.396 50.6538 119.956 48.0062 123.63L40.915 133.479C40.8668 133.653 40.8057 133.949 40.7608 134.161C41.413 134.994 41.8885 135.946 42.1616 136.966C43.1159 137.374 43.9963 137.603 45.0084 137.712L70.035 140.443C71.0246 140.553 72.1781 140.662 73.232 140.672L98.1011 140.877L158.002 141.093L164.814 141.212L203.117 141.254H203.13C206.555 141.254 209.678 139.108 211.49 135.509C212.477 133.55 212.689 131.568 212.939 129.079C212.046 127.769 211.564 126.225 211.564 124.624C211.564 123.546 211.786 122.481 212.213 121.494C210.642 114.443 207.378 108.55 202.507 103.966C197.799 99.5367 191.412 96.1399 183.524 93.8657C177.03 91.9936 171.169 89.9832 166.401 85.2097C164.965 87.2169 162.613 88.526 159.965 88.526C155.602 88.526 152.052 84.9716 152.052 80.6034C152.052 76.5086 155.172 73.1278 159.156 72.7225C157.604 67.2285 157.893 61.6122 160.03 56.2532C162.947 48.9385 166.192 41.4565 170.241 32.7103C172.182 28.519 174.98 25.4953 178.794 23.4656C178.907 23.4045 179.032 23.337 179.164 23.2598C180.558 22.4781 182.888 21.1721 185.275 22.1918C189.452 23.9739 191.932 27.3675 193.809 30.4522L222.73 77.9721L244.476 113.828L275.996 166.276C277.207 165.543 278.611 165.141 280.08 165.141C284.443 165.141 287.993 168.695 287.993 173.063C287.993 177.432 284.443 180.986 280.08 180.986C278.062 180.986 276.137 180.201 274.691 178.857L271.51 180.475C272.079 181.581 272.387 182.82 272.387 184.087C272.387 188.455 268.837 192.01 264.474 192.01L264.48 192ZM261.916 182.292L261.707 182.72C261.495 183.151 261.389 183.608 261.389 184.077C261.389 185.785 262.777 187.175 264.483 187.175C266.189 187.175 267.578 185.785 267.578 184.077C267.578 183.096 267.121 182.192 266.328 181.597L265.974 181.333L265.56 181.179C264.371 180.735 263.086 181.06 262.244 181.948L261.919 182.292H261.916ZM7.91358 177.104C6.20744 177.104 4.81939 178.493 4.81939 180.201C4.81939 181.909 6.20744 183.299 7.91358 183.299C9.47834 183.299 10.7989 182.128 10.9821 180.571L11.027 180.204L10.9853 179.844C10.9563 179.58 10.8889 179.317 10.7893 179.063L10.6479 178.709L10.4166 178.39C9.82535 177.573 8.91284 177.107 7.91679 177.107L7.91358 177.104ZM40.2113 177.261L87.196 177.335L96.0416 177.464L172.811 177.683L254.536 177.927C255.252 177.927 255.914 177.956 256.499 177.979C257.559 178.02 258.472 178.056 259.461 177.959C260.872 176.788 262.623 176.155 264.483 176.155C265.046 176.155 265.605 176.216 266.157 176.338L272.179 173.279C272.179 173.205 272.179 173.131 272.179 173.057C272.179 172.668 272.208 172.279 272.265 171.893L239.264 116.981L217.528 81.1406L188.61 33.6239C187.312 31.4912 185.673 29.1784 183.312 27.9979C182.942 28.1459 182.399 28.4515 182.161 28.5834C181.985 28.6831 181.821 28.7731 181.673 28.8536C179.003 30.2721 177.191 32.2536 175.793 35.2708C171.79 43.9205 168.586 51.3059 165.714 58.5113C163.256 64.6744 164.065 71.4069 167.992 77.4639C172.111 83.8168 177.49 85.7533 185.223 87.9824C202.282 92.8975 213.081 102.647 217.364 116.984C218.051 116.791 218.768 116.691 219.491 116.691C221.316 116.691 223.096 117.328 224.506 118.489C224.542 118.515 224.577 118.544 224.612 118.57C226.274 119.93 227.289 121.86 227.472 123.996C227.658 126.132 226.993 128.2 225.602 129.818C224.246 131.391 222.341 132.344 220.233 132.501L220.127 132.508C220.082 132.508 220.034 132.511 219.989 132.514H219.963C219.545 132.546 219.115 132.537 218.694 132.495C218.411 134.367 217.945 136.284 216.956 138.249C214.128 143.866 208.833 147.356 203.139 147.356L164.75 147.314L157.935 147.195L98.0786 146.979L73.1967 146.774C71.8729 146.764 70.5298 146.632 69.386 146.51L44.3594 143.779C43.2766 143.66 42.2805 143.457 41.2941 143.145C39.8611 145.503 37.3163 146.944 34.5403 146.944C30.1769 146.944 26.6265 143.39 26.6265 139.021C26.6265 136.947 27.4233 134.988 28.8692 133.498C29.7849 132.492 30.948 131.736 32.2397 131.311C33.2582 130.976 34.3121 130.851 35.366 130.928C35.4945 130.632 35.652 130.346 35.8512 130.069L43.0742 120.04C45.7153 116.373 49.1661 113.561 53.3656 111.651C52.8515 110.589 52.5784 109.415 52.5784 108.199C52.5784 103.831 56.1288 100.277 60.4922 100.277C62.3911 100.277 64.2258 100.965 65.6652 102.213C67.2236 103.41 68.226 105.121 68.4959 107.051C68.6373 108.045 68.6373 108.981 68.4959 109.859L127.369 116.775L100.363 96.9151C98.567 95.5931 96.9734 94.1488 95.4696 92.4729C95.0359 92.7978 94.5668 93.0744 94.0719 93.2996C93.5129 93.5569 92.9024 93.7467 92.2598 93.8657L92.1666 93.8818C92.0027 93.9108 91.8421 93.9365 91.6782 93.9558C91.3087 94.004 90.9874 94.0266 90.6693 94.0266C86.306 94.0266 82.7555 90.4721 82.7555 86.1039C82.7555 82.0734 85.7758 78.7377 89.67 78.2456C89.5544 74.0542 90.0396 70.1331 90.605 66.4725C91.4951 60.734 90.2484 58.3022 85.4802 56.4655L79.5489 54.1816C78.4082 57.1571 75.5261 59.2736 72.1556 59.2736C72.0785 59.2736 72.0014 59.2704 71.9243 59.264C71.7636 59.264 71.5998 59.2511 71.407 59.235L71.3491 59.2286C70.2053 59.1257 69.1257 58.7815 68.1361 58.2057C66.2821 57.1249 64.9198 55.301 64.3961 53.2038C63.8755 51.1194 64.2226 48.9706 65.3761 47.1532C65.6845 46.6675 66.0347 46.2236 66.4267 45.8247C66.2564 45.6768 66.0861 45.532 65.9191 45.384C61.3726 41.4565 57.0799 37.7477 53.1857 33.1124L39.9896 17.3925C39.2699 16.5337 38.4827 15.6137 37.7083 14.8578C36.8858 15.3146 35.9861 15.6169 35.0479 15.752L17.2636 134.357C17.2379 134.534 17.2122 134.701 17.1897 134.862C17.9576 136.107 18.3689 137.548 18.3689 139.021C18.3689 140.002 18.1857 140.98 17.8323 141.891C18.7063 145.162 19.8887 148.163 21.1353 151.325C21.8197 153.062 22.5684 154.957 23.272 156.961C23.9789 156.755 24.7179 156.649 25.4633 156.649C27.947 156.649 30.2315 157.784 31.7449 159.762C33.0783 161.403 33.6984 163.471 33.496 165.591C33.2743 167.897 32.0855 169.963 30.2347 171.256C28.3583 172.565 26.1124 173.012 23.9114 172.507C23.1274 172.327 22.3884 172.037 21.7041 171.645C21.3828 172.06 21.0518 172.468 20.6952 172.883L17.0483 177.161L38.1325 177.252H40.2113V177.261ZM277.223 174.286L277.413 174.611C277.969 175.563 278.99 176.158 280.086 176.158C281.792 176.158 283.18 174.768 283.18 173.06C283.18 171.352 281.792 169.963 280.086 169.963C279.035 169.963 278.065 170.493 277.49 171.378L277.249 171.751L277.124 172.166C277.037 172.459 276.992 172.758 276.992 173.057C276.992 173.356 277.037 173.655 277.124 173.948L277.223 174.286ZM22.8222 166.231L23.1339 166.624C23.6223 167.238 24.2584 167.65 24.9782 167.814C25.8521 168.013 26.7132 167.84 27.4715 167.309C28.1623 166.826 28.6089 166.035 28.6957 165.138C28.776 164.282 28.5286 163.452 27.9888 162.799L27.9246 162.719C27.3301 161.931 26.4305 161.48 25.4569 161.48C24.4834 161.48 23.8375 161.892 23.4391 162.236L23.1082 162.522L22.8736 162.876C22.5395 163.384 22.3627 163.973 22.3627 164.578C22.3627 165.031 22.4623 165.475 22.6616 165.897L22.819 166.228L22.8222 166.231ZM34.7523 135.744C34.4021 135.744 34.0583 135.798 33.7306 135.904C33.2165 136.072 32.7731 136.364 32.41 136.77L32.3297 136.853C31.7545 137.439 31.4364 138.211 31.4364 139.028C31.4364 140.736 32.8245 142.125 34.5306 142.125C35.6841 142.125 36.7348 141.489 37.2714 140.462L37.3292 140.36C37.4738 140.115 37.5895 139.851 37.673 139.581L37.6119 138.787C37.5477 137.973 37.1718 137.226 36.5516 136.689L35.5717 135.84C35.2985 135.776 35.0222 135.744 34.7523 135.744ZM10.4551 135.933C8.74897 135.933 7.36093 137.323 7.36093 139.031C7.36093 140.739 8.74897 142.129 10.4551 142.129C11.2648 142.129 12.0327 141.817 12.6143 141.247L12.9517 140.916L13.1702 140.514C13.4208 140.057 13.5493 139.555 13.5493 139.031C13.5493 138.105 13.1605 137.442 12.8328 137.05L12.5436 136.705L12.1741 136.458C11.6664 136.117 11.072 135.937 10.4551 135.937V135.933ZM217.759 127.197C217.781 127.207 217.801 127.219 217.823 127.232L217.91 127.281C218.395 127.57 218.925 127.715 219.481 127.715C219.526 127.715 219.571 127.708 219.616 127.705L219.754 127.695C219.793 127.695 219.828 127.695 219.867 127.689H219.889C220.705 127.621 221.431 127.261 221.942 126.669C222.479 126.045 222.733 125.244 222.662 124.414C222.591 123.601 222.209 122.864 221.589 122.337C221.566 122.32 221.544 122.304 221.521 122.285L221.467 122.24C221.075 121.909 220.41 121.516 219.481 121.516C218.716 121.516 217.981 121.803 217.409 122.32L217.058 122.636L216.821 123.038C216.532 123.523 216.387 124.054 216.387 124.611C216.387 125.386 216.679 126.129 217.21 126.705L217.547 127.071L217.756 127.187L217.759 127.197ZM135.328 121.066L135.263 121.465C135.235 121.655 135.218 121.815 135.218 121.954C135.218 123.662 136.607 125.051 138.313 125.051C140.019 125.051 141.407 123.662 141.407 121.954C141.407 120.246 140.019 118.856 138.313 118.856C137.59 118.856 136.915 119.097 136.356 119.554L136.089 119.773L135.855 120.085C135.691 120.3 135.559 120.522 135.466 120.741L135.328 121.063V121.066ZM59.0688 111.04L59.6953 111.204C60.5597 111.429 61.3212 111.297 62.0216 110.892L62.7156 110.489L63.0723 110.531L63.1301 110.454C63.6153 109.804 63.9013 109.09 63.7085 107.733C63.5864 106.868 63.0851 106.327 62.6867 106.031L62.5261 105.899C61.9574 105.394 61.228 105.114 60.4761 105.114C58.77 105.114 57.3819 106.504 57.3819 108.212C57.3819 109.155 57.8061 110.036 58.5451 110.628L58.7379 110.798C58.7893 110.85 58.8375 110.898 58.8889 110.943L59.011 111.052L59.072 111.036L59.0688 111.04ZM90.6565 83.0127C88.9503 83.0127 87.5623 84.4023 87.5623 86.1103C87.5623 87.8184 88.9503 89.208 90.6565 89.208C90.7657 89.208 90.8974 89.1983 91.0645 89.1758L91.1224 89.1694C91.193 89.1629 91.2637 89.1469 91.3312 89.134L91.3601 89.1276C91.6172 89.0793 91.8517 89.0086 92.0541 88.9153C92.6261 88.6547 93.1112 88.198 93.4583 87.5964L93.5129 87.4999L93.6703 86.7794C93.7217 86.551 93.7474 86.3226 93.7474 86.1071C93.7474 85.0424 93.2044 84.0645 92.2983 83.4887L91.932 83.2571L91.5368 83.1381C91.2445 83.0513 90.9489 83.0062 90.6533 83.0062L90.6565 83.0127ZM159.969 77.5025C158.263 77.5025 156.875 78.8921 156.875 80.6002C156.875 82.3082 158.263 83.6978 159.969 83.6978C161.675 83.6978 163.05 82.3211 163.063 80.6227L163.053 80.4458L162.979 78.8535L161.633 77.9882C161.132 77.6666 160.56 77.4993 159.972 77.4993L159.969 77.5025ZM95.2672 58.1671L96.0191 58.9745C96.6135 59.6114 97.4167 59.962 98.2779 59.962C99.984 59.962 101.372 58.5724 101.372 56.8643C101.372 55.1563 99.984 53.7667 98.2779 53.7667C96.5717 53.7667 95.1837 55.1563 95.1837 56.8643C95.1837 56.8965 95.1869 56.9351 95.1901 56.9705L95.2672 58.1639V58.1671ZM71.8279 54.4358C71.8922 54.4422 71.9564 54.4454 72.0175 54.4454H72.0689C72.1139 54.4454 72.1556 54.4486 72.1974 54.4518C73.881 54.4261 75.2402 53.0462 75.2402 51.3542C75.2402 51.2802 75.2337 51.1933 75.2241 51.0743L75.1855 50.6401L75.0217 50.2251C74.559 49.0478 73.4569 48.279 72.2006 48.2565C72.1653 48.2565 72.1267 48.2565 72.0914 48.2597L71.6158 48.2662L71.1692 48.4109C70.4334 48.6522 69.8358 49.1122 69.4342 49.7458C68.9908 50.4471 68.859 51.2416 69.0614 52.0393C69.2735 52.8821 69.8165 53.6123 70.5523 54.0433C70.925 54.2621 71.3363 54.3907 71.7765 54.4325H71.8247L71.8279 54.4358ZM32.9883 10.9077L33.3707 10.9721C33.5667 11.0042 33.737 11.0203 33.8912 11.0203C34.7202 11.0203 35.501 10.6954 36.0857 10.1036L36.3267 9.8591L36.5291 9.52779C36.828 9.03885 36.9854 8.48237 36.9854 7.91945C36.9854 6.2114 35.5974 4.82179 33.8912 4.82179C32.1851 4.82179 30.797 6.2114 30.797 7.91945C30.797 9.16108 31.5328 10.2773 32.6735 10.7662L32.9883 10.9013V10.9077Z" fill={`url(#paint0_linear_track_pitlane_${track.id})`}/>
                          <defs>
                            <linearGradient id={`paint0_linear_track_pitlane_${track.id}`} x1="-0.000204903" y1="96.0016" x2="288" y2="96.0016" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#FF006F"/>
                              <stop offset="1" stopColor="#EC6D00"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </div>
    </section>
  )
}

interface TabButtonProps {
  label?: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
  showDivider?: boolean
}

function TabButton({ label, icon, active, onClick, showDivider = false }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-xs tracking-wide transition w-1/4 uppercase bg-white hover:text-white flex items-center justify-center ${
        active ? 'text-white bg-opacity-30' : ' text-[#FFFFFF50] bg-opacity-[19%]'
      }`}
    >
      {icon || label}
      {showDivider ? (
        <span className="pointer-events-none absolute right-0 top-1 bottom-1 w-[.5px] bg-white/20" />
      ) : null}
    </button>
  )
}

interface AvatarProps {
  src?: string | null
  alt: string
  fallback: string
  variant?: 'default' | 'team'
}

function Avatar({ src, alt, fallback, variant = 'default' }: AvatarProps) {
  const isTeam = variant === 'team'
  return (
    <div className={`relative h-full w-full overflow-hidden ${isTeam ? 'bg-transparent p-4' : ''}`}>
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          sizes="240px" 
          className={isTeam ? 'object-contain brightness-0 invert' : 'object-cover'} 
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-500">
          {fallback}
        </div>
      )}
    </div>
  )
}


interface ScheduleCardProps {
  race: ScheduleTrack
}

function ScheduleCard({ race }: ScheduleCardProps) {
  // Format dates in short format
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const startDateFormatted = formatShortDate(race.start_date)
  const raceDayDateFormatted = formatShortDate(race.race_day_date)

  // Build date display string
  let dateDisplay = 'Date TBA'
  if (startDateFormatted && raceDayDateFormatted) {
    dateDisplay = `${startDateFormatted}`
  } else if (startDateFormatted) {
    dateDisplay = `Start: ${startDateFormatted}`
  } else if (raceDayDateFormatted) {
    dateDisplay = `Race Day: ${raceDayDateFormatted}`
  }

  const backgroundImage = race.image_url || '/images/race_banner.png'
  const trackSlug = slugify(race.name)
  const bannerHref = `/tracks/${trackSlug}`

  return (
    <Link
      href={bannerHref}
      className="block overflow-hidden hover:opacity-90 rounded-sm border-b border-gray-900"
    >
      <section className="relative h-[90px] w-full cursor-pointer">
        {/* <Image
          src={backgroundImage}
          alt={race.circuit_ref || race.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) calc(100vw - 3rem), 1152px"
          className="object-cover opacity-30"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-between">
          <div className="px-2 sm:px-10 text-white space-y-0 pt-2">
            <div className="flex items-center gap-2">
              {race.country && getCountryFlagPath(race.country) ? (
                <Image
                  src={getCountryFlagPath(race.country)!}
                  alt={race.country}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : null}
              <h2 className="font-display tracking-wider text-lg">{race.circuit_ref || race.name}</h2>
            </div>
            <p className="text-xs text-gray-300 tracking-wide pl-7">
              {dateDisplay}
              {race.location ? ` - ${race.location}` : ''}
              {race.country ? `, ${race.country}` : ''}
            </p>
            <p className="text-xs text-gray-300 tracking-wide pl-7">{race.circuit_ref ? `${race.name}` : ''}</p>
          </div>
        </div>
      </section>
    </Link>
  )
}

function getCountryFlagPath(country?: string | null): string | null {
  if (!country) return null
  const normalized = country.trim().toLowerCase()
  
  // Map country to flag file name
  const flagMap: Record<string, string> = {
    australia: 'australia',
    austria: 'austria',
    belgium: 'belgium',
    brazil: 'brazil',
    canada: 'canada',
    china: 'china',
    hungary: 'hungary',
    italy: 'italy',
    japan: 'japan',
    mexico: 'mexico',
    monaco: 'monaco',
    netherlands: 'netherlands',
    qatar: 'qatar',
    singapore: 'singapore',
    spain: 'spain',
    uk: 'uk',
    'united kingdom': 'uk',
    'united states': 'usa',
    usa: 'usa',
    abu_dhabi: 'uae',
    'abu dhabi': 'uae',
    uae: 'uae',
    united_arab_emirates: 'uae',
    'united arab emirates': 'uae',
    bahrain: 'bahrain',
    azerbaijan: 'azerbaijan',
    saudi: 'saudi_arabia',
    saudi_arabia: 'saudi_arabia',
    'saudi arabia': 'saudi_arabia',
  }
  
  const flagName = flagMap[normalized]
  if (!flagName) return null
  
  return `/images/flags/${flagName}_flag.svg`
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}
