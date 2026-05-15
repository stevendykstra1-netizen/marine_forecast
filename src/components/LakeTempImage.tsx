import { useEffect, useRef } from 'react'

// Crop bounds in the 1024×800 GLERL all-lakes image.
// x/y/w/h in original pixels, targeting southern Lake Michigan (Milwaukee→Chicago).
const CROP = { x: 230, y: 415, w: 250, h: 235 }

export function LakeTempImage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const img = new Image()
    img.src = '/api/glerl'
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const displayW = canvas.parentElement?.clientWidth ?? 340
      const displayH = Math.round(displayW * (CROP.h / CROP.w))
      canvas.width = displayW
      canvas.height = displayH
      canvas.style.height = `${displayH}px`
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, displayW, displayH)
    }
  }, [])

  return (
    <div className="bg-[#111d2e] rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">
        Lake Michigan · Surface Temp
      </div>
      <canvas ref={canvasRef} className="w-full rounded block" />
      <div className="text-xs text-slate-600 mt-2">Source: GLERL CoastWatch</div>
    </div>
  )
}
