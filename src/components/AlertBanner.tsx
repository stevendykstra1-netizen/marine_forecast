import { NwsAlert } from '../types'
import { alertColor } from '../lib/colors'

interface Props {
  alerts: NwsAlert[]
  isLoading: boolean
}

export function AlertBanner({ alerts, isLoading }: Props) {
  if (isLoading) return null

  if (alerts.length === 0) {
    return (
      <div className="text-xs text-emerald-400 py-0.5">
        ✓ No active marine advisories for LMZ741
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const colors = alertColor(alert.severity)
        return (
          <a
            key={alert.id}
            href="https://alerts.weather.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg border p-4 block ${colors.border} ${colors.bg}`}
          >
            <div className={`text-sm font-semibold ${colors.text}`}>
              {alert.event} <span className="text-slate-600 font-normal">↗</span>
            </div>
            {alert.headline && (
              <div className="text-xs text-slate-300 mt-0.5">{alert.headline}</div>
            )}
          </a>
        )
      })}
    </div>
  )
}
