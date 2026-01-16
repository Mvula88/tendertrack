import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  url: string
  path: string
  size: number
  originalSize: number
}

export interface UploadOptions {
  bucket: string
  folder?: string
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
}

const defaultOptions: UploadOptions = {
  bucket: 'documents',
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  quality: 0.8,
}

/**
 * Compress an image file
 */
async function compressImage(file: File, options: UploadOptions): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file
  }

  const { maxSizeMB = 2, maxWidthOrHeight = 1920, quality = 0.8 } = options

  // If file is already small enough, return as is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = (height / width) * maxWidthOrHeight
          width = maxWidthOrHeight
        } else {
          width = (width / height) * maxWidthOrHeight
          height = maxWidthOrHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw image on canvas
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Return original if compression fails
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      resolve(file) // Return original if loading fails
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate a unique file path
 */
function generateFilePath(file: File, folder?: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
  const safeName = file.name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars
    .substring(0, 50) // Limit length

  const fileName = `${timestamp}-${randomId}-${safeName}.${extension}`

  return folder ? `${folder}/${fileName}` : fileName
}

/**
 * Upload a file to Supabase Storage with optional compression
 */
export async function uploadFile(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResult> {
  const opts = { ...defaultOptions, ...options }
  const supabase = createClient()
  const originalSize = file.size

  // Compress if it's an image
  let fileToUpload = file
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImage(file, opts)
  }

  // Check file size limit for non-images (PDFs, etc.)
  const maxBytes = (opts.maxSizeMB || 2) * 1024 * 1024
  if (fileToUpload.size > maxBytes * 5) { // Allow 5x for documents
    throw new Error(`File size exceeds ${opts.maxSizeMB! * 5}MB limit`)
  }

  const filePath = generateFilePath(fileToUpload, opts.folder)

  const { data, error } = await supabase.storage
    .from(opts.bucket)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(opts.bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
    size: fileToUpload.size,
    originalSize,
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string, bucket: string = 'documents'): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'))
    }
    return file.type === type
  })
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: string): 'image' | 'pdf' | 'document' | 'file' {
  if (fileType.startsWith('image/')) return 'image'
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.includes('word') || fileType.includes('document')) return 'document'
  return 'file'
}
