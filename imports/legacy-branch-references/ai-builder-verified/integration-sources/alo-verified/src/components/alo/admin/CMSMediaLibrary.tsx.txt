'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Plus, Search, Trash2, Image as ImageIcon, FileText, Download,
  Grid, List, Copy, Upload, X, Folder, Filter
} from 'lucide-react'
import { toast } from 'sonner'

const BRAND = { orange: '#F37021', navy: '#1A2332', blue: '#0066CC' }

interface MediaItem {
  id: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  category: string | null
  uploadedBy: string | null
  createdAt: string
}

const mediaCategories = ['Images', 'Documents', 'Videos', 'Other']

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileText className="h-8 w-8 text-gray-400" />
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
  if (mimeType.startsWith('video/')) return <FileText className="h-8 w-8 text-purple-500" />
  if (mimeType === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />
  return <FileText className="h-8 w-8 text-gray-400" />
}

function isImageFile(mimeType: string | null): boolean {
  return mimeType ? mimeType.startsWith('image/') : false
}

export default function CMSMediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [categories, setCategories] = useState<{name: string; count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/media?${params}`)
      const data = await res.json()
      setMedia(data.media || [])
      setCategories(data.categories || [])
    } catch {
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', 'media')

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()

        if (uploadData.success && uploadData.documents?.[0]) {
          const doc = uploadData.documents[0]
          await fetch('/api/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              filePath: doc.filePath || doc.url,
              fileSize: file.size,
              mimeType: file.type,
              category: categoryFilter !== 'all' ? categoryFilter : 'Images',
            }),
          })
        }
      }
      toast.success(`${files.length} file(s) uploaded`)
      setShowUpload(false)
      fetchMedia()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file?')) return
    try {
      await fetch(`/api/media?id=${id}`, { method: 'DELETE' })
      toast.success('Media deleted')
      fetchMedia()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const copyUrl = (filePath: string) => {
    navigator.clipboard.writeText(filePath)
    toast.success('URL copied to clipboard')
  }

  const stats = {
    total: media.length,
    images: media.filter(m => isImageFile(m.mimeType)).length,
    documents: media.filter(m => m.mimeType && !m.mimeType.startsWith('image/') && !m.mimeType.startsWith('video/')).length,
    totalSize: media.reduce((sum, m) => sum + (m.fileSize || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">Manage uploaded media files and assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4 mr-1" /> : <Grid className="h-4 w-4 mr-1" />}
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Button>
          <Button onClick={() => { setShowUpload(true); setTimeout(() => fileInputRef.current?.click(), 100) }} style={{ backgroundColor: BRAND.orange }} className="text-white hover:opacity-90">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: stats.total, color: BRAND.navy },
          { label: 'Images', value: stats.images, color: BRAND.blue },
          { label: 'Documents', value: stats.documents, color: '#22c55e' },
          { label: 'Total Size', value: formatFileSize(stats.totalSize), color: BRAND.orange },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mediaCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card className="border-0 shadow-sm bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: BRAND.orange }}>Uploading files...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND.orange, borderTopColor: 'transparent', borderWidth: 3 }} />
        </div>
      ) : media.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No media files found</p>
            <Button onClick={() => { setShowUpload(true); setTimeout(() => fileInputRef.current?.click(), 100) }} variant="outline" className="mt-4">
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map(item => (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setPreviewItem(item)}>
              <CardContent className="p-3">
                <div className="aspect-square bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {isImageFile(item.mimeType) ? (
                    <img src={item.filePath} alt={item.fileName} className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(item.mimeType)
                  )}
                </div>
                <p className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>{item.fileName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(item.fileSize)}</p>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); copyUrl(item.filePath) }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={e => { e.stopPropagation(); handleDelete(item.id) }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {media.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer" onClick={() => setPreviewItem(item)}>
                  <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {isImageFile(item.mimeType) ? (
                      <img src={item.filePath} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(item.mimeType)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: BRAND.navy }}>{item.fileName}</p>
                    <p className="text-xs text-gray-400">{item.mimeType || 'Unknown'} • {formatFileSize(item.fileSize)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.category || 'Uncategorized'}</Badge>
                  <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); copyUrl(item.filePath) }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={e => { e.stopPropagation(); handleDelete(item.id) }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: BRAND.navy }}>{previewItem?.fileName}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-md flex items-center justify-center overflow-hidden" style={{ maxHeight: 400 }}>
                {isImageFile(previewItem.mimeType) ? (
                  <img src={previewItem.filePath} alt={previewItem.fileName} className="max-w-full max-h-96 object-contain" />
                ) : (
                  <div className="py-12">{getFileIcon(previewItem.mimeType)}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">File Name:</span>
                  <p className="font-medium" style={{ color: BRAND.navy }}>{previewItem.fileName}</p>
                </div>
                <div>
                  <span className="text-gray-500">File Size:</span>
                  <p className="font-medium" style={{ color: BRAND.navy }}>{formatFileSize(previewItem.fileSize)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium" style={{ color: BRAND.navy }}>{previewItem.mimeType || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium" style={{ color: BRAND.navy }}>{previewItem.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <p className="font-medium" style={{ color: BRAND.navy }}>{new Date(previewItem.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">URL:</span>
                  <p className="font-medium text-xs truncate" style={{ color: BRAND.blue }}>{previewItem.filePath}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => previewItem && copyUrl(previewItem.filePath)}>
              <Copy className="h-4 w-4 mr-2" /> Copy URL
            </Button>
            <Button variant="destructive" onClick={() => { if (previewItem) { handleDelete(previewItem.id); setPreviewItem(null) } }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
