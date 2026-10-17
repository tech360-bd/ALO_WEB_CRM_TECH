'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  GraduationCap, Plus, Save, Edit, Trash2, BookOpen, Award, X, CheckCircle2
} from 'lucide-react'

interface EducationEntry {
  id?: string
  level: string
  institution: string
  degree: string
  field: string
  gpa: string
  startYear: string
  endYear: string
  country: string
}

interface EnglishTestEntry {
  testType: string
  overallScore: string
  reading: string
  writing: string
  listening: string
  speaking: string
  testDate: string
}

const emptyEducation: EducationEntry = {
  level: '', institution: '', degree: '', field: '', gpa: '', startYear: '', endYear: '', country: ''
}

const emptyEnglishTest: EnglishTestEntry = {
  testType: '', overallScore: '', reading: '', writing: '', listening: '', speaking: '', testDate: ''
}

export default function StudentEducation() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState<string>('')
  const [educations, setEducations] = useState<EducationEntry[]>([])
  const [englishTests, setEnglishTests] = useState<EnglishTestEntry[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EducationEntry>(emptyEducation)
  const [showEnglishForm, setShowEnglishForm] = useState(false)
  const [englishForm, setEnglishForm] = useState<EnglishTestEntry>(emptyEnglishTest)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        if (!currentUser?.email) { setLoading(false); return }
        const res = await fetch(`/api/students?limit=1&search=${currentUser.email}`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        if (json.students?.length > 0) {
          const s = json.students[0]
          setStudentId(s.id)
          // Build education from student profile fields
          const entries: EducationEntry[] = []
          if (s.highestEducation) {
            entries.push({
              level: s.highestEducation,
              institution: '',
              degree: s.highestEducation,
              field: s.preferredCourse || '',
              gpa: s.gpa || '',
              startYear: '',
              endYear: '',
              country: s.country || 'Bangladesh',
            })
          }
          setEducations(entries)
          // Build English test from student profile
          if (s.englishTestType) {
            setEnglishTests([{
              testType: s.englishTestType,
              overallScore: s.englishTestScore || '',
              reading: '', writing: '', listening: '', speaking: '',
              testDate: s.englishTestDate ? new Date(s.englishTestDate).toISOString().split('T')[0] : '',
            }])
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser])

  function startAddEducation() {
    setEditForm(emptyEducation)
    setEditingIndex(-1)
  }

  function startEditEducation(index: number) {
    setEditForm({ ...educations[index] })
    setEditingIndex(index)
  }

  function saveEducationForm() {
    if (!editForm.level || !editForm.institution) {
      toast.error('Level and institution are required')
      return
    }
    if (editingIndex === -1) {
      setEducations(prev => [...prev, editForm])
    } else {
      setEducations(prev => prev.map((e, i) => i === editingIndex ? editForm : e))
    }
    setEditingIndex(null)
    setEditForm(emptyEducation)
  }

  function removeEducation(index: number) {
    setEducations(prev => prev.filter((_, i) => i !== index))
  }

  function saveEnglishTest() {
    if (!englishForm.testType || !englishForm.overallScore) {
      toast.error('Test type and overall score are required')
      return
    }
    if (showEnglishForm && englishTests.length > 0) {
      setEnglishTests([englishForm])
    } else {
      setEnglishTests(prev => [...prev, englishForm])
    }
    setShowEnglishForm(false)
    setEnglishForm(emptyEnglishTest)
  }

  async function handleSaveAll() {
    if (!studentId) { toast.error('Student record not found'); return }
    try {
      setSaving(true)
      // Save highest education info back to student record
      const latestEdu = educations[educations.length - 1]
      const latestTest = englishTests[englishTests.length - 1]
      const updateData: Record<string, unknown> = { id: studentId }
      if (latestEdu) {
        updateData.highestEducation = latestEdu.level
        updateData.gpa = latestEdu.gpa
        updateData.preferredCourse = latestEdu.field
      }
      if (latestTest) {
        updateData.englishTestType = latestTest.testType
        updateData.englishTestScore = latestTest.overallScore
        updateData.englishTestDate = latestTest.testDate
      }
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Education information saved successfully')
    } catch (err) {
      toast.error('Failed to save education information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Education History</h1>
          <p className="text-gray-500 text-sm">Manage your educational qualifications and test scores</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving} className="text-white" style={{ backgroundColor: '#F37021' }}>
          <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {/* Education History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: '#0066CC' }} />
              <CardTitle style={{ color: '#1A2332' }}>Education Entries</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={startAddEducation}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {educations.length === 0 && editingIndex === null ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No education entries yet. Click Add to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {educations.map((edu, i) => (
                <div key={i} className="p-4 rounded-lg border flex items-start justify-between gap-3" style={{ backgroundColor: '#F7F9FC' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge style={{ backgroundColor: '#0066CC', color: 'white' }}>{edu.level}</Badge>
                      {edu.gpa && <Badge variant="outline">GPA: {edu.gpa}</Badge>}
                    </div>
                    <p className="font-medium text-sm" style={{ color: '#1A2332' }}>{edu.institution}</p>
                    {edu.degree && <p className="text-gray-600 text-xs">{edu.degree} {edu.field && `- ${edu.field}`}</p>}
                    <p className="text-gray-500 text-xs">{[edu.startYear, edu.endYear].filter(Boolean).join(' - ')} {edu.country && `| ${edu.country}`}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEditEducation(i)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => removeEducation(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {editingIndex !== null && (
            <div className="mt-4 p-4 rounded-lg border-2" style={{ borderColor: '#F37021' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: '#1A2332' }}>
                  {editingIndex === -1 ? 'Add Education' : 'Edit Education'}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Level</Label>
                  <Select value={editForm.level} onValueChange={(v) => setEditForm(p => ({ ...p, level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSC">SSC / O-Level</SelectItem>
                      <SelectItem value="HSC">HSC / A-Level</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="Bachelor">Bachelor&apos;s</SelectItem>
                      <SelectItem value="Master">Master&apos;s</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Institution</Label><Input value={editForm.institution} onChange={(e) => setEditForm(p => ({ ...p, institution: e.target.value }))} placeholder="University/College name" /></div>
                <div><Label>Degree</Label><Input value={editForm.degree} onChange={(e) => setEditForm(p => ({ ...p, degree: e.target.value }))} placeholder="e.g. BSc, BA, MSc" /></div>
                <div><Label>Field of Study</Label><Input value={editForm.field} onChange={(e) => setEditForm(p => ({ ...p, field: e.target.value }))} placeholder="e.g. Computer Science" /></div>
                <div><Label>GPA / CGPA</Label><Input value={editForm.gpa} onChange={(e) => setEditForm(p => ({ ...p, gpa: e.target.value }))} placeholder="e.g. 3.50/4.00" /></div>
                <div><Label>Country</Label><Input value={editForm.country} onChange={(e) => setEditForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Bangladesh" /></div>
                <div><Label>Start Year</Label><Input value={editForm.startYear} onChange={(e) => setEditForm(p => ({ ...p, startYear: e.target.value }))} placeholder="2020" /></div>
                <div><Label>End Year</Label><Input value={editForm.endYear} onChange={(e) => setEditForm(p => ({ ...p, endYear: e.target.value }))} placeholder="2024" /></div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveEducationForm} className="text-white" style={{ backgroundColor: '#F37021' }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />{editingIndex === -1 ? 'Add Entry' : 'Update Entry'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* English Test Scores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: '#F37021' }} />
              <CardTitle style={{ color: '#1A2332' }}>English Test Scores</CardTitle>
            </div>
            {!showEnglishForm && (
              <Button size="sm" variant="outline" onClick={() => { setEnglishForm(englishTests[0] || emptyEnglishTest); setShowEnglishForm(true) }}>
                <Plus className="w-4 h-4 mr-1" /> {englishTests.length > 0 ? 'Edit' : 'Add'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {englishTests.length > 0 && !showEnglishForm ? (
            <div className="space-y-3">
              {englishTests.map((test, i) => (
                <div key={i} className="p-4 rounded-lg border" style={{ backgroundColor: '#F7F9FC' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge style={{ backgroundColor: '#F37021', color: 'white' }}>{test.testType}</Badge>
                    <Badge variant="outline">Overall: {test.overallScore}</Badge>
                    {test.testDate && <span className="text-xs text-gray-500">Taken: {test.testDate}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {['reading', 'writing', 'listening', 'speaking'].map(skill => (
                      <div key={skill} className="p-2 rounded" style={{ backgroundColor: 'white' }}>
                        <p className="text-xs text-gray-500 capitalize">{skill}</p>
                        <p className="font-bold text-sm" style={{ color: '#1A2332' }}>{(test as Record<string, string>)[skill] || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !showEnglishForm ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No English test scores added yet.</p>
            </div>
          ) : null}

          {showEnglishForm && (
            <div className="mt-2 p-4 rounded-lg border-2" style={{ borderColor: '#F37021' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: '#1A2332' }}>English Test Details</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowEnglishForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Test Type</Label>
                  <Select value={englishForm.testType} onValueChange={(v) => setEnglishForm(p => ({ ...p, testType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="PTE">PTE Academic</SelectItem>
                      <SelectItem value="TOEFL">TOEFL iBT</SelectItem>
                      <SelectItem value="Duolingo">Duolingo English Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Overall Score</Label><Input value={englishForm.overallScore} onChange={(e) => setEnglishForm(p => ({ ...p, overallScore: e.target.value }))} placeholder="e.g. 7.0" /></div>
                <div><Label>Reading</Label><Input value={englishForm.reading} onChange={(e) => setEnglishForm(p => ({ ...p, reading: e.target.value }))} placeholder="Band score" /></div>
                <div><Label>Writing</Label><Input value={englishForm.writing} onChange={(e) => setEnglishForm(p => ({ ...p, writing: e.target.value }))} placeholder="Band score" /></div>
                <div><Label>Listening</Label><Input value={englishForm.listening} onChange={(e) => setEnglishForm(p => ({ ...p, listening: e.target.value }))} placeholder="Band score" /></div>
                <div><Label>Speaking</Label><Input value={englishForm.speaking} onChange={(e) => setEnglishForm(p => ({ ...p, speaking: e.target.value }))} placeholder="Band score" /></div>
                <div className="sm:col-span-2"><Label>Test Date</Label><Input type="date" value={englishForm.testDate} onChange={(e) => setEnglishForm(p => ({ ...p, testDate: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveEnglishTest} className="text-white" style={{ backgroundColor: '#F37021' }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />Save Test Score
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
