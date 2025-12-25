'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { compressToTargetSize } from '@/lib/imageCompression'

interface ImageUploadProps {
  // Support both prop naming conventions
  value?: string | null
  currentImageUrl?: string | null
  onChange?: (url: string) => void
  onImageUploaded?: (url: string) => void
  label?: string
  folder?: string
  className?: string
  maxSizeMB?: number
}

export function ImageUpload({ 
  value, 
  currentImageUrl,
  onChange, 
  onImageUploaded,
  label = 'Foto', 
  folder = 'uploads',
  className = '',
  maxSizeMB = 1
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Support both prop conventions
  const imageUrl = value || currentImageUrl || ''
  const handleChange = onChange || onImageUploaded || (() => {})

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary not configured')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || 'Upload failed')
    }

    const data = await response.json()
    return data.secure_url
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    // Allow larger initial size since we'll compress
    if (file.size > 20 * 1024 * 1024) {
      setError('Ukuran file maksimal 20MB')
      return
    }

    setError(null)
    setProgress('')

    try {
      // Step 1: Compress
      setCompressing(true)
      setProgress('Mengompres gambar...')
      
      const originalSize = (file.size / 1024 / 1024).toFixed(2)
      const compressedFile = await compressToTargetSize(file, maxSizeMB)
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)
      
      console.log(`Compression: ${originalSize}MB → ${compressedSize}MB`)
      setCompressing(false)

      // Step 2: Upload
      setUploading(true)
      setProgress('Mengupload...')
      
      const url = await uploadToCloudinary(compressedFile)
      handleChange(url)
      setProgress('')
      
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Gagal mengupload gambar')
    } finally {
      setUploading(false)
      setCompressing(false)
      setProgress('')
    }
  }

  const handleRemove = () => {
    handleChange('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Generate unique ID for this instance
  const inputId = `image-upload-${Math.random().toString(36).substr(2, 9)}`
  const isProcessing = uploading || compressing

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt="Preview"
                fill
                sizes="96px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={isProcessing}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
            disabled={isProcessing}
          />
          <label
            htmlFor={inputId}
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">{progress || 'Memproses...'}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm text-gray-600">Pilih Gambar</span>
              </>
            )}
          </label>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP (Maks. 20MB, auto compress)</p>
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
