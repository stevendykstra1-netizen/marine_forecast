export const windColor = (kt: number | null): string => {
  if (kt === null) return 'text-slate-400'
  if (kt < 10) return 'text-emerald-400'
  if (kt < 20) return 'text-amber-400'
  return 'text-red-400'
}

export const waveColor = (ft: number | null): string => {
  if (ft === null) return 'text-slate-400'
  if (ft < 2) return 'text-emerald-400'
  if (ft < 4) return 'text-amber-400'
  return 'text-red-400'
}

export const alertColor = (severity: string): { border: string; bg: string; text: string } => {
  switch (severity.toLowerCase()) {
    case 'extreme':
    case 'severe':
      return { border: 'border-red-700', bg: 'bg-red-950', text: 'text-red-300' }
    case 'moderate':
      return { border: 'border-amber-700', bg: 'bg-amber-950', text: 'text-amber-400' }
    default:
      return { border: 'border-amber-700', bg: 'bg-amber-900/40', text: 'text-amber-300' }
  }
}
