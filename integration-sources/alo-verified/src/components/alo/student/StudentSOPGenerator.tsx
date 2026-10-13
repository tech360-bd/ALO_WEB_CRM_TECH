'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  FileText, Sparkles, Save, Download, Loader2, AlertTriangle, Edit
} from 'lucide-react'

export default function StudentSOPGenerator() {
  const { currentUser } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    targetUniversity: '',
    targetCourse: '',
    careerGoals: '',
    backgroundHighlights: '',
    whyThisUniversity: '',
    achievements: '',
  })
  const [generatedSOP, setGeneratedSOP] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  async function handleGenerate() {
    if (!form.targetUniversity || !form.targetCourse || !form.careerGoals) {
      toast.error('Please fill in university, course, and career goals')
      return
    }
    try {
      setGenerating(true)
      const prompt = `Generate a professional Statement of Purpose (SOP) for a student applying to study abroad.

Student Details:
- Target University: ${form.targetUniversity}
- Target Course: ${form.targetCourse}
- Career Goals: ${form.careerGoals}
- Background Highlights: ${form.backgroundHighlights || 'Not specified'}
- Why This University: ${form.whyThisUniversity || 'Not specified'}
- Achievements: ${form.achievements || 'Not specified'}
- Student Name: ${currentUser?.name || 'Student'}

Write a compelling 800-1000 word SOP that includes:
1. Strong opening paragraph about motivation
2. Academic background and preparation
3. Why this specific course and university
4. Relevant experience and achievements
5. Career goals and how this course helps
6. Conclusion with commitment

Make it authentic, professional, and specific to the details provided. Do NOT use placeholder text.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: prompt,
          agentType: 'sop_assistant',
          inputText: prompt,
          userId: currentUser?.id,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setGeneratedSOP(data.output || 'Failed to generate SOP. Please try again.')
      setIsEditing(false)
      toast.success('SOP generated successfully!')
    } catch (err) {
      toast.error('Failed to generate SOP. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveDraft() {
    if (!generatedSOP) { toast.error('No SOP to save'); return }
    try {
      setSaving(true)
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser?.referenceId,
          documentType: 'sop_draft',
          documentName: `SOP - ${form.targetUniversity} - ${form.targetCourse}`,
          content: generatedSOP,
        }),
      })
      toast.success('Draft saved successfully')
    } catch {
      toast.error('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([generatedSOP], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOP_${form.targetUniversity.replace(/\s+/g, '_')}_${form.targetCourse.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SOP downloaded')
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>AI SOP Generator</h1>
        <p className="text-gray-500 text-sm">Generate a professional Statement of Purpose with AI assistance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#0066CC' }} />
              <CardTitle style={{ color: '#1A2332' }}>SOP Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Target University *</Label>
              <Input value={form.targetUniversity} onChange={(e) => setForm(p => ({ ...p, targetUniversity: e.target.value }))} placeholder="e.g. University of Manchester" />
            </div>
            <div>
              <Label>Target Course *</Label>
              <Input value={form.targetCourse} onChange={(e) => setForm(p => ({ ...p, targetCourse: e.target.value }))} placeholder="e.g. MSc Computer Science" />
            </div>
            <div>
              <Label>Career Goals *</Label>
              <Textarea value={form.careerGoals} onChange={(e) => setForm(p => ({ ...p, careerGoals: e.target.value }))} placeholder="Describe your short-term and long-term career goals..." rows={3} />
            </div>
            <div>
              <Label>Background Highlights</Label>
              <Textarea value={form.backgroundHighlights} onChange={(e) => setForm(p => ({ ...p, backgroundHighlights: e.target.value }))} placeholder="Academic achievements, relevant experience, skills..." rows={3} />
            </div>
            <div>
              <Label>Why This University?</Label>
              <Textarea value={form.whyThisUniversity} onChange={(e) => setForm(p => ({ ...p, whyThisUniversity: e.target.value }))} placeholder="What attracted you to this university specifically..." rows={2} />
            </div>
            <div>
              <Label>Key Achievements</Label>
              <Textarea value={form.achievements} onChange={(e) => setForm(p => ({ ...p, achievements: e.target.value }))} placeholder="Awards, projects, extracurricular activities..." rows={2} />
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="w-full text-white" style={{ backgroundColor: '#F37021' }}>
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate SOP</>}
            </Button>
          </CardContent>
        </Card>

        {/* Generated SOP */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: '#F37021' }} />
                <CardTitle style={{ color: '#1A2332' }}>Generated SOP</CardTitle>
              </div>
              {generatedSOP && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="w-3 h-3 mr-1" />{isEditing ? 'Preview' : 'Edit'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedSOP ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p>Your generated SOP will appear here</p>
                <p className="text-sm">Fill in the details and click Generate</p>
              </div>
            ) : isEditing ? (
              <Textarea
                value={generatedSOP}
                onChange={(e) => setGeneratedSOP(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            ) : (
              <div className="prose prose-sm max-w-none max-h-[500px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {generatedSOP.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-3 text-gray-700 text-sm leading-relaxed">{paragraph}</p>
                ))}
              </div>
            )}

            {generatedSOP && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FFF3E8' }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#F37021' }} />
                  <p className="text-xs text-gray-600">
                    <strong>Disclaimer:</strong> This AI-generated SOP should be reviewed and customized by you and your counselor before submission. 
                    Universities may detect AI-generated content, so please ensure it reflects your genuine voice and experiences.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveDraft} disabled={saving} variant="outline" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
