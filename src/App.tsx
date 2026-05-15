import { useQueries, useQuery } from '@tanstack/react-query'
import { fetchBuoy, hasData } from './api/ndbc'
import { fetchAlerts, fetchHourlyForecast, fetchMarineZone, fetchDiscussion } from './api/weather'
import { StationConfig } from './types'
import { Header } from './components/Header'
import { AlertBanner } from './components/AlertBanner'
import { BuoyCard, BuoyCardSkeleton } from './components/BuoyCard'
import { SecondaryStations } from './components/SecondaryStations'
import { HourlyForecast, HourlyForecastSkeleton } from './components/HourlyForecast'
import { WindForecast, WindForecastSkeleton } from './components/WindForecast'
import { RadarMap } from './components/RadarMap'
import { MarineSection } from './components/MarineSection'
import { DiscussionSection } from './components/DiscussionSection'
import { LakeTempImage } from './components/LakeTempImage'

const STATIONS: StationConfig[] = [
  { id: 'CHII2', label: 'Chicago Crib', primary: true },
  { id: '45198', label: 'Michigan City', primary: false },
  { id: '45174', label: 'Winthrop Harbor', primary: false },
  { id: '45007', label: 'S. Lake Michigan', primary: false },
]

const BUOY_STALE = 10 * 60 * 1000
const FORECAST_STALE = 30 * 60 * 1000

export function App() {
  const buoyResults = useQueries({
    queries: STATIONS.map(station => ({
      queryKey: ['buoy', station.id],
      queryFn: () => fetchBuoy(station),
      staleTime: BUOY_STALE,
      retry: 2,
    })),
  })

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    staleTime: FORECAST_STALE,
    retry: 1,
  })

  const hourlyQuery = useQuery({
    queryKey: ['forecast'],
    queryFn: fetchHourlyForecast,
    staleTime: FORECAST_STALE,
    retry: 1,
  })

  const marineQuery = useQuery({
    queryKey: ['marineZone'],
    queryFn: fetchMarineZone,
    staleTime: FORECAST_STALE,
    retry: 1,
  })

  const discussionQuery = useQuery({
    queryKey: ['discussion'],
    queryFn: fetchDiscussion,
    staleTime: FORECAST_STALE,
    retry: 1,
  })

  // Resolve primary and fallback stations
  const [primaryResult, ...secondaryResults] = buoyResults
  const primaryData = primaryResult.data
  const primaryValid = primaryData && hasData(primaryData)

  const displayedPrimary = primaryValid
    ? primaryData
    : secondaryResults.find(r => r.data && hasData(r.data))?.data ?? null

  const isOfflineFallback = !primaryValid && displayedPrimary !== null

  const secondaryStations = buoyResults
    .filter(r => r.data && hasData(r.data) && r.data !== displayedPrimary)
    .map(r => r.data!)

  const primaryLoading = primaryResult.isLoading && !displayedPrimary

  return (
    <div className="bg-navy-950 text-slate-200 min-h-screen">
      <div className="max-w-lg mx-auto px-4 safe-top safe-bottom pb-6 space-y-3">
        <Header primary={displayedPrimary} />

        <AlertBanner
          alerts={alertsQuery.data ?? []}
          isLoading={alertsQuery.isLoading}
        />

        {primaryLoading ? (
          <BuoyCardSkeleton />
        ) : displayedPrimary ? (
          <BuoyCard
            obs={displayedPrimary}
            isPrimary={!isOfflineFallback}
            isOfflineFallback={isOfflineFallback}
          />
        ) : null}

        <SecondaryStations stations={secondaryStations} />

        {hourlyQuery.isLoading ? (
          <HourlyForecastSkeleton />
        ) : hourlyQuery.data ? (
          <HourlyForecast periods={hourlyQuery.data.slice(0, 12)} />
        ) : null}

        {hourlyQuery.isLoading ? (
          <WindForecastSkeleton />
        ) : hourlyQuery.data ? (
          <WindForecast periods={hourlyQuery.data} />
        ) : null}

        <RadarMap />

        <MarineSection
          data={marineQuery.data}
          isLoading={marineQuery.isLoading}
          error={marineQuery.error as Error | null}
          onRetry={() => marineQuery.refetch()}
        />

        <DiscussionSection
          sections={discussionQuery.data?.sections}
          updatedAt={discussionQuery.data?.updatedAt}
          isLoading={discussionQuery.isLoading}
          error={discussionQuery.error as Error | null}
          onRetry={() => discussionQuery.refetch()}
        />

        <LakeTempImage />

        <div className="text-xs text-slate-600 text-center pb-1">
          Data: NOAA Weather API · NDBC Buoys · GLERL CoastWatch
        </div>
      </div>
    </div>
  )
}
