import { HourlyPeriod, WaveHourly, NwsAlert } from '../types'

interface Props {
  alerts: NwsAlert[]
  hourlyPeriods: HourlyPeriod[]
  wavePeriods: WaveHourly[]
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

export function TodaysCall({ alerts, hourlyPeriods, wavePeriods }: Props) {
  if (!hourlyPeriods.length) return null

  const next12Wind = hourlyPeriods.slice(0, 12)
  const next12Waves = wavePeriods.slice(0, 12)

  const windKts = next12Wind.map(p => parseWindKt(p.windSpeed))
  const gustKts = next12Wind.map(p => parseWindKt(p.windGust))
  const waveFts = next12Waves.map(p => p.waveHeightFt ?? 0)

  const maxWindKt = Math.max(...windKts, 0)
  const maxGustKt = Math.max(...gustKts, 0)
  const maxWaveFt = Math.max(...waveFts, 0)

  const peakWindIdx = windKts.indexOf(maxWindKt)
  const peakWaveIdx = waveFts.indexOf(maxWaveFt)
  const peakWindTime = next12Wind[peakWindIdx]?.startTime ?? ''
  const peakWaveTime = next12Waves[peakWaveIdx]?.startTime ?? ''

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

  // Peak line: "Peak: 18kt G24, 3ft @ 9pm"
  const peakWindStr = maxGustKt > maxWindKt ? `${maxWindKt}kt G${maxGustKt}` : `${maxWindKt}kt`
  const peakWaveStr = maxWaveFt > 0 ? `, ${maxWaveFt.toFixed(1)}ft` : ''
  // Show the earlier of the two peak times
  const peakTime = peakWindTime && peakWaveTime
    ? (new Date(peakWindTime) <= new Date(peakWaveTime) ? peakWindTime : peakWaveTime)
    : peakWindTime || peakWaveTime
  const atTime = peakTime ? ` @ ${fmtTime(peakTime)}` : ''
  const peakLine = `Peak: ${peakWindStr}${peakWaveStr}${atTime}`

  // Plain-English summary line
  const firstKt = windKts[0] ?? 0
  const lastKt = windKts[windKts.length - 1] ?? 0
  const dir = next12Wind[0]?.windDirection ?? ''

  let windPhrase: string
  if (maxWindKt - firstKt >= 5 && peakWindIdx > 0) {
    windPhrase = `Wind building to ${maxWindKt}kt by ${fmtTime(peakWindTime)}`
  } else if (firstKt - lastKt >= 5) {
    windPhrase = `Wind easing from ${firstKt}kt`
  } else {
    const lo = Math.min(firstKt, lastKt)
    const hi = Math.max(firstKt, lastKt)
    windPhrase = lo === hi ? `Wind ${dir} ${firstKt}kt` : `Wind ${dir} ${lo}–${hi}kt`
  }

  const posWaves = waveFts.filter(v => v > 0)
  const minWaveFt = posWaves.length ? Math.min(...posWaves) : 0
  const wavePhrase = maxWaveFt > 0
    ? (maxWaveFt - minWaveFt >= 0.5
        ? `waves ${minWaveFt.toFixed(1)}-${maxWaveFt.toFixed(1)}ft`
        : `waves ~${maxWaveFt.toFixed(1)}ft`)
    : ''

  const maxPrecip = Math.max(...next12Wind.map(p => p.probabilityOfPrecipitation.value ?? 0))
  const precipPhrase = maxPrecip >= 40 ? ', showers possible' : ''

  const summary = [windPhrase, wavePhrase].filter(Boolean).join(', ') + precipPhrase + '.'

  return (
    <div className={`rounded-2xl border p-4 ${cardStyle}`}>
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Today's Call</div>
      <div className={`text-2xl font-bold mb-1 ${verdictColor}`}>{verdict}</div>
      <div className="text-xs text-slate-400 mb-1 tabular-nums">{peakLine}</div>
      <div className="text-xs text-slate-500">{summary}</div>
    </div>
  )
}
