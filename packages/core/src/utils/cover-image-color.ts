/** Same shape as `ImageData` from canvas — structural so core stays DOM-lib-free. */
export type RgbaImageRegion = {
  width: number
  height: number
  data: Uint8ClampedArray
}

/**
 * Sampled mean RGB for a canvas region (e.g. bottom half of a cover photo)
 * so UI chrome matches the area near the fade, not the whole frame.
 */
export function averageRgbFromImageDataSampled(
  imageData: RgbaImageRegion,
  sampleStep: number = 10,
): { r: number; g: number; b: number } {
  const { width, height, data } = imageData
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count += 1
    }
  }
  if (count === 0) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: Math.floor(r / count),
    g: Math.floor(g / count),
    b: Math.floor(b / count),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
