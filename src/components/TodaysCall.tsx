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
  marineText?: string
}

function fmtTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString([], { hour: 'numeric', hour12: true })
    .toLowerCase()
    .replace(':00', '')
}

function avgKt(periods: HourlyPeriod[]): number | null {
  const vals = periods.map(p => p.windSpeedKt).filter((v): v is number => v !== null)
  if (!vals.length) return null
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
  marineText,
}: DayCallCardProps) {
  if (!hourlyPeriods.length && !wavePeriods.length) return null

  const windKts = hourlyPeriods.map(p => p.windSpeedKt ?? 0)
  const gustKts = hourlyPeriods.map(p => p.windGustKt ?? 0)
  const waveFts = wavePeriods.map(p => p.waveHeightFt ?? 0)

  const maxHourlyWindKt  = Math.max(...windKts, 0)
  const maxMarineWindKt  = Math.max(...wavePeriods.map(p => p.marineWindKt ?? 0), 0)
  const maxWindKt        = Math.max(maxHourlyWindKt, maxMarineWindKt)
  const maxGustKt        = Math.max(...gustKts, 0)
  const maxWaveFt        = Math.max(...waveFts, 0)
  const maxThunder       = Math.max(...wavePeriods.map(p => p.thunderPct ?? 0), 0)

  // Use the peak time from whichever wind source is higher
  const peakWindIdx  = maxMarineWindKt >= maxHourlyWindKt
    ? wavePeriods.map(p => p.marineWindKt ?? 0).indexOf(maxMarineWindKt)
    : windKts.indexOf(maxHourlyWindKt)
  const peakWindTime = maxMarineWindKt >= maxHourlyWindKt
    ? (wavePeriods[peakWindIdx]?.startTime ?? '')
    : (hourlyPeriods[peakWindIdx]?.startTime ?? '')
  const peakWaveIdx  = waveFts.indexOf(maxWaveFt)
  const peakWaveTime = wavePeriods[peakWaveIdx]?.startTime ?? ''

  // Any active LMZ741 alert or gale mention → escalate verdict
  const hasWarning = alerts.some(a =>
    a.event.toLowerCase().includes('warning') ||
    a.event.toLowerCase().includes('gale')
  ) || /gale/i.test(marineText ?? '')
  const hasAnyAlert = alerts.length > 0

  // Thunder: use grid data; fall back to text keyword scan
  const thunderDataMissing = wavePeriods.every(p => p.thunderPct === null)
  const textHasThunder = thunderDataMissing && !!marineText && /thunder/i.test(marineText)
  const effectiveThunder = thunderDataMissing && textHasThunder ? 25 : maxThunder

  let verdict: 'Good' | 'Marginal' | 'Rough'
  let verdictColor: string
  let cardStyle: string

  if (effectiveThunder > 50 || maxWindKt > 20 || maxWaveFt > 4 || hasWarning) {
    verdict = 'Rough'
    verdictColor = 'text-red-400'
    cardStyle = 'border-red-900 bg-red-950/40'
  } else if (effectiveThunder > 20 || hasAnyAlert) {
    // Thunder risk or any active marine advisory → cap at Marginal
    verdict = 'Marginal'
    verdictColor = 'text-amber-400'
    cardStyle = 'border-amber-900 bg-amber-950/40'
  } else if (maxWindKt < 12 && (maxWaveFt < 2 || !wavePeriods.length)) {
    verdict = 'Good'
    verdictColor = 'text-emerald-400'
    cardStyle = 'border-emerald-900 bg-emerald-950/40'
  } else {
    verdict = 'Marginal'
    verdictColor = 'text-amber-400'
    cardStyle = 'border-amber-900 bg-amber-950/40'
  }

  // Peak lines
  const windPeakLine = maxGustKt > maxWindKt
    ? `${maxWindKt}kt G${maxGustKt}${peakWindTime ? ` @ ${fmtTime(peakWindTime)}` : ''}`
    : `${maxWindKt}kt${peakWindTime ? ` @ ${fmtTime(peakWindTime)}` : ''}`
  const wavePeakLine = maxWaveFt > 0
    ? `${maxWaveFt.toFixed(1)}ft${peakWaveTime ? ` @ ${fmtTime(peakWaveTime)}` : ''}`
    : null

  // Plain-English summary
  let summary = ''
  if (isPrimary && (hourlyPeriods.length || wavePeriods.length)) {
    const firstKt = Math.max(windKts[0] ?? 0, wavePeriods[0]?.marineWindKt ?? 0)
    const lastKt  = Math.max(windKts[windKts.length - 1] ?? 0, wavePeriods[wavePeriods.length - 1]?.marineWindKt ?? 0)
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

    // Thunder timing note
    let thunderPhrase = ''
    if (effectiveThunder > 20) {
      const firstStorm = wavePeriods.find(p => (p.thunderPct ?? 0) > 20)
      thunderPhrase = firstStorm
        ? `, thunderstorms possible after ${fmtTime(firstStorm.startTime)}`
        : ', thunderstorms possible'
    }

    summary = [windPhrase, wavePhrase].filter(Boolean).join(', ') + precipPhrase + thunderPhrase + '.'
  }

  // Fixed MORN / AFT / EVE segments based on clock time of the window date
  const winDay = windowStart
  const noon = new Date(winDay.getFullYear(), winDay.getMonth(), winDay.getDate(), 12, 0)
  const fivePm = new Date(winDay.getFullYear(), winDay.getMonth(), winDay.getDate(), 17, 0)
  const nowMs = Date.now()

  const segDefs = [
    { label: 'MORN', start: windowStart, end: noon,       isPast: nowMs >= noon.getTime() },
    { label: 'AFT',  start: noon,         end: fivePm,    isPast: nowMs >= fivePm.getTime() },
    { label: 'EVE',  start: fivePm,       end: windowEnd, isPast: false },
  ]

  const inSeg = (t: number, s: Date, e: Date) => t >= s.getTime() && t < e.getTime()
  const segs = segDefs.map(seg => ({
    ...seg,
    hourly: hourlyPeriods.filter(p => inSeg(new Date(p.startTime).getTime(), seg.start, seg.end)),
    waves:  wavePeriods.filter(p  => inSeg(new Date(p.startTime).getTime(), seg.start, seg.end)),
  }))

  return (
    <div className={`rounded-2xl border p-3 flex flex-col ${cardStyle} ${!isPrimary ? 'opacity-60' : ''}`}>
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className={`font-bold mb-1 ${verdictColor} ${isPrimary ? 'text-2xl' : 'text-xl'}`}>
        {verdict}
      </div>
      <div className="text-xs text-slate-400 tabular-nums leading-snug">{windPeakLine}</div>
      {wavePeakLine && <div className="text-xs text-slate-400 tabular-nums leading-snug mb-1">{wavePeakLine}</div>}
      {summary && <div className="text-xs text-slate-500 leading-snug mb-2">{summary}</div>}
      {!summary && <div className="mb-2" />}

      {/* MORN / AFT / EVE breakdown */}
      <div className="grid grid-cols-3 gap-1 border-t border-slate-800/60 pt-2 mt-auto">
        {segs.map(seg => {
          const kt = avgKt(seg.hourly)
          const ft = avgFt(seg.waves)
          return (
            <div key={seg.label} className={`flex flex-col items-center gap-0.5 ${seg.isPast ? 'opacity-35' : ''}`}>
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
