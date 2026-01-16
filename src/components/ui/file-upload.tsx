'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, File, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { uploadFile, formatFileSize, isAllowedFileType, type UploadOptions } from '@/lib/file-upload'
import { toast } from 'sonner'

interface FileUploadProps {
  value?: string
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function FileUpload({
  value,
  onChange,
  bucket = 'documents',
  folder,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  disabled = false,
  className,
  placeholder = 'Click to upload or drag and drop',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: number
    originalSize: number
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = accept.split(',').map(t => {
      const type = t.trim()
      if (type === '.pdf') return 'application/pdf'
      if (type === '.doc') return 'application/msword'
      if (type === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      if (type === '.jpg' || type === '.jpeg') return 'image/jpeg'
      if (type === '.png') return 'image/png'
      return type
    })

    if (!isAllowedFileType(file, allowedTypes)) {
      toast.error(`Invalid file type. Allowed: ${accept}`)
      return
    }

    // Validate file size (before compression)
    if (file.size > maxSizeMB * 1024 * 1024 * 5) {
      toast.error(`File too large. Maximum size: ${maxSizeMB * 5}MB`)
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadFile(file, {
        bucket,
        folder,
        maxSizeMB,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      })

      setUploadedFile({
        name: file.name,
        size: result.size,
        originalSize: result.originalSize,
      })
      onChange(result.url)

      const compressionRatio = ((result.originalSize - result.size) / result.originalSize * 100).toFixed(0)
      if (result.size < result.originalSize) {
        toast.success(`File uploaded! Compressed by ${compressionRatio}%`)
      } else {
        toast.success('File uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }, [bucket, folder, maxSizeMB, accept, onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [disabled, isUploading, handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleRemove = useCallback(() => {
    setUploadedFile(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [onChange])

  const getFileTypeIcon = () => {
    if (!uploadedFile) return <Upload className="h-8 w-8 text-muted-foreground" />
    const name = uploadedFile.name.toLowerCase()
    if (name.endsWith('.pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return <Image className="h-8 w-8 text-blue-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled || isUploading}
        className="hidden"
        id="file-upload"
      />

      {value && uploadedFile ? (
        // File uploaded state
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
          {getFileTypeIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(uploadedFile.size)}
              {uploadedFile.size < uploadedFile.originalSize && (
                <span className="text-green-600 ml-2">
                  (saved {formatFileSize(uploadedFile.originalSize - uploadedFile.size)})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload state
        <label
          htmlFor="file-upload"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading & compressing...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX, JPG, PNG up to {maxSizeMB * 5}MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Images will be automatically compressed
                </p>
              </div>
            </>
          )}
        </label>
      )}
    </div>
  )
}
