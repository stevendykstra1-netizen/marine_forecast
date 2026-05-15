import { BuoyObservation } from '../types'

interface Props {
  primary: BuoyObservation | null
}

function formatObservedAt(date: Date): string {
  const now = new Date()
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 2) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function Header({ primary }: Props) {
  return (
    <header className="pt-1 pb-1 flex items-center justify-between">
      <h1 className="text-base font-semibold tracking-wide text-slate-300">⚓ Chicago Marine</h1>
      {primary && (
        <span className="text-xs text-slate-500">
          {formatObservedAt(primary.observedAt)}
        </span>
      )}
    </header>
  )
}
