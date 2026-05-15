export function RadarMap() {
  return (
    <div className="bg-[#111d2e] rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2 text-xs uppercase tracking-widest text-slate-500">
        Live Radar · Lake Michigan
      </div>
      <iframe
        src="https://embed.windy.com/embed2.html?lat=42.20&lon=-87.20&detailLat=41.94&detailLon=-87.64&zoom=7&level=surface&overlay=radar&menu=&message=&marker=&forecast=12&hourly=1&lang=en&units=metric&type=map&country=US"
        style={{ width: '100%', height: 380, border: 'none', display: 'block' }}
        title="Lake Michigan radar"
        allow="fullscreen"
      />
      <div className="px-4 pb-3 text-xs text-slate-600">Radar: Windy.com</div>
    </div>
  )
}
