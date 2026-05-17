import { HourlyPeriod, NwsAlert, MarineZoneForecast, MarinePeriod, WaveHourly } from '../types'

const NWS_BASE = 'https://api.weather.gov'
// Belmont Harbor, Chicago
const LAT = 41.938
const LON = -87.638
const MARINE_ZONE = 'LMZ741'
const WFO = 'LOT'

async function nwsFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'chicago-marine-pwa (contact: my-email@example.com)',
      Accept: 'application/geo+json',
    },
  })
  if (!res.ok) throw new Error(`NWS fetch failed: ${res.status} ${url}`)
  return res.json()
}

async function fetchLatestProduct(type: string, office: string): Promise<{ productText: string; issuanceTime: string }> {
  const list = await nwsFetch(`${NWS_BASE}/products/types/${type}/locations/${office}`)
  const latest = list['@graph']?.[0]
  if (!latest) throw new Error(`No ${type} products found for ${office}`)
  return nwsFetch(latest['@id'])
}

// NWS products wrap lines at 80 chars. Collapse single newlines into spaces
// so the text flows naturally in the UI, but preserve blank-line paragraph breaks.
function normalizeNwsText(text: string): string {
  return text
    .replace(/\n\n+/g, '\0')
    .replace(/\n/g, ' ')
    .replace(/\0/g, '\n')
    .trim()
}

function parseProductSections(text: string): MarinePeriod[] {
  // Match period headers like "TONIGHT...", "WEDNESDAY...", "LAKE MICHIGAN...", etc.
  const sections: MarinePeriod[] = []
  // Try both NWS marine format (ALL CAPS header + ...) and AFD format (.SECTION...)
  const marinePattern = /^([A-Z][A-Z0-9 \/\-]{2,})\.\.\.\s*\n([\s\S]*?)(?=^[A-Z][A-Z0-9 \/\-]{2,}\.\.\.|\.\$\$|$)/gm

  let match
  while ((match = marinePattern.exec(text)) !== null) {
    const name = match[1].trim()
    const body = match[2].trim()
    if (name && body) sections.push({ name, text: normalizeNwsText(body) })
  }

  if (sections.length === 0) {
    // fallback: split on .SECTION... for AFD
    const parts = text.split(/(?=^\.[A-Z])/m)
    for (const part of parts) {
      const headerMatch = part.match(/^\.([A-Z][A-Z0-9 ]+)\.\.\.([\s\S]*)/)
      if (headerMatch) {
        sections.push({ name: headerMatch[1].trim(), text: normalizeNwsText(headerMatch[2]) })
      }
    }
  }

  return sections.length > 0 ? sections : [{ name: 'FORECAST', text: text.trim() }]
}

function parseNwsMphToKt(s: unknown): number | null {
  if (!s || typeof s !== 'string') return null
  if (s.toLowerCase() === 'calm') return 0
  const nums = s.match(/\d+/g)
  if (!nums) return null
  const mph = nums.length > 1
    ? (parseInt(nums[0]) + parseInt(nums[nums.length - 1])) / 2
    : parseInt(nums[0])
  return Math.round(mph * 0.868976)
}

// --- Points (cached once) ---
let pointsCache: { forecastHourly: string; forecastZone: string; forecastGridData: string } | null = null

async function getPoints() {
  if (pointsCache) return pointsCache
  const data = await nwsFetch(`${NWS_BASE}/points/${LAT},${LON}`)
  pointsCache = {
    forecastHourly: data.properties.forecastHourly,
    forecastZone: data.properties.forecastZone,
    forecastGridData: data.properties.forecastGridData,
  }
  return pointsCache
}

// Marine grid point — ~5 miles offshore of Belmont Harbor, resolves to LMZ741 water cell.
// The land point (41.938,-87.638) resolves to Lincolnwood IL and returns stub waveHeight values.
const MARINE_LAT = 41.92
const MARINE_LON = -87.50
let marineGridCache: { forecastGridData: string } | null = null

async function getMarineGrid() {
  if (marineGridCache) return marineGridCache
  const data = await nwsFetch(`${NWS_BASE}/points/${MARINE_LAT},${MARINE_LON}`)
  marineGridCache = { forecastGridData: data.properties.forecastGridData }
  return marineGridCache
}

// --- Hourly forecast ---
export async function fetchHourlyForecast(): Promise<HourlyPeriod[]> {
  const { forecastHourly } = await getPoints()
  const data = await nwsFetch(forecastHourly)
  return data.properties.periods.slice(0, 48).map((p: Record<string, unknown>) => ({
    startTime: p.startTime,
    temperature: p.temperature,
    temperatureUnit: p.temperatureUnit,
    windSpeedKt: parseNwsMphToKt(p.windSpeed),
    windGustKt: parseNwsMphToKt(p.windGust),
    windDirection: p.windDirection,
    probabilityOfPrecipitation: (p.probabilityOfPrecipitation as { value: number | null }) ?? { value: null },
    shortForecast: p.shortForecast,
  }))
}

