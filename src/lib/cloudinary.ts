// Cloudinary Upload Utility
// File: /src/lib/cloudinary.ts

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

/**
 * Upload image to Cloudinary with auto compression
 */
export async function uploadToCloudinary(file: File, folder: string = 'official-id'): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary belum dikonfigurasi. Pastikan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ada di .env.local')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gagal mengupload gambar')
  }

  return response.json()
}

/**
 * Delete image from Cloudinary (requires backend/API route)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  // Note: Deletion requires server-side API with signature
  // For now, we'll skip deletion - images will be managed via Cloudinary dashboard
  console.log('Delete request for:', publicId)
  return true
}

/**
 * Get optimized Cloudinary URL with transformations
 * Apply compression and resize on retrieval
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit'
  } = {}
): string {
  if (!url) return ''
  
  // Only transform cloudinary URLs
  if (!url.includes('cloudinary.com')) {
    return url
  }

  const { 
    width = 800, 
    height = 800, 
    quality = 80, 
    format = 'auto',
    crop = 'limit'
  } = options

  // Parse cloudinary URL and add transformations
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url

  const baseUrl = url.substring(0, uploadIndex + 8)
  const publicId = url.substring(uploadIndex + 8)

  // Skip if already has transformations
  if (/^[a-z]_/.test(publicId)) {
    return url
  }

  // Build transformation string
  const transforms = [
    `c_${crop}`,
    `w_${width}`,
    `h_${height}`,
    `q_${quality}`,
    `f_${format}`
  ].join(',')

  return `${baseUrl}${transforms}/${publicId}`
}

/**
 * Get thumbnail URL (small, square)
 */
export function getThumbnailUrl(url: string, size: number = 150): string {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 70
  })
}

/**
 * Get profile photo URL (medium, square)
 */
export function getProfilePhotoUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 80
  })
}

/**
 * Get card image URL (larger, maintain aspect)
 */
export function getCardImageUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 85
  })
}

/**
 * Legacy function - kept for compatibility
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'thumb'
    quality?: number
  } = {}
): string {
  if (!CLOUD_NAME) return ''
  
  const { width = 400, height = 400, crop = 'fill', quality = 80 } = options
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${crop},w_${width},h_${height},q_${quality}/${publicId}`
}
