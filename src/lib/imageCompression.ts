// Image Compression Utility
// File: /src/lib/imageCompression.ts

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeMB: 1
}

/**
 * Compress image before upload
 * Menggunakan Canvas API untuk resize dan compress
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Skip compression for small files (under 500KB)
  if (file.size < 500 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new window.Image()
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            resolve(file) // Return original if canvas not supported
            return
          }

          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img
          const maxW = opts.maxWidth!
          const maxH = opts.maxHeight!

          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          canvas.width = width
          canvas.height = height

          // Draw with white background (for transparency)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob with quality
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }

              // If compressed is larger, return original
              if (blob.size >= file.size) {
                resolve(file)
                return
              }

              // Create new file with original name
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, outputType === 'image/png' ? '.png' : '.jpg'),
                { type: outputType }
              )

              console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`)
              resolve(compressedFile)
            },
            outputType,
            opts.quality
          )
        } catch (err) {
          console.error('Compression error:', err)
          resolve(file) // Return original on error
        }
      }

      img.onerror = () => {
        resolve(file) // Return original on error
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      resolve(file) // Return original on error
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Iterative compression to reach target size
 * Akan compress berulang sampai ukuran di bawah maxSizeMB
 */
export async function compressToTargetSize(
  file: File,
  maxSizeMB: number = 1
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  // Already small enough
  if (file.size <= maxSizeBytes) {
    return file
  }

  let compressed = file
  let quality = 0.9
  let attempts = 0
  const maxAttempts = 5

  while (compressed.size > maxSizeBytes && attempts < maxAttempts) {
    compressed = await compressImage(compressed, {
      maxWidth: 1200 - (attempts * 100), // Progressively reduce size
      maxHeight: 1200 - (attempts * 100),
      quality: quality
    })
    
    quality -= 0.15
    attempts++
  }

  // Final aggressive compression if still too large
  if (compressed.size > maxSizeBytes) {
    compressed = await compressImage(compressed, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.6
    })
  }

  return compressed
}

/**
 * Get optimized Cloudinary URL with transformations
 * Untuk gambar yang sudah ada di Cloudinary
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  const { width = 800, height = 800, quality = 80, format = 'auto' } = options

  // Parse cloudinary URL and add transformations
  // Format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url

  const baseUrl = url.substring(0, uploadIndex + 8) // includes /upload/
  const publicId = url.substring(uploadIndex + 8)

  // Build transformation string
  const transforms = [
    `w_${width}`,
    `h_${height}`,
    'c_limit', // Maintain aspect ratio, don't exceed dimensions
    `q_${quality}`,
    `f_${format}`
  ].join(',')

  return `${baseUrl}${transforms}/${publicId}`
}

/**
 * Check if image URL is already optimized (has transformations)
 */
export function isOptimizedUrl(url: string): boolean {
  if (!url || !url.includes('cloudinary.com')) {
    return false
  }
  
  // Check for transformation parameters
  return /\/upload\/[a-z]_/.test(url)
}
