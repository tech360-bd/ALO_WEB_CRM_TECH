'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Star, Target, Users, Clock, TrendingUp, ChevronDown, ChevronUp,
  Award, BarChart3, CheckCircle2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface MonthlyScore {
  month: string
  score: number
}

interface Goal {
  id: string
  goal: string
  target: string
  currentProgress: number
  maxProgress: number
  status: 'on_track' | 'at_risk' | 'behind' | 'completed'
  deadline: string
}

interface Review {
  id: string
  period: string
  reviewer: string
  rating: number
  comments: string
  detailedFeedback: string
  date: string
}

interface SkillRating {
  skill: string
  rating: number
  maxRating: number
}

const mockMonthlyScores: MonthlyScore[] = [
  { month: 'Sep', score: 3.8 },
  { month: 'Oct', score: 4.0 },
  { month: 'Nov', score: 3.5 },
  { month: 'Dec', score: 4.2 },
  { month: 'Jan', score: 4.5 },
  { month: 'Feb', score: 4.3 },
]

const mockGoals: Goal[] = [
  { id: '1', goal: 'Student Enrollment Target', target: '30 new students', currentProgress: 22, maxProgress: 30, status: 'on_track', deadline: '2025-03-31' },
  { id: '2', goal: 'Application Processing Time', target: 'Under 48 hours', currentProgress: 75, maxProgress: 100, status: 'on_track', deadline: '2025-06-30' },
  { id: '3', goal: 'Client Satisfaction Score', target: '90% or above', currentProgress: 87, maxProgress: 100, status: 'at_risk', deadline: '2025-03-31' },
  { id: '4', goal: 'Training Completion', target: 'Complete 5 certifications', currentProgress: 2, maxProgress: 5, status: 'behind', deadline: '2025-12-31' },
  { id: '5', goal: 'Lead Conversion Rate', target: '25% conversion', currentProgress: 22, maxProgress: 25, status: 'on_track', deadline: '2025-06-30' },
]

const mockReviews: Review[] = [
  {
    id: 'r1',
    period: 'Q4 2024 (Oct-Dec)',
    reviewer: 'Sarah Johnson, Branch Manager',
    rating: 4.2,
    comments: 'Strong performance in student counseling and application processing. Needs improvement in timely documentation.',
    detailedFeedback: 'Excellent communication with students and families. Successfully processed 28 applications this quarter with a 95% success rate. Areas for improvement: document submission timelines and follow-up with pending leads. Recommended for advanced counseling certification.',
    date: '2025-01-15',
  },
  {
    id: 'r2',
    period: 'Q3 2024 (Jul-Sep)',
    reviewer: 'Sarah Johnson, Branch Manager',
    rating: 3.8,
    comments: 'Good overall performance. Demonstrated strong problem-solving skills during the peak enrollment season.',
    detailedFeedback: 'Handled peak season pressure well. Student satisfaction remained high at 88%. Conversion rate was slightly below target at 20%. Improved teamwork and collaboration with the visa team. Suggested focus on lead generation techniques for next quarter.',
    date: '2024-10-10',
  },
  {
    id: 'r3',
    period: 'Q2 2024 (Apr-Jun)',
    reviewer: 'Ahmed Khan, Country Manager',
    rating: 4.0,
    comments: 'Solid performance with notable achievements in university partnership development.',
    detailedFeedback: 'Established 3 new university contacts. Maintained high quality of student applications. Attendance was perfect. Time management during multi-task scenarios showed improvement. Continue developing leadership skills for potential senior counselor role.',
    date: '2024-07-12',
  },
]

const mockSkills: SkillRating[] = [
  { skill: 'Communication', rating: 4.5, maxRating: 5 },
  { skill: 'Technical Knowledge', rating: 4.0, maxRating: 5 },
  { skill: 'Leadership', rating: 3.5, maxRating: 5 },
  { skill: 'Time Management', rating: 3.8, maxRating: 5 },
  { skill: 'Problem Solving', rating: 4.2, maxRating: 5 },
  { skill: 'Teamwork', rating: 4.7, maxRating: 5 },
]

