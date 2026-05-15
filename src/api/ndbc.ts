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

function parseNdbcText(text: string): RawBuoyData {
  const lines = text.split('\n').filter(l => l.trim())

  // First two lines are comment headers starting with #
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const parts = line.split(/\s+/)
    if (parts.length < 15) continue

    const [yr, mo, dy, hr, mn, wdir, wspd, gst, wvht, dpd, , , , atmp, wtmp] = parts

    const pad = (s: string) => s.padStart(2, '0')
    const observedAt = new Date(`${yr}-${pad(mo)}-${pad(dy)}T${pad(hr)}:${pad(mn)}:00Z`)

    return {
      windDirDeg: parseSentinel(wdir),
      windSpeedMs: parseSentinel(wspd),
      gustMs: parseSentinel(gst),
      wvhtM: parseSentinel(wvht),
      dpdSec: parseSentinel(dpd),
      wtmpC: parseSentinel(wtmp),
      atmpC: parseSentinel(atmp),
      observedAt,
    }
  }

  throw new Error('No valid NDBC data found')
}

export async function fetchBuoy(station: StationConfig): Promise<BuoyObservation> {
  const url = `${NDBC_BASE}/${station.id}.txt`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NDBC ${station.id} fetch failed: ${res.status}`)

  const text = await res.text()
  const raw = parseNdbcText(text)

  return {
    stationId: station.id,
    stationLabel: station.label,
    windDirDeg: raw.windDirDeg,
    windDirCardinal: raw.windDirDeg !== null ? degToCardinal(raw.windDirDeg) : null,
    windSpeedKt: raw.windSpeedMs !== null ? msToKt(raw.windSpeedMs) : null,
    windGustKt: raw.gustMs !== null ? msToKt(raw.gustMs) : null,
    waveHeightFt: raw.wvhtM !== null ? mToFt(raw.wvhtM) : null,
    wavePeriodSec: raw.dpdSec !== null ? Math.round(raw.dpdSec) : null,
    waterTempF: raw.wtmpC !== null ? cToF(raw.wtmpC) : null,
    airTempF: raw.atmpC !== null ? cToF(raw.atmpC) : null,
    observedAt: raw.observedAt,
  }
}

export function hasData(obs: BuoyObservation): boolean {
  return obs.windSpeedKt !== null || obs.waveHeightFt !== null
}
