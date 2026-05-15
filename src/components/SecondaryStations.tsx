import { BuoyObservation } from '../types'
import { windColor, waveColor } from '../lib/colors'
import { WindArrow } from './WindArrow'

interface Props {
  stations: BuoyObservation[]
}

function MiniStat({ value, unit, color }: { value: string | null; unit: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-xl font-bold tabular-nums ${color}`}>
        {value ?? '—'}
      </span>
      {value !== null && <span className="text-xs text-slate-500">{unit}</span>}
    </div>
  )
}

export function SecondaryStations({ stations }: Props) {
  if (stations.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-widest text-slate-600 pt-1">Other Stations</div>
      {stations.map(obs => (
        <div key={obs.stationId} className="bg-[#111d2e] rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-2">{obs.stationLabel}</div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-600 mb-1">Wind</div>
              <div className="flex items-center gap-2">
                <MiniStat
                  value={obs.windSpeedKt !== null ? String(Math.round(obs.windSpeedKt)) : null}
                  unit="kt"
                  color={windColor(obs.windSpeedKt)}
                />
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <WindArrow deg={obs.windDirDeg} className="text-xs" />
                  {obs.windDirCardinal}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Waves</div>
              <MiniStat
                value={obs.waveHeightFt !== null ? obs.waveHeightFt.toFixed(1) : null}
                unit="ft"
                color={waveColor(obs.waveHeightFt)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Water</div>
              <MiniStat
                value={obs.waterTempF !== null ? `${obs.waterTempF}°` : null}
                unit=""
                color="text-cyan-400"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
