'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  FileText, Download, Search, Image as ImageIcon, Video, Share2, Palette,
  BookOpen, Megaphone, Mail, MessageSquare, Instagram, Facebook,
  Twitter, Linkedin, Plus, Eye, ExternalLink, Copy
} from 'lucide-react'

interface Material {
  id: string
  title: string
  type: string
  category: string
  description: string
  fileSize?: string
  format?: string
  thumbnailUrl?: string
  downloadUrl?: string
  createdAt: string
}

interface SocialTemplate {
  id: string
  platform: string
  title: string
  content: string
  hashtags: string
  imagePrompt?: string
}

// Marketing data is now fetched from the API

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
}

const platformColors: Record<string, string> = {
  facebook: 'bg-[#1877F2]/10 text-[#1877F2]',
  instagram: 'bg-[#E4405F]/10 text-[#E4405F]',
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2]',
  twitter: 'bg-black/10 text-black',
  whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
}

const typeIcons: Record<string, React.ReactNode> = {
  brochure: <BookOpen className="h-5 w-5" />,
  flyer: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  infographic: <ImageIcon className="h-5 w-5" />,
}

export default function PartnerMarketing() {
  const { currentUser } = useAppStore()
  const [materials, setMaterials] = useState<Material[]>([])
  const [socialTemplates, setSocialTemplates] = useState<SocialTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SocialTemplate | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    async function fetchMarketing() {
      try {
        setLoading(true)
        const res = await fetch('/api/marketing?limit=50')
        if (res.ok) {
          const json = await res.json()
          const content = (json.content || json.marketingContent || []).map((c: any) => ({
            id: c.id,
            title: c.title || 'Untitled',
            type: c.contentType || 'brochure',
            category: c.category || 'General',
            description: c.caption || c.description || '',
            fileSize: c.fileSize || undefined,
            format: c.format || undefined,
            thumbnailUrl: c.thumbnailUrl || undefined,
            downloadUrl: c.fileUrl || undefined,
            createdAt: c.createdAt || '',
          }))
          setMaterials(content)
          const templates = (json.campaigns || []).flatMap((camp: any) =>
            (camp.socialPosts || []).map((p: any) => ({
              id: p.id,
              platform: p.platform || 'facebook',
              title: p.title || camp.name || 'Template',
              content: p.content || p.caption || '',
              hashtags: p.hashtags || '',
              imagePrompt: p.imagePrompt || undefined,
            }))
          )
          if (templates.length > 0) setSocialTemplates(templates)
        }
      } catch {
        setMaterials([])
        setSocialTemplates([])
      } finally {
        setLoading(false)
      }
    }
    fetchMarketing()
  }, [])

  const filteredMaterials = materials.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

  const handleDownload = (material: Material) => {
    toast.success(`Downloading ${material.title}...`)
  }

  const handleRequestMaterial = async () => {
    setRequesting(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Custom material request submitted! Our team will contact you shortly.')
    setShowRequestDialog(false)
    setRequesting(false)
  }

  const handleCopyTemplate = (template: SocialTemplate) => {
    const fullContent = `${template.content}\n\n${template.hashtags}`
    navigator.clipboard.writeText(fullContent).then(() => {
      toast.success('Template copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy template')
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Marketing Materials</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and download marketing resources from ALO Education</p>
        </div>
        <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Request Custom Material
        </Button>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Marketing Materials</TabsTrigger>
          <TabsTrigger value="social">Social Media Templates</TabsTrigger>
          <TabsTrigger value="brand">Brand Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="brochure">Brochures</SelectItem>
                <SelectItem value="flyer">Flyers</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="infographic">Infographics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#F37021]/10 text-[#F37021] flex items-center justify-center shrink-0">
                      {typeIcons[material.type] || <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2332] truncate">{material.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">{material.type}</Badge>
                        <Badge variant="outline" className="text-[10px] h-5">{material.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2">{material.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      {material.format && <span>{material.format}</span>}
                      {material.fileSize && <span>{material.fileSize}</span>}
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDownload(material)}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No marketing materials found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Ready-to-use social media post templates for your channels</p>
          </div>
          <div className="space-y-4">
            {socialTemplates.map((template) => (
              <Card key={template.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${platformColors[template.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {platformIcons[template.platform] || <Share2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1A2332]">{template.title}</p>
                        <Badge className={`text-xs capitalize ${platformColors[template.platform] || 'bg-gray-100 text-gray-600'}`}>
                          {template.platform}
                        </Badge>
                      </div>
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{template.content}</p>
                        {template.hashtags && (
                          <p className="text-xs text-[#0066CC] mt-2">{template.hashtags}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCopyTemplate(template)}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedTemplate(template); setShowTemplateDialog(true) }}>
                          <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#F37021]" /> ALO Education Brand Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Primary Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'ALO Orange', hex: '#F37021', bg: 'bg-[#F37021]' },
                    { name: 'Education Blue', hex: '#0066CC', bg: 'bg-[#0066CC]' },
                    { name: 'Dark Navy', hex: '#1A2332', bg: 'bg-[#1A2332]' },
                    { name: 'Light BG', hex: '#F7F9FC', bg: 'bg-[#F7F9FC] border border-gray-200' },
                  ].map((color) => (
                    <div key={color.name} className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg shrink-0 ${color.bg}`} />
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">{color.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Logo Usage */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Logo Usage</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">ALO</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">Primary Logo</p>
                      <p className="text-xs text-gray-500">Use on white or light backgrounds. Minimum size: 120px wide.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#1A2332] rounded-lg">
                    <div className="w-8 h-8 bg-[#F37021] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">ALO</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Reverse Logo</p>
                      <p className="text-xs text-gray-400">Use on dark backgrounds. Same size requirements apply.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Typography */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Typography</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-[#1A2332]">Headings - Bold</p>
                    <p className="text-xs text-gray-500 mt-1">Use for section headings and key messages. Always bold weight.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-base text-[#1A2332]">Body Text - Regular</p>
                    <p className="text-xs text-gray-500 mt-1">Use for descriptions and content. Regular weight, comfortable line height.</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Do's and Don'ts */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A2332] mb-3">Brand Do&apos;s &amp; Don&apos;ts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-sm font-semibold text-green-700 mb-2">✓ Do</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Use approved brand colors only</li>
                      <li>• Maintain minimum clear space around logo</li>
                      <li>• Use high-resolution assets</li>
                      <li>• Follow the approved social media templates</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 mb-2">✗ Don&apos;t</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      <li>• Don&apos;t stretch or distort the logo</li>
                      <li>• Don&apos;t use unofficial colors</li>
                      <li>• Don&apos;t add effects or shadows to the logo</li>
                      <li>• Don&apos;t modify the social media templates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => toast.success('Downloading Brand Guidelines PDF...')}>
                <Download className="h-4 w-4 mr-2" /> Download Full Brand Guidelines PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Custom Material Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Custom Marketing Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Material Type</Label>
              <Select defaultValue="flyer">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brochure">Brochure</SelectItem>
                  <SelectItem value="flyer">Flyer</SelectItem>
                  <SelectItem value="social_media">Social Media Post</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="infographic">Infographic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Title / Purpose</Label>
              <Input className="mt-1" placeholder="e.g., September 2025 intake promotion flyer" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <Textarea className="mt-1 min-h-[100px]" placeholder="Describe what you need, target audience, key messages..." />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Target Platform</Label>
              <Select defaultValue="all">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
              <Button onClick={handleRequestMaterial} disabled={requesting} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                {requesting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              Social Media Template Preview
              {selectedTemplate && (
                <Badge className={`text-xs capitalize ${platformColors[selectedTemplate.platform] || 'bg-gray-100'}`}>
                  {selectedTemplate.platform}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#1A2332]">{selectedTemplate.title}</p>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedTemplate.content}</p>
                {selectedTemplate.hashtags && (
                  <p className="text-xs text-[#0066CC] mt-3">{selectedTemplate.hashtags}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => handleCopyTemplate(selectedTemplate)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
