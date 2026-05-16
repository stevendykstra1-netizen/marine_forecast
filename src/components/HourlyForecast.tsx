import { HourlyPeriod } from '../types'

interface Props {
  periods: HourlyPeriod[]
}

function formatHour(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '')
}

export function HourlyForecast({ periods }: Props) {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <a
        href="https://forecast.weather.gov/MapClick.php?lat=41.938&lon=-87.638"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs uppercase tracking-widest text-slate-500 mb-3 block hover:text-slate-300 transition-colors"
      >
        12-Hour Forecast <span className="text-slate-600 normal-case tracking-normal">↗</span>
      </a>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-1" style={{ minWidth: 'max-content' }}>
          {periods.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1 w-16">
              <div className="text-xs text-slate-500">{formatHour(p.startTime)}</div>
              <div className="text-base font-bold text-slate-200">
                {p.temperature}°
              </div>
              <div className="text-xs text-slate-400 text-center leading-relaxed">
                {p.windSpeed}
              </div>
              {p.probabilityOfPrecipitation.value !== null && p.probabilityOfPrecipitation.value > 0 && (
                <div className="text-xs text-blue-400">
                  {p.probabilityOfPrecipitation.value}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HourlyForecastSkeleton() {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4 animate-pulse">
      <div className="h-2 w-32 bg-slate-700 rounded mb-3" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-16">
            <div className="h-2 w-8 bg-slate-700 rounded" />
            <div className="h-4 w-10 bg-slate-800 rounded" />
            <div className="h-2 w-12 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
