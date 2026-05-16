import { BuoyObservation } from '../types'
import { windColor, waveColor } from '../lib/colors'
import { WindArrow } from './WindArrow'

interface Props {
  obs: BuoyObservation
  isPrimary?: boolean
  isOfflineFallback?: boolean
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  )
}

function Missing() {
  return <span className="text-3xl font-bold tabular-nums text-slate-600">—</span>
}

export function BuoyCard({ obs, isPrimary = false, isOfflineFallback = false }: Props) {
  return (
    <div className={`bg-[#111d2e] rounded-2xl p-4 ${isPrimary ? '' : 'opacity-80'}`}>
      {isOfflineFallback && (
        <div className="text-xs text-amber-400 mb-2">
          ⚠ Primary buoy offline — using fallback station
        </div>
      )}

      <a
        href={`https://www.ndbc.noaa.gov/station_page.php?station=${obs.stationId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-slate-400 mb-3 block hover:text-slate-200 transition-colors"
      >
        {isPrimary ? 'Belmont Harbor' : obs.stationLabel}
        {isPrimary && <span className="text-slate-600 ml-2">at Chicago Crib</span>}
        <span className="ml-1 text-slate-600">↗</span>
      </a>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label="Wind">
          <div className={`text-3xl font-bold tabular-nums ${windColor(obs.windSpeedKt)}`}>
            {obs.windSpeedKt !== null ? Math.round(obs.windSpeedKt) : <Missing />}
            {obs.windSpeedKt !== null && <span className="text-sm font-normal text-slate-400 ml-1"> kt</span>}
          </div>
          {obs.windGustKt !== null && (
            <div className={`text-sm ${windColor(obs.windGustKt)}`}>
              G{Math.round(obs.windGustKt)} kt
            </div>
          )}
          <div className="flex items-center gap-1 mt-0.5 text-sm text-slate-400">
            <WindArrow deg={obs.windDirDeg} />
            {obs.windDirCardinal && <span>{obs.windDirCardinal}</span>}
          </div>
        </Stat>

        <Stat label="Waves">
          <div className={`text-3xl font-bold tabular-nums ${waveColor(obs.waveHeightFt)}`}>
            {obs.waveHeightFt !== null ? obs.waveHeightFt.toFixed(1) : '—'}
            {obs.waveHeightFt !== null && <span className="text-sm font-normal text-slate-400 ml-1"> ft</span>}
          </div>
          {obs.wavePeriodSec !== null && (
            <div className="text-sm text-slate-400">{obs.wavePeriodSec}s period</div>
          )}
        </Stat>

        <Stat label="Water Temp">
          <div className="text-2xl font-bold tabular-nums text-cyan-400">
            {obs.waterTempF !== null ? `${obs.waterTempF}°` : '—'}
          </div>
        </Stat>

        <Stat label="Air Temp">
          <div className="text-2xl font-bold tabular-nums text-blue-400">
            {obs.airTempF !== null ? `${obs.airTempF}°` : '—'}
          </div>
        </Stat>
      </div>
    </div>
  )
}

export function BuoyCardSkeleton() {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-2 w-10 bg-slate-700 rounded mb-2" />
            <div className="h-8 w-20 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
