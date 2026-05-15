export function LakeTempImage() {
  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">Lake Surface Temp</div>
      <img
        src="https://coastwatch.glerl.noaa.gov/glsea/glsea.gif"
        alt="Great Lakes surface temperature"
        className="w-full rounded"
      />
      <div className="text-xs text-slate-600 mt-2">Source: GLERL CoastWatch</div>
    </div>
  )
}
