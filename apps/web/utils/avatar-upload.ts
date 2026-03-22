/**
 * Crops and optimizes an image for use as a user avatar.
 * Output is 256x256 JPEG at 0.85 quality - sufficient for avatar display, optimized once at upload.
 */
export async function cropAvatarToBlob(
  dataUrl: string,
  zoom = 1
): Promise<Blob> {
  const size = 256
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      const w = img.naturalWidth
      const h = img.naturalHeight
      const coverScale = size / Math.min(w, h)
      const drawW = w * coverScale * zoom
      const drawH = h * coverScale * zoom
      const dx = (size - drawW) / 2
      const dy = (size - drawH) / 2
      ctx.drawImage(img, 0, 0, w, h, dx, dy, drawW, drawH)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}
