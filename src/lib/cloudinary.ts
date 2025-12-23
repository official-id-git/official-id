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
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary belum dikonfigurasi. Pastikan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ada di .env.local')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'official-id')

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
 * Get optimized Cloudinary URL
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
