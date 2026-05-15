interface Props {
  deg: number | null
  className?: string
}

export function WindArrow({ deg, className = '' }: Props) {
  if (deg === null) return <span className={`text-slate-600 ${className}`}>—</span>
  return (
    <span
      className={`inline-block transition-transform ${className}`}
      style={{ transform: `rotate(${deg}deg)` }}
      aria-label={`${deg}°`}
    >
      ↑
    </span>
  )
}
