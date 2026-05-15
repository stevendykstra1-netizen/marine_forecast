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
          <div
            key={alert.id}
            className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}
          >
            <div className={`text-sm font-semibold ${colors.text}`}>{alert.event}</div>
            {alert.headline && (
              <div className="text-xs text-slate-300 mt-0.5">{alert.headline}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
