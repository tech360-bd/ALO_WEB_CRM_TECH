'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Search, Eye, Filter
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  createdAt: string
  assignedBy: string
}

export default function EmployeeTasks() {
  const { currentUser } = useAppStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [currentUser])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const userId = currentUser?.referenceId || currentUser?.id
      if (!userId) return
      const res = await fetch(`/api/applications?counselorId=${userId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        // Map applications as tasks for the employee
        const taskData = (json.applications || []).map((app: any, idx: number) => ({
          id: app.id,
          title: `Follow up: ${app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Student'} - ${app.university?.name || 'University'}`,
          description: app.course ? `Application for ${app.course.name} at ${app.university?.name || 'University'}` : 'Application follow-up task',
          status: app.status === 'enrolled' ? 'completed' : app.status === 'under_review' || app.status === 'conditional_offer' || app.status === 'unconditional_offer' ? 'in_progress' : 'pending',
          priority: idx < 2 ? 'high' : idx < 5 ? 'medium' : 'low',
          dueDate: app.updatedAt || app.createdAt || new Date().toISOString(),
          createdAt: app.createdAt || new Date().toISOString(),
          assignedBy: 'System',
        }))
        setTasks(taskData)
      }
    } catch (err) {
      console.error(err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A2332]">My Tasks</h1>

      {/* Task Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{taskCounts.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{taskCounts.in_progress}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{taskCounts.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#F37021]" /> Task List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <p className="font-medium text-[#1A2332] max-w-xs truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 max-w-xs truncate">{task.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{task.assignedBy}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedTask(task); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#1A2332] text-lg">{selectedTask.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority} priority</Badge>
                  <Badge className={getStatusColor(selectedTask.status)}>{selectedTask.status?.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{selectedTask.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assigned By</p>
                  <p className="font-medium">{selectedTask.assignedBy}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
