import { WaveHourly } from '../types'
import { waveColor } from '../lib/colors'

interface Props {
  periods: WaveHourly[]
}

function formatHour(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '')
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' })
}

export function WaveForecast({ periods }: Props) {
  const maxFt = Math.max(...periods.map(p => p.waveHeightFt ?? 0), 1)

  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <a
        href="https://marine.weather.gov/MapClick.php?zoneid=LMZ741"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs uppercase tracking-widest text-slate-500 mb-3 block hover:text-slate-300 transition-colors"
      >
        24-Hour Wave Outlook <span className="text-slate-600 normal-case tracking-normal">↗</span>
      </a>
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {periods.map((p, i) => {
            const ft = p.waveHeightFt
            const barHeight = ft !== null ? Math.round((ft / maxFt) * 40) : 0
            const color = waveColor(ft)
            const isNewDay = i > 0 &&
              formatDay(p.startTime) !== formatDay(periods[i - 1].startTime)
            const dayLabel = (i === 0 || isNewDay) ? formatDay(p.startTime) : ''

            return (
              <div key={i} className="flex flex-col items-center gap-1 w-10">
                <div className="text-xs text-slate-600 -mb-1" style={{ minHeight: '1rem' }}>{dayLabel}</div>
                <div className="text-xs text-slate-500">{formatHour(p.startTime)}</div>
                {/* Wave icon */}
                <span className={`text-xs ${color}`}>〜</span>
                {/* Height bar */}
                <div className="flex flex-col-reverse items-center" style={{ height: 48 }}>
                  <div
                    className={`w-3 rounded-sm transition-all ${color.replace('text-', 'bg-')}`}
                    style={{ height: barHeight, opacity: 0.8 }}
                  />
                </div>
                <div className={`text-xs font-bold tabular-nums ${color}`}>
                  {ft !== null ? ft.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-slate-600">ft</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="text-xs text-slate-600 mt-2">ft · NOAA grid forecast</div>
    </div>
  )
}

export function WaveForecastSkeleton() {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4 animate-pulse">
      <div className="h-2 w-40 bg-slate-700 rounded mb-3" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-10">
            <div className="h-2 w-6 bg-slate-700 rounded" />
            <div className="h-8 w-3 bg-slate-800 rounded" />
            <div className="h-2 w-5 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
