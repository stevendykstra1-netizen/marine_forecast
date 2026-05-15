export interface StationConfig {
  id: string
  label: string
  primary: boolean
}

export interface BuoyObservation {
  stationId: string
  stationLabel: string
  windDirDeg: number | null
  windDirCardinal: string | null
  windSpeedKt: number | null
  windGustKt: number | null
  waveHeightFt: number | null
  wavePeriodSec: number | null
  waterTempF: number | null
  airTempF: number | null
  observedAt: Date
}

export interface HourlyPeriod {
  startTime: string
  temperature: number
  temperatureUnit: string
  windSpeed: string
  probabilityOfPrecipitation: { value: number | null }
  shortForecast: string
}

export interface NwsAlert {
  id: string
  event: string
  headline: string
  severity: string
}

export interface MarinePeriod {
  name: string
  text: string
}

export interface MarineZoneForecast {
  periods: MarinePeriod[]
  updatedAt: Date
}

export interface DiscussionSection {
  name: string
  text: string
}
