'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FileText, Search, Filter, Download, Eye, RefreshCw, Clock, Activity, Zap, CheckCircle, XCircle, AlertTriangle, BarChart3, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
}

interface LogEntry {
  id: string
  agentId?: string | null
  userId?: string | null
  command: string
  inputText?: string | null
  outputText?: string | null
  model?: string | null
  tokensUsed?: number | null
  status: string
  error?: string | null
  executionTime?: number | null
  createdAt: string
}

export default function AILogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAgent, setFilterAgent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [page, setPage] = useState(1)
  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [sortField, setSortField] = useState<'createdAt' | 'executionTime'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')

      const res = await fetch(`/api/ai?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setAgents(data.agents || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const stats = {
    totalCalls: logs.length,
    successRate: logs.length > 0 ? Math.round((logs.filter(l => l.status === 'completed').length / logs.length) * 100) : 0,
    avgTime: logs.length > 0 ? Math.round(logs.filter(l => l.executionTime).reduce((s, l) => s + (l.executionTime || 0), 0) / logs.filter(l => l.executionTime).length || 1) : 0,
    totalTokens: logs.reduce((s, l) => s + (l.tokensUsed || 0), 0),
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.inputText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.outputText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.command.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAgent = filterAgent === 'all' || log.agentId === filterAgent || log.command?.includes(filterAgent)
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus
    const matchesDate = !filterDate || new Date(log.createdAt).toISOString().startsWith(filterDate)
    return matchesSearch && matchesAgent && matchesStatus && matchesDate
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'createdAt') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return dir * ((a.executionTime || 0) - (b.executionTime || 0))
  })

  const toggleSort = (field: 'createdAt' | 'executionTime') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const exportLogs = () => {
    const csv = ['ID,Command,Agent,Status,Model,Execution Time,Tokens,Input,Output,Created At']
    filteredLogs.forEach(l => {
      csv.push(`"${l.id}","${l.command}","${l.agentId || ''}","${l.status}","${l.model || ''}",${l.executionTime || 0},${l.tokensUsed || 0},"${(l.inputText || '').replace(/"/g, '""')}","${(l.outputText || '').replace(/"/g, '""')}","${l.createdAt}"`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ai_logs_export.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exported')
  }

  const openDetail = (log: LogEntry) => {
    setSelectedLog(log)
    setDetailDialog(true)
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#F37021]" />
            AI Logs Viewer
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and analyze AI agent activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs} className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="outline" onClick={fetchLogs} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50"><Activity className="w-5 h-5 text-[#F37021]" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
                <p className="text-xs text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Clock className="w-5 h-5 text-[#0066CC]" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.avgTime}ms</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Zap className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tokens Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search in input/output..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            <SelectItem value="lead_qualifier">Lead Qualifier</SelectItem>
            <SelectItem value="course_recommender">Course Recommender</SelectItem>
            <SelectItem value="sop_assistant">SOP Assistant</SelectItem>
            <SelectItem value="email_writer">Email Writer</SelectItem>
            <SelectItem value="blog_writer">Blog Generator</SelectItem>
            <SelectItem value="visa_checker">Visa FAQ</SelectItem>
            <SelectItem value="boss_agent">Boss Agent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full sm:w-[160px]" />
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                    <div className="flex items-center gap-1">Time <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead>Command</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('executionTime')}>
                    <div className="flex items-center gap-1">Time <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(log)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs font-medium line-clamp-1">{log.command}</p>
                        {log.inputText && <p className="text-xs text-muted-foreground line-clamp-1">{log.inputText}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.agentId ? (agents.find(a => a.id === log.agentId)?.name || log.agentId?.substring(0, 8)) : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[log.status] || ''}`}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.model || '—'}</TableCell>
                      <TableCell className="text-xs">{log.executionTime ? `${log.executionTime}ms` : '—'}</TableCell>
                      <TableCell className="text-xs">{log.tokensUsed || '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); openDetail(log) }}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filteredLogs.length} of {logs.length} logs</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0066CC]" />
              Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_COLORS[selectedLog.status] || ''}>{selectedLog.status}</Badge>
                <Badge variant="outline">{selectedLog.model || 'unknown model'}</Badge>
                <Badge variant="outline">{new Date(selectedLog.createdAt).toLocaleString()}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Execution Time</p>
                  <p className="text-lg font-bold">{selectedLog.executionTime ? `${selectedLog.executionTime}ms` : 'N/A'}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Tokens Used</p>
                  <p className="text-lg font-bold">{selectedLog.tokensUsed || 'N/A'}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Agent</p>
                  <p className="text-lg font-bold text-sm">{selectedLog.agentId ? (agents.find(a => a.id === selectedLog.agentId)?.name || selectedLog.agentId?.substring(0, 8)) : 'N/A'}</p>
                </Card>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Command</p>
                <div className="bg-muted/50 p-3 rounded-lg text-sm font-mono">{selectedLog.command}</div>
              </div>

              {selectedLog.inputText && (
                <div>
                  <p className="text-sm font-medium mb-2">Input</p>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">{selectedLog.inputText}</div>
                </div>
              )}

              {selectedLog.outputText && (
                <div>
                  <p className="text-sm font-medium mb-2">Output</p>
                  <div className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{selectedLog.outputText}</div>
                </div>
              )}

              {selectedLog.error && (
                <div>
                  <p className="text-sm font-medium mb-2">Error</p>
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-700 whitespace-pre-wrap">{selectedLog.error}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
