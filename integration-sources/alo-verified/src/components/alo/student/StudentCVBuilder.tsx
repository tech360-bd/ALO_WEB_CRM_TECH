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
  FileUser, Sparkles, Save, Download, Loader2, Plus, X, Edit
} from 'lucide-react'

interface ExperienceEntry {
  title: string
  company: string
  duration: string
  description: string
}

interface ProjectEntry {
  name: string
  description: string
  technologies: string
}

export default function StudentCVBuilder() {
  const { currentUser } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [personalInfo, setPersonalInfo] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    objective: '',
  })
  const [education, setEducation] = useState({
    degree: '',
    institution: '',
    gpa: '',
    year: '',
  })
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [newExp, setNewExp] = useState<ExperienceEntry>({ title: '', company: '', duration: '', description: '' })
  const [skills, setSkills] = useState('')
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [newProject, setNewProject] = useState<ProjectEntry>({ name: '', description: '', technologies: '' })
  const [generatedCV, setGeneratedCV] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  function addExperience() {
    if (!newExp.title || !newExp.company) return
    setExperiences(prev => [...prev, newExp])
    setNewExp({ title: '', company: '', duration: '', description: '' })
  }

  function removeExperience(index: number) {
    setExperiences(prev => prev.filter((_, i) => i !== index))
  }

  function addProject() {
    if (!newProject.name) return
    setProjects(prev => [...prev, newProject])
    setNewProject({ name: '', description: '', technologies: '' })
  }

  function removeProject(index: number) {
    setProjects(prev => prev.filter((_, i) => i !== index))
  }

  async function handleGenerate() {
    if (!personalInfo.fullName || !education.degree) {
      toast.error('Please fill in your name and education details')
      return
    }
    try {
      setGenerating(true)
      const prompt = `Generate a professional CV/Resume for a student. Format it as clean text with clear sections.

Personal Information:
- Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone}
- Address: ${personalInfo.address}
- Objective: ${personalInfo.objective}

Education:
- Degree: ${education.degree}
- Institution: ${education.institution}
- GPA: ${education.gpa}
- Year: ${education.year}

Work Experience:
${experiences.map(e => `- ${e.title} at ${e.company} (${e.duration}): ${e.description}`).join('\n') || '- No experience listed'}

Skills: ${skills || 'Not specified'}

Projects:
${projects.map(p => `- ${p.name} (${p.technologies}): ${p.description}`).join('\n') || '- No projects listed'}

Generate a well-formatted CV with sections for Personal Info, Objective, Education, Experience, Skills, and Projects. Make it professional and concise.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: prompt,
          agentType: 'cv_builder',
          inputText: prompt,
          userId: currentUser?.id,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setGeneratedCV(data.output || 'Failed to generate CV. Please try again.')
      setIsEditing(false)
      toast.success('CV generated successfully!')
    } catch (err) {
      toast.error('Failed to generate CV. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([generatedCV], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CV_${personalInfo.fullName.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CV downloaded')
  }

  async function handleSave() {
    if (!generatedCV) { toast.error('No CV to save'); return }
    try {
      setSaving(true)
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser?.referenceId,
          documentType: 'cv_draft',
          documentName: `CV - ${personalInfo.fullName}`,
          content: generatedCV,
        }),
      })
      toast.success('CV saved successfully')
    } catch {
      toast.error('Failed to save CV')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>AI CV Builder</h1>
        <p className="text-gray-500 text-sm">Create a professional CV with AI assistance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileUser className="w-5 h-5" style={{ color: '#0066CC' }} />
                <CardTitle className="text-base" style={{ color: '#1A2332' }}>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input value={personalInfo.fullName} onChange={(e) => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={personalInfo.email} onChange={(e) => setPersonalInfo(p => ({ ...p, email: e.target.value }))} type="email" /></div>
                <div><Label>Phone</Label><Input value={personalInfo.phone} onChange={(e) => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Address</Label><Input value={personalInfo.address} onChange={(e) => setPersonalInfo(p => ({ ...p, address: e.target.value }))} /></div>
              </div>
              <div><Label>Career Objective</Label><Textarea value={personalInfo.objective} onChange={(e) => setPersonalInfo(p => ({ ...p, objective: e.target.value }))} rows={2} placeholder="Brief career objective..." /></div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ color: '#1A2332' }}>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Degree</Label><Input value={education.degree} onChange={(e) => setEducation(p => ({ ...p, degree: e.target.value }))} placeholder="e.g. BSc Computer Science" /></div>
                <div><Label>Institution</Label><Input value={education.institution} onChange={(e) => setEducation(p => ({ ...p, institution: e.target.value }))} /></div>
                <div><Label>GPA</Label><Input value={education.gpa} onChange={(e) => setEducation(p => ({ ...p, gpa: e.target.value }))} placeholder="3.50/4.00" /></div>
                <div><Label>Year</Label><Input value={education.year} onChange={(e) => setEducation(p => ({ ...p, year: e.target.value }))} placeholder="2020-2024" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base" style={{ color: '#1A2332' }}>Experience</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{exp.title} at {exp.company}</p>
                    <p className="text-xs text-gray-500">{exp.duration} | {exp.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeExperience(i)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={newExp.title} onChange={(e) => setNewExp(p => ({ ...p, title: e.target.value }))} placeholder="Job title" />
                <Input value={newExp.company} onChange={(e) => setNewExp(p => ({ ...p, company: e.target.value }))} placeholder="Company" />
                <Input value={newExp.duration} onChange={(e) => setNewExp(p => ({ ...p, duration: e.target.value }))} placeholder="Duration" />
                <Input value={newExp.description} onChange={(e) => setNewExp(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
              </div>
              <Button size="sm" variant="outline" onClick={addExperience}><Plus className="w-3 h-3 mr-1" />Add Experience</Button>
            </CardContent>
          </Card>

          {/* Skills & Projects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ color: '#1A2332' }}>Skills & Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Skills (comma separated)</Label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, JavaScript, Data Analysis" /></div>
              {projects.map((proj, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{proj.name}</p>
                    <p className="text-xs text-gray-500">{proj.technologies} | {proj.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeProject(i)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="grid sm:grid-cols-3 gap-3">
                <Input value={newProject.name} onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
                <Input value={newProject.technologies} onChange={(e) => setNewProject(p => ({ ...p, technologies: e.target.value }))} placeholder="Technologies" />
                <Input value={newProject.description} onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
              </div>
              <Button size="sm" variant="outline" onClick={addProject}><Plus className="w-3 h-3 mr-1" />Add Project</Button>
            </CardContent>
          </Card>

          <Button onClick={handleGenerate} disabled={generating} className="w-full text-white" style={{ backgroundColor: '#F37021' }}>
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate CV</>}
          </Button>
        </div>

        {/* Generated CV */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: '#F37021' }} />
                <CardTitle style={{ color: '#1A2332' }}>CV Preview</CardTitle>
              </div>
              {generatedCV && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="w-3 h-3 mr-1" />{isEditing ? 'Preview' : 'Edit'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedCV ? (
              <div className="text-center py-16 text-gray-400">
                <FileUser className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p>Your generated CV will appear here</p>
              </div>
            ) : isEditing ? (
              <Textarea value={generatedCV} onChange={(e) => setGeneratedCV(e.target.value)} rows={24} className="font-mono text-sm" />
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                {generatedCV.split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{line}</p>
                ))}
              </div>
            )}

            {generatedCV && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSave} disabled={saving} variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
