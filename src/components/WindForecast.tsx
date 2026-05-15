import { HourlyPeriod } from '../types'
import { windColor } from '../lib/colors'

interface Props {
  periods: HourlyPeriod[]
}

function parseWindKt(windSpeed: string): number | null {
  if (!windSpeed || windSpeed.toLowerCase() === 'calm') return 0
  const nums = windSpeed.match(/\d+/g)
  if (!nums) return null
  // "10 to 20 mph" -> average; "10 mph" -> 10
  const mph = nums.length > 1
    ? (parseInt(nums[0]) + parseInt(nums[nums.length - 1])) / 2
    : parseInt(nums[0])
  return Math.round(mph * 0.868976) // mph to knots
}

function cardinalToDeg(dir: string): number {
  const map: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  }
  return map[dir] ?? 0
}

function formatHour(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '')
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' })
}

export function WindForecast({ periods }: Props) {
  const maxKt = Math.max(...periods.map(p => parseWindKt(p.windSpeed) ?? 0), 1)

  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">24-Hour Wind Outlook</div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {periods.map((p, i) => {
            const kt = parseWindKt(p.windSpeed)
            const barHeight = kt !== null ? Math.round((kt / maxKt) * 40) : 0
            const color = windColor(kt)
            const deg = cardinalToDeg(p.windDirection)
            const isNewDay = i > 0 &&
              formatDay(p.startTime) !== formatDay(periods[i - 1].startTime)

            return (
              <div key={i} className="flex flex-col items-center gap-1 w-10">
                {isNewDay && (
                  <div className="text-xs text-slate-600 -mb-1">{formatDay(p.startTime)}</div>
                )}
                {!isNewDay && i === 0 && (
                  <div className="text-xs text-slate-600 -mb-1">{formatDay(p.startTime)}</div>
                )}
                <div className="text-xs text-slate-500">{formatHour(p.startTime)}</div>
                {/* Direction arrow */}
                <span
                  className={`text-xs ${color}`}
                  style={{ transform: `rotate(${deg}deg)`, display: 'inline-block' }}
                >
                  ↑
                </span>
                {/* Speed bar */}
                <div className="flex flex-col-reverse items-center" style={{ height: 48 }}>
                  <div
                    className={`w-3 rounded-sm transition-all ${color.replace('text-', 'bg-')}`}
                    style={{ height: barHeight, opacity: 0.8 }}
                  />
                </div>
                <div className={`text-xs font-bold tabular-nums ${color}`}>
                  {kt !== null ? kt : '—'}
                </div>
                <div className="text-xs text-slate-600">{p.windDirection}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="text-xs text-slate-600 mt-2">kt · from weather.gov</div>
    </div>
  )
}

export function WindForecastSkeleton() {
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
