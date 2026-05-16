export function RadarMap() {
  return (
    <div className="bg-[#111d2e] rounded-2xl overflow-hidden">
      <a
        href="https://www.windy.com/?radar,42.20,-87.20,7"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 pt-4 pb-2 text-xs uppercase tracking-widest text-slate-500 block hover:text-slate-300 transition-colors"
      >
        Live Radar · Lake Michigan <span className="text-slate-600 normal-case tracking-normal">↗</span>
      </a>
      <iframe
        src="https://embed.windy.com/embed2.html?lat=41.92&lon=-87.63&detailLat=41.92&detailLon=-87.63&zoom=8&level=surface&overlay=radar&menu=&message=&marker=&forecast=12&hourly=1&lang=en&units=metric&type=map&country=US"
        style={{ width: '100%', height: 380, border: 'none', display: 'block' }}
        title="Lake Michigan radar"
        allow="fullscreen"
      />
      <div className="px-4 pb-3 text-xs text-slate-600">Radar: Windy.com</div>
    </div>
  )
}
