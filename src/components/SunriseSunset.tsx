interface Props {
  sunrise: Date
  sunset: Date
}

function fmt(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

export function SunriseSunset({ sunrise, sunset }: Props) {
  return (
    <div className="flex justify-center gap-6 text-xs text-slate-600 -mt-1">
      <span>↑ {fmt(sunrise)}</span>
      <span>↓ {fmt(sunset)}</span>
    </div>
  )
}
