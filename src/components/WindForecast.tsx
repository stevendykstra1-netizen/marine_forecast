import { HourlyPeriod } from '../types'
import { windColor } from '../lib/colors'

interface Props {
  periods: HourlyPeriod[]
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
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '')
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' })
}

function windHex(kt: number | null): string {
  if (kt === null) return '#64748b'
  if (kt < 10) return '#34d399'
  if (kt < 20) return '#fbbf24'
  return '#f87171'
}

const COL_W = 40
const GAP = 8
const STEP = COL_W + GAP

function WindSparkline({ periods, maxKt }: { periods: HourlyPeriod[]; maxKt: number }) {
  const H = 36
  const PAD = 4
  const dataH = H - PAD * 2
  const W = periods.length * COL_W + Math.max(0, periods.length - 1) * GAP

  const pts = periods.map((p, i) => {
    const kt = p.windSpeedKt ?? 0
    const x = i * STEP + COL_W / 2
    const y = PAD + dataH * (1 - Math.min(kt, maxKt) / Math.max(maxKt, 1))
    return { x, y, kt }
  })

  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {pts.slice(1).map((pt, i) => (
        <line
          key={i}
          x1={pts[i].x} y1={pts[i].y} x2={pt.x} y2={pt.y}
          stroke={windHex(Math.max(pts[i].kt, pt.kt))}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={2} fill={windHex(pt.kt)} />
      ))}
    </svg>
  )
}

export function WindForecast({ periods }: Props) {
  const maxKt = Math.max(...periods.map(p => p.windSpeedKt ?? 0), 1)

  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <a
        href="https://forecast.weather.gov/MapClick.php?lat=41.938&lon=-87.638"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs uppercase tracking-widest text-slate-500 mb-3 block hover:text-slate-300 transition-colors"
      >
        24-Hour Wind Outlook <span className="text-slate-600 normal-case tracking-normal">↗</span>
      </a>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 'max-content' }}>
          <WindSparkline periods={periods} maxKt={maxKt} />
          <div className="flex gap-2 pb-1 mt-1">
            {periods.map((p, i) => {
              const kt = p.windSpeedKt
              const gustKt = p.windGustKt
              const showGust = gustKt !== null && kt !== null && gustKt > kt
              const barHeight = kt !== null ? Math.round((kt / maxKt) * 40) : 0
              const color = windColor(kt)
              const deg = cardinalToDeg(p.windDirection)
              const isNewDay = i > 0 &&
                formatDay(p.startTime) !== formatDay(periods[i - 1].startTime)
              const dayLabel = (i === 0 || isNewDay) ? formatDay(p.startTime) : ''

              return (
                <div key={i} className="flex flex-col items-center gap-1 w-10">
                  <div className="text-xs text-slate-600 -mb-1" style={{ minHeight: '1rem' }}>{dayLabel}</div>
                  <div className="text-xs text-slate-500">{formatHour(p.startTime)}</div>
                  <span
                    className={`text-base ${color}`}
                    style={{ transform: `rotate(${deg}deg)`, display: 'inline-block', lineHeight: 1 }}
                  >
                    ↑
                  </span>
                  <div className="flex flex-col-reverse items-center" style={{ height: 48 }}>
                    <div
                      className={`w-3 rounded-sm transition-all ${color.replace('text-', 'bg-')}`}
                      style={{ height: barHeight, opacity: 0.8 }}
                    />
                  </div>
                  <div className={`text-xs font-bold tabular-nums ${color}`}>
                    {kt !== null ? kt : '—'}
                  </div>
                  <div className="text-xs tabular-nums text-slate-500" style={{ minHeight: '1rem' }}>
                    {showGust ? `G${gustKt}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
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
      <div className="h-8 bg-slate-800 rounded mb-1" />
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
