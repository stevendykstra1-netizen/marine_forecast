import { WaveHourly } from '../types'
import { waveColor } from '../lib/colors'

interface Props {
  periods: WaveHourly[]
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '')
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' })
}

function waveHex(ft: number | null): string {
  if (ft === null) return '#64748b'
  if (ft < 2) return '#34d399'
  if (ft < 4) return '#fbbf24'
  return '#f87171'
}

const COL_W = 40
const GAP = 8
const STEP = COL_W + GAP

function WaveSparkline({ periods, maxFt }: { periods: WaveHourly[]; maxFt: number }) {
  const H = 36
  const PAD = 4
  const dataH = H - PAD * 2
  const W = periods.length * COL_W + Math.max(0, periods.length - 1) * GAP

  const pts = periods.map((p, i) => {
    const ft = p.waveHeightFt ?? 0
    const x = i * STEP + COL_W / 2
    const y = PAD + dataH * (1 - Math.min(ft, maxFt) / Math.max(maxFt, 0.1))
    return { x, y, ft }
  })

  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {pts.slice(1).map((pt, i) => (
        <line
          key={i}
          x1={pts[i].x} y1={pts[i].y} x2={pt.x} y2={pt.y}
          stroke={waveHex(Math.max(pts[i].ft, pt.ft))}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={2} fill={waveHex(pt.ft)} />
      ))}
    </svg>
  )
}

export function WaveForecast({ periods }: Props) {
  const maxFt = Math.max(...periods.map(p => p.waveHeightFt ?? 0), 0.1)

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
        <div style={{ minWidth: 'max-content' }}>
          <WaveSparkline periods={periods} maxFt={maxFt} />
          <div className="flex gap-2 pb-1 mt-1">
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
                  <span className={`text-xs ${color}`}>〜</span>
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
      </div>
      <div className="text-xs text-slate-600 mt-2">ft · NOAA grid forecast</div>
    </div>
  )
}

export function WaveForecastSkeleton() {
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
