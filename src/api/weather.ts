import { HourlyPeriod, NwsAlert, MarineZoneForecast, MarinePeriod } from '../types'

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

function parseProductSections(text: string): MarinePeriod[] {
  // Match period headers like "TONIGHT...", "WEDNESDAY...", "LAKE MICHIGAN...", etc.
  const sections: MarinePeriod[] = []
  // Try both NWS marine format (ALL CAPS header + ...) and AFD format (.SECTION...)
  const marinePattern = /^([A-Z][A-Z0-9 \/\-]{2,})\.\.\.\s*\n([\s\S]*?)(?=^[A-Z][A-Z0-9 \/\-]{2,}\.\.\.|\.\$\$|$)/gm

  let match
  while ((match = marinePattern.exec(text)) !== null) {
    const name = match[1].trim()
    const body = match[2].trim()
    if (name && body) sections.push({ name, text: body })
  }

  if (sections.length === 0) {
    // fallback: split on .SECTION... for AFD
    const parts = text.split(/(?=^\.[A-Z])/m)
    for (const part of parts) {
      const headerMatch = part.match(/^\.([A-Z][A-Z0-9 ]+)\.\.\.([\s\S]*)/)
      if (headerMatch) {
        sections.push({ name: headerMatch[1].trim(), text: headerMatch[2].trim() })
      }
    }
  }

  return sections.length > 0 ? sections : [{ name: 'FORECAST', text: text.trim() }]
}

// --- Points (cached once) ---
let pointsCache: { forecastHourly: string; forecastZone: string } | null = null

async function getPoints() {
  if (pointsCache) return pointsCache
  const data = await nwsFetch(`${NWS_BASE}/points/${LAT},${LON}`)
  pointsCache = {
    forecastHourly: data.properties.forecastHourly,
    forecastZone: data.properties.forecastZone,
  }
  return pointsCache
}

// --- Hourly forecast ---
export async function fetchHourlyForecast(): Promise<HourlyPeriod[]> {
  const { forecastHourly } = await getPoints()
  const data = await nwsFetch(forecastHourly)
  return data.properties.periods.slice(0, 24).map((p: Record<string, unknown>) => ({
    startTime: p.startTime,
    temperature: p.temperature,
    temperatureUnit: p.temperatureUnit,
    windSpeed: p.windSpeed,
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
    // Extract .PERIOD...text blocks
    const periods: MarinePeriod[] = []
    const re = /^\.([\w ]+)\.\.\.([\s\S]*?)(?=^\.[A-Z]|$)/gm
    let m
    while ((m = re.exec(chunk)) !== null) {
      const name = m[1].trim()
      const body = m[2].trim()
      if (name && body) periods.push({ name, text: body })
    }
    if (periods.length > 0) return periods
  }
  // Fallback: return generic parse
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

// --- Forecast discussion ---
export async function fetchDiscussion(): Promise<{ sections: MarinePeriod[]; updatedAt: Date }> {
  const product = await fetchLatestProduct('AFD', WFO)
  return {
    sections: parseProductSections(product.productText),
    updatedAt: new Date(product.issuanceTime),
  }
}