// --- Alerts ---
export async function fetchAlerts(): Promise<NwsAlert[]> {
  const data = await nwsFetch(`${NWS_BASE}/alerts/active?zone=${MARINE_ZONE}`)
  return (data.features ?? []).map((f: Record<string, unknown>) => {
    const props = f.properties as Record<string, string>
    return {
      id: props.id,
      event: props.event,
      headline: props.headline,
      severity: props.severity,
    }
  })
}

// LMZ741 = Wilmette Harbor to Northerly Island IL (Belmont Harbor area).
// The NSH product from LOT groups it as LMZ740>742.
function zoneGroupCoversLmz741(header: string): boolean {
  const rangeMatch = header.match(/LMZ(\d+)>(\d+)/)
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10)
    const hi = parseInt(rangeMatch[2], 10)
    return lo <= 741 && 741 <= hi
  }
  return header.includes('LMZ741')
}

function parseNshForZone741(text: string): MarinePeriod[] {
  // NSH product splits sections with $$
  const chunks = text.split(/\$\$/)
  for (const chunk of chunks) {
    if (!zoneGroupCoversLmz741(chunk)) continue
    // Split on period headers (.WORD...) rather than using $ lookahead,
    // which matches line-end in /gm mode and truncates multi-line bodies.
    const periods: MarinePeriod[] = []
    const subChunks = chunk.split(/^(?=\.[A-Z])/m)
    for (const sc of subChunks) {
      const m = sc.match(/^\.([\w ]+)\.\.\.([\s\S]*)/)
      if (m) {
        const name = m[1].trim()
        const body = m[2].trim()
        if (name && body) periods.push({ name, text: normalizeNwsText(body) })
      }
    }
    if (periods.length > 0) return periods
  }
  return parseProductSections(text)
}

// --- Marine zone forecast ---
export async function fetchMarineZone(): Promise<MarineZoneForecast> {
  const product = await fetchLatestProduct('NSH', WFO)
  return {
    periods: parseNshForZone741(product.productText),
    updatedAt: new Date(product.issuanceTime),
  }
}

// --- Wave forecast (grid data) ---
type GridValue = { validTime: string; value: number | null }

function expandGridValues(values: GridValue[], now: number, cutoff: number): Map<number, number | null> {
  const map = new Map<number, number | null>()
  for (const v of values) {
    const [isoStart, duration] = v.validTime.split('/')
    const start = new Date(isoStart).getTime()
    const hrs = duration ? parseInt(duration.replace(/[^0-9]/g, '')) || 1 : 1
    for (let h = 0; h < hrs; h++) {
      const t = start + h * 3600 * 1000
      if (t >= now && t < cutoff) map.set(t, v.value)
    }
  }
  return map
}

export async function fetchWaveForecast(): Promise<WaveHourly[]> {
  const { forecastGridData } = await getMarineGrid()
  const data = await nwsFetch(forecastGridData)
  const now = Date.now()
  const cutoff = now + 48 * 60 * 60 * 1000

  const waveMap    = expandGridValues(data.properties?.waveHeight?.values           ?? [], now, cutoff)
  const thunderMap = expandGridValues(data.properties?.probabilityOfThunder?.values  ?? [], now, cutoff)
  // windSpeed in marine grid is m/s — convert to kt (×1.94384)
  const windMsMap  = expandGridValues(data.properties?.windSpeed?.values             ?? [], now, cutoff)

  // Merge all timestamps
  const allTs = new Set([...waveMap.keys(), ...thunderMap.keys(), ...windMsMap.keys()])
  const hours: WaveHourly[] = []
  for (const t of allTs) {
    const rawWave = waveMap.get(t) ?? null
    const rawWind = windMsMap.get(t) ?? null
    hours.push({
      startTime:    new Date(t).toISOString(),
      waveHeightFt: rawWave !== null ? Math.round(rawWave * 3.28084 * 10) / 10 : null,
      thunderPct:   thunderMap.get(t) ?? null,
      marineWindKt: rawWind !== null ? Math.round(rawWind * 1.94384) : null,
    })
  }
  hours.sort((a, b) => a.startTime.localeCompare(b.startTime))
  return hours.slice(0, 48)
}

// --- Sunrise / Sunset ---
export async function fetchSunriseSunset(): Promise<{ sunrise: Date; sunset: Date }> {
  const res = await fetch(
    `https://api.sunrise-sunset.org/json?lat=${LAT}&lng=${LON}&formatted=0`
  )
  if (!res.ok) throw new Error(`Sunrise fetch failed: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'OK') throw new Error('Sunrise API error')
  return {
    sunrise: new Date(data.results.sunrise),
    sunset: new Date(data.results.sunset),
  }
}

// --- Forecast discussion ---
export async function fetchDiscussion(): Promise<{ sections: MarinePeriod[]; updatedAt: Date }> {
  const product = await fetchLatestProduct('AFD', WFO)
  return {
    sections: parseProductSections(product.productText),
    updatedAt: new Date(product.issuanceTime),
  }
}
