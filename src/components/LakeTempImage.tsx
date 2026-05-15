// GLERL image is 1024x800 showing all Great Lakes.
// CSS crop via scale(4) from origin at Lake Michigan's Chicago/Milwaukee region:
// origin 33% x (western shore) × 75% y (Chicago latitude).
// Visible result: ~southern Lake Michigan, Milwaukee to Michigan City.
export function LakeTempImage() {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">Lake Michigan · Surface Temp</div>
      <div className="relative overflow-hidden rounded" style={{ height: 270 }}>
        <img
          src="/api/glerl"
          alt="Lake Michigan surface temperature"
          style={{
            position: 'absolute',
            width: '100%',
            transformOrigin: '33% 75%',
            transform: 'scale(4)',
          }}
        />
      </div>
      <div className="text-xs text-slate-600 mt-2">Source: GLERL CoastWatch</div>
    </div>
  )
}
