import { MarinePeriod } from '../types'

interface Props {
  sections: MarinePeriod[] | undefined
  updatedAt: Date | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function DiscussionSection({ sections, updatedAt, isLoading, error, onRetry }: Props) {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-slate-500">Forecast Discussion · LOT</div>
        {updatedAt && (
          <div className="text-xs text-slate-600">
            {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[90, 70, 80, 55, 75].map((w, i) => (
            <div key={i} className="h-2 bg-slate-700 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-slate-500">
          Couldn't load forecast discussion.{' '}
          <button onClick={onRetry} className="underline underline-offset-2 text-slate-400 active:scale-95">
            Retry
          </button>
        </div>
      )}

      {sections && (
        <div className="space-y-3 divide-y divide-slate-800">
          {sections.map((s, i) => (
            <div key={i} className={i > 0 ? 'pt-3' : ''}>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                {s.name}
              </div>
              <pre className="text-xs text-slate-400 leading-relaxed font-mono">{s.text}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
