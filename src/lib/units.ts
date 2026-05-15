export const msToKt = (ms: number): number => Math.round(ms * 1.94384)

export const mToFt = (m: number): number => parseFloat((m * 3.28084).toFixed(1))

export const cToF = (c: number): number => Math.round(c * 9 / 5 + 32)

export const degToCardinal = (deg: number): string => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}
