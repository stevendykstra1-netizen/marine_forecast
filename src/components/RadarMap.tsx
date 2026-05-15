import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RainViewerFrame {
  time: number
  path: string
}

async function fetchRadarFrames(): Promise<{ host: string; frames: RainViewerFrame[] }> {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
  const data = await res.json()
  return {
    host: data.host,
    frames: data.radar.past,
  }
}

function formatFrameTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function RadarMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const radarLayer = useRef<L.TileLayer | null>(null)
  const [frameIdx, setFrameIdx] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['radar'],
    queryFn: fetchRadarFrames,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [42.1, -87.4],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 12,
    }).addTo(map)

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
      radarLayer.current = null
    }
  }, [])

  // Set default frame index when data loads
  useEffect(() => {
    if (data && frameIdx === null) {
      setFrameIdx(data.frames.length - 1)
    }
  }, [data, frameIdx])

  // Update radar tile layer when frame changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !data || frameIdx === null) return

    const frame = data.frames[frameIdx]
    if (!frame) return

    if (radarLayer.current) {
      map.removeLayer(radarLayer.current)
    }

    radarLayer.current = L.tileLayer(
      `${data.host}${frame.path}/256/{z}/{x}/{y}/4/1_1.png`,
      { opacity: 0.7, tileSize: 256 }
    ).addTo(map)
  }, [data, frameIdx])

  const frames = data?.frames ?? []

  return (
    <div className="bg-[#111d2e] rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-slate-500">Live Radar · KLOT</div>
        {data && frameIdx !== null && (
          <div className="text-xs text-slate-500">
            {formatFrameTime(frames[frameIdx].time)}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="h-64 flex items-center justify-center text-slate-600 text-sm animate-pulse">
          Loading radar…
        </div>
      )}

      {error && (
        <div className="h-32 flex items-center justify-center text-slate-600 text-sm px-4">
          Couldn't load radar
        </div>
      )}

      <div ref={mapRef} className="h-64 w-full" style={{ display: isLoading ? 'none' : 'block' }} />

      {frames.length > 1 && frameIdx !== null && (
        <div className="px-4 pb-3 pt-2">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frameIdx}
            onChange={e => setFrameIdx(Number(e.target.value))}
            className="w-full accent-blue-400"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>{formatFrameTime(frames[0].time)}</span>
            <span>now</span>
          </div>
        </div>
      )}

      <div className="px-4 pb-3 text-xs text-slate-600">
        Radar: RainViewer · Map: © CartoDB
      </div>
    </div>
  )
}
