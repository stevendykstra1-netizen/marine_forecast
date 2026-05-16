import { BuoyObservation, StationConfig } from '../types'
import { msToKt, mToFt, cToF, degToCardinal } from '../lib/units'

const NDBC_BASE = '/api/ndbc'

interface RawBuoyData {
  windDirDeg: number | null
  windSpeedMs: number | null
  gustMs: number | null
  wvhtM: number | null
  dpdSec: number | null
  wtmpC: number | null
  atmpC: number | null
  observedAt: Date
}

function parseSentinel(val: string): number | null {
  const n = parseFloat(val)
  if (isNaN(n)) return null
  // NDBC missing value sentinels
  if (n === 999 || n === 9999 || n === 99.0 || n === 999.0 || n === 9999.0) return null
  return n
}

function parseNdbcRows(text: string): RawBuoyData[] {
  const lines = text.split('\n').filter(l => l.trim())
  const rows: RawBuoyData[] = []

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const parts = line.split(/\s+/)
    if (parts.length < 15) continue

    const [yr, mo, dy, hr, mn, wdir, wspd, gst, wvht, dpd, , , , atmp, wtmp] = parts

    const pad = (s: string) => s.padStart(2, '0')
    const observedAt = new Date(`${yr}-${pad(mo)}-${pad(dy)}T${pad(hr)}:${pad(mn)}:00Z`)

    rows.push({
      windDirDeg: parseSentinel(wdir),
      windSpeedMs: parseSentinel(wspd),
      gustMs: parseSentinel(gst),
      wvhtM: parseSentinel(wvht),
      dpdSec: parseSentinel(dpd),
      wtmpC: parseSentinel(wtmp),
      atmpC: parseSentinel(atmp),
      observedAt,
    })
  }

  return rows
}

export async function fetchBuoy(station: StationConfig): Promise<BuoyObservation> {
  const url = `${NDBC_BASE}/${station.id}.txt`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NDBC ${station.id} fetch failed: ${res.status}`)

  const text = await res.text()
  const rows = parseNdbcRows(text)
  if (rows.length === 0) throw new Error('No valid NDBC data found')

  const current = rows[0]

  // Find the observation closest to 1 hour before the current reading
  const targetMs = current.observedAt.getTime() - 60 * 60 * 1000
  let prev: RawBuoyData | null = null
  let prevDiff = Infinity
  for (const row of rows.slice(1)) {
    const diff = Math.abs(row.observedAt.getTime() - targetMs)
    if (diff < prevDiff) { prevDiff = diff; prev = row }
  }
  if (prevDiff > 45 * 60 * 1000) prev = null

  let trend: BuoyObservation['trend']
  if (prev) {
    const windDelta = current.windSpeedMs !== null && prev.windSpeedMs !== null
      ? Math.round(msToKt(current.windSpeedMs) - msToKt(prev.windSpeedMs))
      : null
    const waveDelta = current.wvhtM !== null && prev.wvhtM !== null
      ? Math.round((mToFt(current.wvhtM) - mToFt(prev.wvhtM)) * 10) / 10
      : null
    trend = { windDeltaKt: windDelta, waveDeltaFt: waveDelta }
  }

  return {
    stationId: station.id,
    stationLabel: station.label,
    windDirDeg: current.windDirDeg,
    windDirCardinal: current.windDirDeg !== null ? degToCardinal(current.windDirDeg) : null,
    windSpeedKt: current.windSpeedMs !== null ? msToKt(current.windSpeedMs) : null,
    windGustKt: current.gustMs !== null ? msToKt(current.gustMs) : null,
    waveHeightFt: current.wvhtM !== null ? mToFt(current.wvhtM) : null,
    wavePeriodSec: current.dpdSec !== null ? Math.round(current.dpdSec) : null,
    waterTempF: current.wtmpC !== null ? cToF(current.wtmpC) : null,
    airTempF: current.atmpC !== null ? cToF(current.atmpC) : null,
    observedAt: current.observedAt,
    trend,
  }
}

export function hasData(obs: BuoyObservation): boolean {
  return obs.windSpeedKt !== null || obs.waveHeightFt !== null
}
