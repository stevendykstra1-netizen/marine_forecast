import { useState } from 'react'
import { MarinePeriod } from '../types'

interface Props {
  sections: MarinePeriod[] | undefined
  updatedAt: Date | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function DiscussionSection({ sections, updatedAt, isLoading, error, onRetry }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex items-center gap-2 py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
      >
        <span className="text-slate-700">{open ? '▾' : '▸'}</span>
        <span>Why — forecaster's reasoning</span>
        {updatedAt && (
          <span className="ml-auto text-slate-700">
            AFD issued {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-[#111d2e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <a
              href="https://forecast.weather.gov/product.php?site=LOT&issuedby=LOT&product=AFD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
            >
              Forecast Discussion · LOT <span className="text-slate-600 normal-case tracking-normal">↗</span>
            </a>
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
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
