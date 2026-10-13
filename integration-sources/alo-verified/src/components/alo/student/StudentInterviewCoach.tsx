'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Mic, MessageSquare, Star, Loader2, ChevronRight, CheckCircle2,
  AlertCircle, ArrowRight, Trophy, Lightbulb
} from 'lucide-react'

interface Question {
  question: string
  category: string
}

interface AnswerFeedback {
  score: number
  feedback: string
  suggestions: string[]
}

export default function StudentInterviewCoach() {
  const { currentUser } = useAppStore()
  const [interviewType, setInterviewType] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [completed, setCompleted] = useState(false)

  async function startPractice() {
    if (!interviewType || !country) {
      toast.error('Please select interview type and country')
      return
    }
    try {
      setLoading(true)
      const prompt = `Generate 5 interview questions for a ${interviewType} interview for a student applying to study in ${country}. 

Return a JSON array of objects with "question" and "category" fields. Categories can be: academic, financial, career, personal, immigration. Only return the JSON array, no other text.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: prompt,
          agentType: 'ukvi_practice',
          inputText: prompt,
          userId: currentUser?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      
      let parsed: Question[] = []
      try {
        const output = data.output || '[]'
        const jsonMatch = output.match(/\[[\s\S]*\]/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch {}

      if (parsed.length === 0) {
        parsed = [
          { question: 'Why did you choose this university and course?', category: 'academic' },
          { question: 'How will you fund your studies and living expenses?', category: 'financial' },
          { question: 'What are your career plans after completing this course?', category: 'career' },
          { question: 'Why do you want to study in ' + country + '?', category: 'personal' },
          { question: 'Do you have any family or connections in the country?', category: 'immigration' },
        ]
      }

      setQuestions(parsed)
      setCurrentQ(0)
      setScores([])
      setFeedback(null)
      setAnswer('')
      setCompleted(false)
    } catch {
      toast.error('Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) { toast.error('Please type your answer'); return }
    try {
      setSubmitting(true)
      const prompt = `Evaluate this interview answer for a ${interviewType} interview for studying in ${country}.

Question: ${questions[currentQ].question}
Student's Answer: ${answer}

Provide feedback in JSON format: { "score": number (1-10), "feedback": string, "suggestions": string[] }
Be constructive but honest. Only return the JSON object.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: prompt,
          agentType: 'ukvi_practice',
          inputText: prompt,
          userId: currentUser?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      
      let parsed: AnswerFeedback = { score: 7, feedback: 'Good answer. Try to be more specific and confident.', suggestions: ['Add more details', 'Be more concise'] }
      try {
        const output = data.output || '{}'
        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch {}

      setFeedback(parsed)
      setScores(prev => [...prev, parsed.score])
    } catch {
      toast.error('Failed to get feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
      setAnswer('')
      setFeedback(null)
    } else {
      setCompleted(true)
    }
  }

  function resetPractice() {
    setQuestions([])
    setCurrentQ(0)
    setScores([])
    setFeedback(null)
    setAnswer('')
    setCompleted(false)
    setInterviewType('')
    setCountry('')
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>Interview Coach</h1>
        <p className="text-gray-500 text-sm">Practice interview questions with AI-powered feedback</p>
      </div>

      {questions.length === 0 && !completed ? (
        /* Setup */
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5" style={{ color: '#F37021' }} />
              <CardTitle style={{ color: '#1A2332' }}>Start Practice Session</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Interview Type</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger><SelectValue placeholder="Select interview type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UKVI">UKVI Visa Interview</SelectItem>
                  <SelectItem value="University">University Admission Interview</SelectItem>
                  <SelectItem value="Mock">General Mock Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Malaysia">Malaysia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startPractice} disabled={loading} className="w-full text-white" style={{ backgroundColor: '#F37021' }}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Questions...</> : <><Mic className="w-4 h-4 mr-2" />Start Practice</>}
            </Button>
          </CardContent>
        </Card>
      ) : completed ? (
        /* Results */
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: '#F37021' }} />
              <CardTitle style={{ color: '#1A2332' }}>Practice Complete!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" 
              style={{ backgroundColor: avgScore >= 70 ? '#22C55E20' : avgScore >= 50 ? '#F3702120' : '#EF444420' }}>
              <span className="text-3xl font-bold" style={{ color: avgScore >= 70 ? '#22C55E' : avgScore >= 50 ? '#F37021' : '#EF4444' }}>
                {avgScore}%
              </span>
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: '#1A2332' }}>Average Score</p>
            <p className="text-gray-500 text-sm mb-6">
              {avgScore >= 70 ? 'Great job! You\'re well prepared.' : avgScore >= 50 ? 'Good effort! Keep practicing to improve.' : 'Keep practicing! Review the suggestions and try again.'}
            </p>
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto mb-6">
              {scores.map((score, i) => (
                <div key={i} className="text-center p-2 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                  <p className="text-xs text-gray-500">Q{i + 1}</p>
                  <p className="font-bold" style={{ color: score >= 7 ? '#22C55E' : score >= 5 ? '#F37021' : '#EF4444' }}>{score}/10</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={resetPractice} variant="outline">Practice Again</Button>
              <Button className="text-white" style={{ backgroundColor: '#F37021' }} onClick={resetPractice}>
                Try Different Type
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Practice Mode */
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < currentQ ? 'bg-green-500' : i === currentQ ? '' : 'bg-gray-200'}`}
                style={i === currentQ ? { backgroundColor: '#F37021' } : {}} />
            ))}
            <span className="text-sm text-gray-500 ml-2">{currentQ + 1}/{questions.length}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" style={{ color: '#1A2332' }}>Question {currentQ + 1}</CardTitle>
                  <Badge style={{ backgroundColor: '#0066CC', color: 'white' }}>{questions[currentQ].category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F7F9FC' }}>
                  <p className="text-lg font-medium" style={{ color: '#1A2332' }}>{questions[currentQ].question}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#FFB347' }} />
                    <p className="text-xs text-gray-500">Take your time. Be specific, honest, and confident in your answer.</p>
                  </div>
                  <Label>Your Answer</Label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type your answer here..."
                    disabled={!!feedback}
                  />
                  {!feedback && (
                    <Button onClick={submitAnswer} disabled={submitting || !answer.trim()} className="w-full text-white" style={{ backgroundColor: '#0066CC' }}>
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Evaluating...</> : 'Submit Answer'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: '#F37021' }} />
                  <CardTitle className="text-base" style={{ color: '#1A2332' }}>Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!feedback ? (
                  <div className="text-center py-16 text-gray-400">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p>Submit your answer to receive AI feedback</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" 
                        style={{ backgroundColor: feedback.score >= 7 ? '#22C55E20' : feedback.score >= 5 ? '#F3702120' : '#EF444420' }}>
                        <span className="text-2xl font-bold" style={{ color: feedback.score >= 7 ? '#22C55E' : feedback.score >= 5 ? '#F37021' : '#EF4444' }}>
                          {feedback.score}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#1A2332' }}>Score: {feedback.score}/10</p>
                        <p className="text-sm text-gray-500">
                          {feedback.score >= 8 ? 'Excellent!' : feedback.score >= 6 ? 'Good answer' : feedback.score >= 4 ? 'Needs improvement' : 'Keep practicing'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                      <p className="text-sm text-gray-700">{feedback.feedback}</p>
                    </div>
                    {feedback.suggestions && feedback.suggestions.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2" style={{ color: '#1A2332' }}>Suggestions:</p>
                        <ul className="space-y-1">
                          {feedback.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#0066CC' }} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button onClick={nextQuestion} className="w-full text-white" style={{ backgroundColor: '#F37021' }}>
                      {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
