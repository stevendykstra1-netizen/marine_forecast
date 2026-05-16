import { HourlyPeriod, WaveHourly, NwsAlert } from '../types'
import { windColor, waveColor } from '../lib/colors'

export interface DayCallCardProps {
  label: string
  alerts: NwsAlert[]
  hourlyPeriods: HourlyPeriod[]
  wavePeriods: WaveHourly[]
  windowStart: Date
  windowEnd: Date
  isPrimary?: boolean
}

function parseWindKt(s: string | null): number {
  if (!s || s.toLowerCase() === 'calm') return 0
  const nums = s.match(/\d+/g)
  if (!nums) return 0
  const mph = nums.length > 1
    ? (parseInt(nums[0]) + parseInt(nums[nums.length - 1])) / 2
    : parseInt(nums[0])
  return Math.round(mph * 0.868976)
}

function fmtTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString([], { hour: 'numeric', hour12: true })
    .toLowerCase()
    .replace(':00', '')
}

function segLabel(startMs: number): string {
  const h = new Date(startMs).getHours()
  if (h < 12) return 'AM'
  if (h < 17) return 'Mid'
  return 'Eve'
}

function avgKt(periods: HourlyPeriod[]): number | null {
  if (!periods.length) return null
  const vals = periods.map(p => parseWindKt(p.windSpeed))
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function avgFt(periods: WaveHourly[]): number | null {
  const vals = periods.map(p => p.waveHeightFt).filter((v): v is number => v !== null && v > 0)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export function DayCallCard({
  label,
  alerts,
  hourlyPeriods,
  wavePeriods,
  windowStart,
  windowEnd,
  isPrimary = true,
}: DayCallCardProps) {
  if (!hourlyPeriods.length && !wavePeriods.length) return null

  const windKts = hourlyPeriods.map(p => parseWindKt(p.windSpeed))
  const gustKts = hourlyPeriods.map(p => parseWindKt(p.windGust))
  const waveFts = wavePeriods.map(p => p.waveHeightFt ?? 0)

  const maxWindKt = Math.max(...windKts, 0)
  const maxGustKt = Math.max(...gustKts, 0)
  const maxWaveFt = Math.max(...waveFts, 0)

  const peakWindIdx = windKts.indexOf(maxWindKt)
  const peakWaveIdx = waveFts.indexOf(maxWaveFt)
  const peakWindTime = hourlyPeriods[peakWindIdx]?.startTime ?? ''
  const peakWaveTime = wavePeriods[peakWaveIdx]?.startTime ?? ''

  const hasWarning = alerts.some(a => a.event.toLowerCase().includes('warning'))

  let verdict: 'Good' | 'Marginal' | 'Rough'
  let verdictColor: string
  let cardStyle: string
  if (maxWindKt > 20 || maxWaveFt > 4 || hasWarning) {
    verdict = 'Rough'
    verdictColor = 'text-red-400'
    cardStyle = 'border-red-900 bg-red-950/40'
  } else if (maxWindKt < 12 && (maxWaveFt < 2 || !wavePeriods.length)) {
    verdict = 'Good'
    verdictColor = 'text-emerald-400'
    cardStyle = 'border-emerald-900 bg-emerald-950/40'
  } else {
    verdict = 'Marginal'
    verdictColor = 'text-amber-400'
    cardStyle = 'border-amber-900 bg-amber-950/40'
  }

  // Peak lines — wind and waves separately for compact layout
  const windPeakLine = maxGustKt > maxWindKt
    ? `${maxWindKt}kt G${maxGustKt}${peakWindTime ? ` @ ${fmtTime(peakWindTime)}` : ''}`
    : `${maxWindKt}kt${peakWindTime ? ` @ ${fmtTime(peakWindTime)}` : ''}`
  const wavePeakLine = maxWaveFt > 0
    ? `${maxWaveFt.toFixed(1)}ft${peakWaveTime ? ` @ ${fmtTime(peakWaveTime)}` : ''}`
    : null

  // Plain-English summary (only for primary card)
  let summary = ''
  if (isPrimary && hourlyPeriods.length) {
    const firstKt = windKts[0] ?? 0
    const lastKt = windKts[windKts.length - 1] ?? 0
    const dir = hourlyPeriods[0]?.windDirection ?? ''
    let windPhrase: string
    if (maxWindKt - firstKt >= 5 && peakWindIdx > 0) {
      windPhrase = `Building to ${maxWindKt}kt by ${fmtTime(peakWindTime)}`
    } else if (firstKt - lastKt >= 5) {
      windPhrase = `Easing from ${firstKt}kt`
    } else {
      const lo = Math.min(firstKt, lastKt)
      const hi = Math.max(firstKt, lastKt)
      windPhrase = lo === hi ? `${dir} ${firstKt}kt` : `${dir} ${lo}–${hi}kt`
    }
    const posWaves = waveFts.filter(v => v > 0)
    const minWaveFt = posWaves.length ? Math.min(...posWaves) : 0
    const wavePhrase = maxWaveFt > 0
      ? (maxWaveFt - minWaveFt >= 0.5
          ? `waves ${minWaveFt.toFixed(1)}-${maxWaveFt.toFixed(1)}ft`
          : `waves ~${maxWaveFt.toFixed(1)}ft`)
      : ''
    const maxPrecip = Math.max(...hourlyPeriods.map(p => p.probabilityOfPrecipitation.value ?? 0))
    const precipPhrase = maxPrecip >= 40 ? ', showers possible' : ''
    summary = [windPhrase, wavePhrase].filter(Boolean).join(', ') + precipPhrase + '.'
  }

  // Morning / midday / evening breakdown
  const totalMs = windowEnd.getTime() - windowStart.getTime()
  const third = totalMs / 3
  const seg1End = new Date(windowStart.getTime() + third)
  const seg2End = new Date(windowStart.getTime() + 2 * third)

  const inSeg = (t: number, start: Date, end: Date) => t >= start.getTime() && t < end.getTime()
  const seg1H = hourlyPeriods.filter(p => inSeg(new Date(p.startTime).getTime(), windowStart, seg1End))
  const seg2H = hourlyPeriods.filter(p => inSeg(new Date(p.startTime).getTime(), seg1End, seg2End))
  const seg3H = hourlyPeriods.filter(p => inSeg(new Date(p.startTime).getTime(), seg2End, windowEnd))
  const seg1W = wavePeriods.filter(p => inSeg(new Date(p.startTime).getTime(), windowStart, seg1End))
  const seg2W = wavePeriods.filter(p => inSeg(new Date(p.startTime).getTime(), seg1End, seg2End))
  const seg3W = wavePeriods.filter(p => inSeg(new Date(p.startTime).getTime(), seg2End, windowEnd))

  const segs = [
    { label: segLabel(windowStart.getTime()), hourly: seg1H, waves: seg1W },
    { label: segLabel(seg1End.getTime()), hourly: seg2H, waves: seg2W },
    { label: segLabel(seg2End.getTime()), hourly: seg3H, waves: seg3W },
  ]

  return (
    <div className={`rounded-2xl border p-3 flex flex-col ${cardStyle} ${!isPrimary ? 'opacity-60' : ''}`}>
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className={`font-bold mb-1 ${verdictColor} ${isPrimary ? 'text-2xl' : 'text-xl'}`}>
        {verdict}
      </div>
      <div className="text-xs text-slate-400 tabular-nums leading-snug">{windPeakLine}</div>
      {wavePeakLine && <div className="text-xs text-slate-400 tabular-nums leading-snug mb-1">{wavePeakLine}</div>}
      {summary && <div className="text-xs text-slate-500 mb-2 leading-snug">{summary}</div>}
      {!summary && <div className="mb-2" />}

      {/* AM / Mid / Eve breakdown */}
      <div className="grid grid-cols-3 gap-1 border-t border-slate-800/60 pt-2 mt-auto">
        {segs.map(seg => {
          const kt = avgKt(seg.hourly)
          const ft = avgFt(seg.waves)
          return (
            <div key={seg.label} className="flex flex-col items-center gap-0.5">
              <div className="text-xs text-slate-600">{seg.label}</div>
              <div className={`text-xs font-semibold tabular-nums ${windColor(kt)}`}>
                {kt !== null ? `${kt}kt` : '—'}
              </div>
              <div className={`text-xs tabular-nums ${ft !== null ? waveColor(ft) : 'text-slate-600'}`}>
                {ft !== null ? `${ft.toFixed(1)}ft` : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