export default function EmployeePerformance() {
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  const overallRating = 4.2
  const tasksCompleted = 142
  const studentSatisfaction = 88
  const attendanceScore = 96

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />On Track</Badge>
      case 'at_risk':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertCircle className="h-3 w-3 mr-1" />At Risk</Badge>
      case 'behind':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" />Behind</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= Math.floor(rating) ? 'text-[#F37021] fill-[#F37021]' : star - 0.5 <= rating ? 'text-[#F37021] fill-[#F37021]/50' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-[#1A2332]">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getBarColor = (score: number) => {
    if (score >= 4.0) return 'bg-green-500'
    if (score >= 3.0) return 'bg-[#F37021]'
    if (score >= 2.0) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getSkillColor = (rating: number) => {
    const pct = (rating / 5) * 100
    if (pct >= 80) return '[&>div]:bg-green-500'
    if (pct >= 60) return '[&>div]:bg-[#F37021]'
    return '[&>div]:bg-amber-500'
  }

  const toggleReview = (id: string) => {
    setExpandedReview(prev => prev === id ? null : id)
  }

  const handleViewFullReview = (review: Review) => {
    toast.info(`Opening full review for ${review.period}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">My Performance</h1>
        <Badge className="bg-[#1A2332] text-white hover:bg-[#1A2332] w-fit">
          <Award className="h-3.5 w-3.5 mr-1" /> Performance Review Period: Q1 2025
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-[#F37021]" />
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />+0.3
              </Badge>
            </div>
            <p className="text-2xl font-bold text-[#1A2332]">{overallRating}/5</p>
            <p className="text-xs text-gray-500">Overall Rating</p>
            <div className="mt-2">{renderStars(overallRating, 'sm')}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">+12%</Badge>
            </div>
            <p className="text-2xl font-bold text-[#1A2332]">{tasksCompleted}</p>
            <p className="text-xs text-gray-500">Tasks Completed</p>
            <p className="text-xs text-gray-400 mt-2">This quarter</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[#0066CC]" />
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">+5%</Badge>
            </div>
            <p className="text-2xl font-bold text-[#1A2332]">{studentSatisfaction}%</p>
            <p className="text-xs text-gray-500">Student Satisfaction</p>
            <Progress value={studentSatisfaction} className="mt-2 h-1.5 [&>div]:bg-[#0066CC]" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">-2%</Badge>
            </div>
            <p className="text-2xl font-bold text-[#1A2332]">{attendanceScore}%</p>
            <p className="text-xs text-gray-500">Attendance Score</p>
            <Progress value={attendanceScore} className="mt-2 h-1.5 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#F37021]" /> Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 sm:gap-4 h-48 px-2">
            {mockMonthlyScores.map((item) => {
              const heightPct = (item.score / 5) * 100
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-[#1A2332]">{item.score}</span>
                  <div className="w-full relative" style={{ height: '140px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${getBarColor(item.score)}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-500" /> 4.0+
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#F37021]" /> 3.0-3.9
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-500" /> 2.0-2.9
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500" /> &lt;2.0
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals & Targets */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#F37021]" /> Goals & Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {mockGoals.map(goal => {
                const progressPct = Math.round((goal.currentProgress / goal.maxProgress) * 100)
                return (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-[#1A2332] text-sm">{goal.goal}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Target: {goal.target}</p>
                      </div>
                      {getGoalStatusBadge(goal.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPct} className="flex-1 h-2 [&>div]:bg-[#F37021]" />
                      <span className="text-xs font-medium text-[#1A2332] w-10 text-right">{progressPct}%</span>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>{goal.currentProgress} / {goal.maxProgress}</span>
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Skills Assessment */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#F37021]" /> Skills Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSkills.map(skill => {
                const pct = Math.round((skill.rating / skill.maxRating) * 100)
                return (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1A2332]">{skill.skill}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(skill.rating, 'sm')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className={`flex-1 h-2 ${getSkillColor(skill.rating)}`} />
                      <span className="text-xs font-medium text-[#1A2332] w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Separator className="my-4" />
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A2332]">Overall Skill Score</span>
                <span className="text-lg font-bold text-[#F37021]">
                  {(mockSkills.reduce((sum, s) => sum + s.rating, 0) / mockSkills.length).toFixed(1)}/5
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Based on latest performance review and manager assessment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Reviews */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <Star className="h-5 w-5 text-[#F37021]" /> Performance Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReviews.map(review => (
              <div key={review.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleReview(review.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold text-[#1A2332]">{review.period}</h3>
                      {renderStars(review.rating, 'sm')}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{review.reviewer}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{review.comments}</p>
                  </div>
                  <div className="shrink-0 ml-3">
                    {expandedReview === review.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                {expandedReview === review.id && (
                  <div className="px-4 pb-4 space-y-3">
                    <Separator />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Detailed Feedback</p>
                      <p className="text-sm text-gray-700">{review.detailedFeedback}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Reviewed on {new Date(review.date).toLocaleDateString()}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFullReview(review)}
                      >
                        View Full Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
