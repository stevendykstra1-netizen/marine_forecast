import { MarineZoneForecast } from '../types'

interface Props {
  data: MarineZoneForecast | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function MarineSection({ data, isLoading, error, onRetry }: Props) {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-slate-500">Marine Zone · LMZ741</div>
        {data?.updatedAt && (
          <div className="text-xs text-slate-600">
            {data.updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} className={`h-2 bg-slate-700 rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-slate-500">
          Couldn't load marine zone forecast.{' '}
          <button onClick={onRetry} className="underline underline-offset-2 text-slate-400 active:scale-95">
            Retry
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-3 divide-y divide-slate-800">
          {data.periods.map((p, i) => (
            <div key={i} className={i > 0 ? 'pt-3' : ''}>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                {p.name}
              </div>
              <pre className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap break-words">{p.text}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
