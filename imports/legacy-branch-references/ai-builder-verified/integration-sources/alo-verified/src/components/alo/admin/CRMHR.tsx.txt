'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Users, Clock, CalendarDays, DollarSign, Briefcase, CheckCircle2,
  XCircle, AlertTriangle, LogIn, LogOut, Coffee, Home, Download,
  FileText, Lock, Mail, Printer, Plus, Send, TrendingUp, UserCheck,
  UserX, Timer, MapPin, ChevronRight, Edit3
} from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---
type AttStatus = 'present'|'absent'|'late'|'half_day'|'leave'|'holiday'|'remote'
const statusColors: Record<AttStatus,string> = { present:'bg-green-100 text-green-700', absent:'bg-red-100 text-red-700', late:'bg-amber-100 text-amber-700', half_day:'bg-orange-100 text-orange-700', leave:'bg-blue-100 text-blue-700', holiday:'bg-purple-100 text-purple-700', remote:'bg-cyan-100 text-cyan-700' }

// --- Mock Data ---
const employees = [
  { id:'E001', name:'Ahmed Rahman', dept:'Counseling', designation:'Senior Counselor', basic:45000 },
  { id:'E002', name:'Sarah Khan', dept:'Marketing', designation:'Marketing Lead', basic:42000 },
  { id:'E003', name:'Fatima Begum', dept:'Visa', designation:'Visa Officer', basic:35000 },
  { id:'E004', name:'Rafiq Islam', dept:'Finance', designation:'Accountant', basic:38000 },
  { id:'E005', name:'Nusrat Jahan', dept:'Operations', designation:'Ops Manager', basic:50000 },
  { id:'E006', name:'Karim Hossain', dept:'IT', designation:'Developer', basic:55000 },
  { id:'E007', name:'Taslima Akter', dept:'Counseling', designation:'Counselor', basic:32000 },
  { id:'E008', name:'Imran Mahmud', dept:'Sales', designation:'Sales Executive', basic:30000 },
  { id:'E009', name:'Rashida Khatun', dept:'HR', designation:'HR Executive', basic:36000 },
  { id:'E010', name:'Shafiqul Islam', dept:'Marketing', designation:'Content Writer', basic:28000 },
  { id:'E011', name:'Nadia Sharmin', dept:'Counseling', designation:'Junior Counselor', basic:25000 },
  { id:'E012', name:'Tamim Iqbal', dept:'IT', designation:'UI Designer', basic:40000 },
  { id:'E013', name:'Laila Ferdous', dept:'Finance', designation:'Finance Manager', basic:52000 },
  { id:'E014', name:'Jahid Hasan', dept:'Visa', designation:'Visa Assistant', basic:26000 },
  { id:'E015', name:'Mithila Das', dept:'Operations', designation:'Admin Executive', basic:30000 },
]

const attendanceRecords: { empId:string; date:string; inTime:string; outTime:string; breakMin:number; status:AttStatus; otHrs:number }[] = [
  { empId:'E001', date:'2025-03-03', inTime:'09:05', outTime:'18:15', breakMin:60, status:'present', otHrs:0.17 },
  { empId:'E002', date:'2025-03-03', inTime:'09:45', outTime:'18:00', breakMin:60, status:'late', otHrs:0 },
  { empId:'E003', date:'2025-03-03', inTime:'09:00', outTime:'17:30', breakMin:60, status:'half_day', otHrs:0 },
  { empId:'E004', date:'2025-03-03', inTime:'09:10', outTime:'18:30', breakMin:60, status:'present', otHrs:0.5 },
  { empId:'E005', date:'2025-03-03', inTime:'09:00', outTime:'18:00', breakMin:60, status:'present', otHrs:0 },
  { empId:'E006', date:'2025-03-03', inTime:'10:30', outTime:'19:00', breakMin:60, status:'remote', otHrs:0.5 },
  { empId:'E007', date:'2025-03-03', inTime:'09:00', outTime:'18:10', breakMin:60, status:'present', otHrs:0.17 },
  { empId:'E008', date:'2025-03-03', inTime:'-', outTime:'-', breakMin:0, status:'absent', otHrs:0 },
  { empId:'E009', date:'2025-03-03', inTime:'09:20', outTime:'18:00', breakMin:60, status:'late', otHrs:0 },
  { empId:'E010', date:'2025-03-03', inTime:'09:00', outTime:'18:00', breakMin:60, status:'present', otHrs:0 },
  { empId:'E011', date:'2025-03-03', inTime:'-', outTime:'-', breakMin:0, status:'leave', otHrs:0 },
  { empId:'E012', date:'2025-03-03', inTime:'09:05', outTime:'18:20', breakMin:60, status:'present', otHrs:0.25 },
  { empId:'E013', date:'2025-03-03', inTime:'09:00', outTime:'18:00', breakMin:60, status:'present', otHrs:0 },
  { empId:'E014', date:'2025-03-03', inTime:'11:30', outTime:'18:00', breakMin:60, status:'half_day', otHrs:0 },
  { empId:'E015', date:'2025-03-03', inTime:'09:00', outTime:'17:45', breakMin:60, status:'present', otHrs:0 },
]

const leaveRequests = [
  { id:'L1', empId:'E001', name:'Ahmed Rahman', type:'Casual', from:'2025-03-10', to:'2025-03-12', days:3, status:'pending' as const, reason:'Family event' },
  { id:'L2', empId:'E003', name:'Fatima Begum', type:'Sick', from:'2025-03-05', to:'2025-03-06', days:2, status:'pending' as const, reason:'Fever' },
  { id:'L3', empId:'E011', name:'Nadia Sharmin', type:'Annual', from:'2025-03-15', to:'2025-03-21', days:7, status:'pending' as const, reason:'Vacation' },
  { id:'L4', empId:'E002', name:'Sarah Khan', type:'Casual', from:'2025-03-08', to:'2025-03-08', days:1, status:'approved' as const, reason:'Personal work' },
  { id:'L5', empId:'E008', name:'Imran Mahmud', type:'Sick', from:'2025-03-01', to:'2025-03-02', days:2, status:'approved' as const, reason:'Migraine' },
  { id:'L6', empId:'E014', name:'Jahid Hasan', type:'Casual', from:'2025-03-20', to:'2025-03-21', days:2, status:'rejected' as const, reason:'Travel' },
]

const leaveTypes = [
  { name:'Casual Leave', total:12, used:3, color:'#F37021' },
  { name:'Sick Leave', total:10, used:2, color:'#ef4444' },
  { name:'Annual Leave', total:15, used:0, color:'#0066CC' },
  { name:'Maternity Leave', total:90, used:0, color:'#8b5cf6' },
  { name:'Paternity Leave', total:15, used:0, color:'#06b6d4' },
]

const salaryStructures = employees.map(e => ({
  empId: e.id, basic: e.basic, hra: Math.round(e.basic*0.4), medical: 2500,
  transport: 3000, special: Math.round(e.basic*0.1), pfRate: 12, taxRate: 10
}))

const chartData = [
  { day:'Mon', present:42, late:3, absent:0 },
  { day:'Tue', present:40, late:4, absent:1 },
  { day:'Wed', present:43, late:2, absent:0 },
  { day:'Thu', present:38, late:5, absent:2 },
  { day:'Fri', present:41, late:3, absent:1 },
  { day:'Sat', present:30, late:1, absent:0 },
  { day:'Sun', present:0, late:0, absent:0 },
]

// --- Helpers ---
const getEmp = (id:string) => employees.find(e=>e.id===id)
const fmt = (n:number) => n.toLocaleString('en-IN')
const calcHours = (inT:string, outT:string, brk:number) => {
  if(inT==='-') return 0
  const [ih,im]=inT.split(':').map(Number), [oh,om]=outT.split(':').map(Number)
  return Math.max(0,((oh*60+om)-(ih*60+im)-brk)/60)
}

export default function CRMHR() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clockIn, setClockIn] = useState(false)
  const [onBreak, setOnBreak] = useState(false)
  const [remote, setRemote] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pMonth, setPMonth] = useState('3')
  const [pYear, setPYear] = useState('2025')
  const [payrollLocked, setPayrollLocked] = useState(false)
  const [payrollProcessed, setPayrollProcessed] = useState(false)
  const [leaves, setLeaves] = useState(leaveRequests)
  const [selectedPayslip, setSelectedPayslip] = useState<string|null>(null)
  const [correctionDialog, setCorrectionDialog] = useState(false)
  const [salaryDialogEmp, setSalaryDialogEmp] = useState<string|null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [attCorrections, setAttCorrections] = useState<{empId:string;date:string;reason:string;status:string}[]>([])

  // API-driven data
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [payslipData, setPayslipData] = useState<any[]>([])
  const [attSummary, setAttSummary] = useState({ todayPresent: 0, todayLate: 0, todayAbsent: 0 })
  const [payrollSummary, setPayrollSummary] = useState({ totalNetSalary: 0, totalBasicSalary: 0, totalAllowance: 0, totalDeduction: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setLoading(true)
        const [attRes, payRes] = await Promise.all([
          fetch('/api/attendance'),
          fetch(`/api/payroll?month=${pMonth}&year=${pYear}`)
        ])
        if (attRes.ok) {
          const attData = await attRes.json()
          setAttendanceData(attData.attendance || [])
          setAttSummary(attData.summary || { todayPresent: 0, todayLate: 0, todayAbsent: 0 })
        }
        if (payRes.ok) {
          const payData = await payRes.json()
          setPayslipData(payData.payslips || [])
          setPayrollSummary(payData.summary || { totalNetSalary: 0, totalBasicSalary: 0, totalAllowance: 0, totalDeduction: 0 })
        }
      } catch (err) {
        console.error('Failed to fetch HR data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHRData()
  }, [pMonth, pYear])

  const presentToday = attSummary.todayPresent || attendanceRecords.filter(a=>a.status==='present'||a.status==='remote').length
  const lateToday = attSummary.todayLate || attendanceRecords.filter(a=>a.status==='late').length
  const onLeave = attendanceRecords.filter(a=>a.status==='leave').length
  const remoteToday = attendanceRecords.filter(a=>a.status==='remote').length

  const handleClockIn = () => {
    const h=currentTime.getHours(), m=currentTime.getMinutes()
    const late = h>9||(h===9&&m>30)
    setClockIn(true)
    toast.success(late ? 'Clocked in (Late - after 9:30 AM)' : 'Clocked in successfully')
  }
  const handleClockOut = () => { setClockIn(false); setOnBreak(false); toast.success('Clocked out successfully') }
  const handleBreak = () => { setOnBreak(true); toast.info('Break started') }
  const handleBreakEnd = () => { setOnBreak(false); toast.info('Break ended') }

  const handleLeaveAction = (id:string, action:'approved'|'rejected') => {
    setLeaves(prev=>prev.map(l=>l.id===id?{...l,status:action}:l))
    toast.success(`Leave request ${action}`)
  }

  const handleProcessPayroll = () => { setPayrollProcessed(true); toast.success('Payroll processed for all employees') }
  const handleLockPayroll = () => { setPayrollLocked(true); toast.success('Payroll locked') }

  const handleCorrection = (empId:string) => {
    setAttCorrections(prev=>[...prev,{empId,date:new Date().toISOString().slice(0,10),reason:'Pending review',status:'pending'}])
    setCorrectionDialog(false)
    toast.success('Correction request submitted')
  }

  const maxChart = Math.max(...chartData.map(d=>d.present+d.late),1)
  const depts = [...new Set(employees.map(e=>e.dept))]

  const filteredAtt = attendanceRecords.filter(a=>{
    if(filterStatus!=='all'&&a.status!==filterStatus) return false
    if(filterDept!=='all'){ const e=getEmp(a.empId); if(e?.dept!==filterDept) return false }
    return true
  })

  // --- Payroll calc ---
  const calcPayroll = (empId:string) => {
    const s = salaryStructures.find(x=>x.empId===empId)!
    const gross = s.basic+s.hra+s.medical+s.transport+s.special
    const pf = Math.round(s.basic*s.pfRate/100)
    const tax = Math.round(gross*s.taxRate/100)
    const profTax = 200
    const esi = Math.round(gross*0.0075)
    const deductions = pf+tax+profTax+esi
    const net = gross-deductions
    const att = attendanceRecords.find(a=>a.empId===empId)
    const daysWorked = att?.status==='absent'?22:att?.status==='half_day'?21:22
    return { ...s, gross, pf, tax, profTax, esi, deductions, net, daysWorked }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-[#F37021]" /> HR & Payroll Management
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="salary">Salary Structures</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: DASHBOARD ===== */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'Total Employees', val:employees.length, icon:Users, color:'#1A2332' },
              { label:'Present Today', val:presentToday, icon:UserCheck, color:'#22c55e' },
              { label:'On Leave', val:onLeave, icon:CalendarDays, color:'#0066CC' },
              { label:'Late Today', val:lateToday, icon:Timer, color:'#F37021' },
              { label:'Remote Today', val:remoteToday, icon:Home, color:'#06b6d4' },
            ].map(s=>(
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor:s.color+'15'}}>
                    <s.icon className="h-5 w-5" style={{color:s.color}} />
                  </div>
                  <div><p className="text-xl font-bold">{s.val}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Attendance Chart */}
            <Card className="border-0 shadow-sm md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Attendance (Last 7 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-40">
                  {chartData.map(d=>(
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-stretch" style={{height:120}}>
                        <div className="w-full bg-green-400 rounded-t" style={{height:Math.max(d.present/maxChart*100,1)+'%'}} />
                        <div className="w-full bg-amber-400 rounded-b" style={{height:Math.max(d.late/maxChart*100,1)+'%',marginTop:1}} />
                      </div>
                      <span className="text-xs text-gray-500">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded" /> Late</span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Leaves + Quick Actions */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Pending Leave Requests</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-32 overflow-y-auto">
                  {leaves.filter(l=>l.status==='pending').map(l=>(
                    <div key={l.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-xs text-gray-500">{l.days}d {l.type}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-[#F37021] hover:bg-[#e06010] text-white" size="sm" onClick={()=>setActiveTab('payroll')}><DollarSign className="h-4 w-4 mr-2" />Process Payroll</Button>
                  <Button variant="outline" className="w-full" size="sm" onClick={()=>toast.success('Attendance exported')}><Download className="h-4 w-4 mr-2" />Export Attendance</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 2: ATTENDANCE ===== */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Clock In/Out Panel */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1A2332] to-[#2d3b4f] text-white">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-mono font-bold">{currentTime.toLocaleTimeString()}</p>
                  <p className="text-sm opacity-80">{currentTime.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={remote?'default':'outline'} className={remote?'bg-cyan-500 text-white':'border-white/30 text-white hover:bg-white/10'} onClick={()=>{setRemote(!remote);toast.info(remote?'Office mode':'Remote mode')}}>
                    <MapPin className="h-4 w-4 mr-1" />{remote?'Remote':'Office'}
                  </Button>
                  {!clockIn ? (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={handleClockIn}><LogIn className="h-4 w-4 mr-1" />Clock In</Button>
                  ) : (
                    <>
                      {!onBreak ? (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleBreak}><Coffee className="h-4 w-4 mr-1" />Break</Button>
                      ) : (
                        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleBreakEnd}><Coffee className="h-4 w-4 mr-1" />Break End</Button>
                      )}
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleClockOut}><LogOut className="h-4 w-4 mr-1" />Clock Out</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today Summary */}
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {(['present','absent','late','half_day','leave','holiday','remote'] as AttStatus[]).map(s=>{
              const count = attendanceRecords.filter(a=>a.status===s).length
              return (
                <Card key={s} className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <Badge className={`text-xs ${statusColors[s]}`}>{s.replace('_',' ')}</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {depts.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(['present','absent','late','half_day','leave','remote'] as AttStatus[]).map(s=><SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={()=>toast.success('CSV exported')}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
            <Dialog open={correctionDialog} onOpenChange={setCorrectionDialog}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Edit3 className="h-4 w-4 mr-1" />Request Correction</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Attendance Correction Request</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select><SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent>{employees.map(e=><SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="date" />
                  <Textarea placeholder="Reason for correction" />
                  <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={()=>handleCorrection('E001')}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="ml-auto" onClick={()=>toast.success('Attendance marked')}><Plus className="h-4 w-4 mr-1" />Mark Attendance</Button>
          </div>

          {/* Attendance Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>In Time</TableHead><TableHead>Out Time</TableHead>
                    <TableHead>Break</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead><TableHead>OT</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredAtt.map((a,i)=>{ const emp=getEmp(a.empId); const hrs=calcHours(a.inTime,a.outTime,a.breakMin); return(
                      <TableRow key={i}>
                        <TableCell className="font-medium">{emp?.name||a.empId}</TableCell>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.inTime}</TableCell><TableCell>{a.outTime}</TableCell>
                        <TableCell>{a.breakMin}m</TableCell><TableCell>{hrs.toFixed(1)}h</TableCell>
                        <TableCell><Badge className={`text-xs ${statusColors[a.status]}`}>{a.status.replace('_',' ')}</Badge></TableCell>
                        <TableCell>{a.otHrs>0?a.otHrs.toFixed(2)+'h':'-'}</TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 3: LEAVE MANAGEMENT ===== */}
        <TabsContent value="leave" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {leaveTypes.map(lt=>(
              <Card key={lt.name} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor:lt.color}} />
                    <span className="text-sm font-medium">{lt.name}</span>
                  </div>
                  <Progress value={(lt.used/lt.total)*100} className="h-2 mb-1" />
                  <p className="text-xs text-gray-500">{lt.used}/{lt.total} used</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Leave Requests</CardTitle>
              <Button size="sm" className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={()=>toast.info('Add leave type dialog')}><Plus className="h-4 w-4 mr-1" />Add Leave Type</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead>
                    <TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {leaves.map(l=>(
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell>{l.type}</TableCell>
                        <TableCell>{l.from}</TableCell><TableCell>{l.to}</TableCell>
                        <TableCell>{l.days}</TableCell><TableCell className="text-sm text-gray-600">{l.reason}</TableCell>
                        <TableCell><Badge className={l.status==='approved'?'bg-green-100 text-green-700':l.status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}>{l.status}</Badge></TableCell>
                        <TableCell>
                          {l.status==='pending'&&(
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={()=>handleLeaveAction(l.id,'approved')}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={()=>handleLeaveAction(l.id,'rejected')}><XCircle className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Leave Calendar */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Leave Calendar - March 2025</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="font-medium text-gray-500 py-1">{d}</div>)}
                {Array.from({length:31},(_,i)=>{ const day=i+1; const isLeave=leaves.some(l=>{ const f=new Date(l.from).getDate(),t=new Date(l.to).getDate(); return day>=f&&day<=t&&l.status==='approved' }); return(
                  <div key={day} className={`p-1.5 rounded ${isLeave?'bg-blue-100 text-blue-700 font-medium':'hover:bg-gray-50'}`}>{day}</div>
                )})}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 4: PAYROLL ===== */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={pMonth} onValueChange={setPMonth}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=><SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={pYear} onValueChange={setPYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024,2025,2026].map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" size="sm" onClick={handleProcessPayroll} disabled={payrollProcessed}><DollarSign className="h-4 w-4 mr-1" />{payrollProcessed?'Processed':'Process Payroll'}</Button>
            <Button variant="outline" size="sm" onClick={handleLockPayroll} disabled={payrollLocked||!payrollProcessed}><Lock className="h-4 w-4 mr-1" />{payrollLocked?'Locked':'Lock Payroll'}</Button>
            {payrollLocked&&<Badge className="bg-red-100 text-red-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
          </div>

          {/* Payroll Summary */}
          {(()=>{
            const allPay = employees.map(e=>calcPayroll(e.id))
            const totGross=allPay.reduce((s,p)=>s+p.gross,0)
            const totDed=allPay.reduce((s,p)=>s+p.deductions,0)
            const totNet=allPay.reduce((s,p)=>s+p.net,0)
            return(
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-green-600">₹{fmt(totGross)}</p><p className="text-xs text-gray-500">Total Gross</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-red-600">₹{fmt(totDed)}</p><p className="text-xs text-gray-500">Total Deductions</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-[#1A2332]">₹{fmt(totNet)}</p><p className="text-xs text-gray-500">Total Net Pay</p></CardContent></Card>
              </div>
            )
          })()}

          {/* Payroll Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Days</TableHead>
                    <TableHead>Basic</TableHead><TableHead>HRA</TableHead><TableHead>Allow.</TableHead>
                    <TableHead>Gross</TableHead><TableHead>Ded.</TableHead><TableHead>Net</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {employees.map(e=>{ const p=calcPayroll(e.id); return(
                      <TableRow key={e.id} className="cursor-pointer hover:bg-gray-50" onClick={()=>setSelectedPayslip(e.id)}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-sm">{e.designation}</TableCell>
                        <TableCell>{p.daysWorked}</TableCell>
                        <TableCell>₹{fmt(p.basic)}</TableCell><TableCell>₹{fmt(p.hra)}</TableCell>
                        <TableCell>₹{fmt(p.medical+p.transport+p.special)}</TableCell>
                        <TableCell className="font-medium">₹{fmt(p.gross)}</TableCell>
                        <TableCell className="text-red-600">₹{fmt(p.deductions)}</TableCell>
                        <TableCell className="font-bold text-green-700">₹{fmt(p.net)}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-gray-400" /></TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payslip Dialog */}
          <Dialog open={!!selectedPayslip} onOpenChange={()=>setSelectedPayslip(null)}>
            <DialogContent className="max-w-lg">
              {selectedPayslip&&(()=>{
                const emp=getEmp(selectedPayslip)!
                const p=calcPayroll(selectedPayslip)
                return(
                  <>
                    <DialogHeader><DialogTitle>Payslip - {emp.name}</DialogTitle></DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Employee ID</span><span>{emp.id}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Designation</span><span>{emp.designation}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Department</span><span>{emp.dept}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Period</span><span>{pMonth}/{pYear}</span></div>
                      <Separator />
                      <p className="font-semibold text-green-700">Earnings</p>
                      <div className="flex justify-between"><span>Basic Salary</span><span>₹{fmt(p.basic)}</span></div>
                      <div className="flex justify-between"><span>HRA</span><span>₹{fmt(p.hra)}</span></div>
                      <div className="flex justify-between"><span>Medical</span><span>₹{fmt(p.medical)}</span></div>
                      <div className="flex justify-between"><span>Transport</span><span>₹{fmt(p.transport)}</span></div>
                      <div className="flex justify-between"><span>Special</span><span>₹{fmt(p.special)}</span></div>
                      <Separator />
                      <div className="flex justify-between font-semibold"><span>Gross</span><span>₹{fmt(p.gross)}</span></div>
                      <Separator />
                      <p className="font-semibold text-red-600">Deductions</p>
                      <div className="flex justify-between"><span>Provident Fund</span><span>₹{fmt(p.pf)}</span></div>
                      <div className="flex justify-between"><span>Tax</span><span>₹{fmt(p.tax)}</span></div>
                      <div className="flex justify-between"><span>Professional Tax</span><span>₹{fmt(p.profTax)}</span></div>
                      <div className="flex justify-between"><span>ESI</span><span>₹{fmt(p.esi)}</span></div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold"><span>Net Pay</span><span className="text-green-700">₹{fmt(p.net)}</span></div>
                      <div className="flex justify-between text-xs text-gray-500"><span>Bank: ALO Education Ltd | A/C: XXXX-{emp.id.slice(-4)}</span></div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={()=>toast.success('Printing...')}><Printer className="h-4 w-4 mr-1" />Print</Button>
                        <Button size="sm" variant="outline" onClick={()=>toast.success('Downloaded')}><Download className="h-4 w-4 mr-1" />Download</Button>
                        <Button size="sm" variant="outline" onClick={()=>toast.success('Email sent')}><Mail className="h-4 w-4 mr-1" />Email</Button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== TAB 5: SALARY STRUCTURES ===== */}
        <TabsContent value="salary" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Employee Salary Structures</h3>
            <Button size="sm" className="bg-[#0066CC] hover:bg-[#0055aa] text-white" onClick={()=>toast.info('Bulk update coming soon')}><TrendingUp className="h-4 w-4 mr-1" />Bulk Update</Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Designation</TableHead><TableHead>Basic</TableHead>
                    <TableHead>HRA</TableHead><TableHead>Medical</TableHead><TableHead>Transport</TableHead>
                    <TableHead>Special</TableHead><TableHead>PF%</TableHead><TableHead>Tax%</TableHead><TableHead>Gross</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {salaryStructures.map(s=>{ const emp=getEmp(s.empId)!; const gross=s.basic+s.hra+s.medical+s.transport+s.special; return(
                      <TableRow key={s.empId}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-sm">{emp.designation}</TableCell>
                        <TableCell>₹{fmt(s.basic)}</TableCell><TableCell>₹{fmt(s.hra)}</TableCell>
                        <TableCell>₹{fmt(s.medical)}</TableCell><TableCell>₹{fmt(s.transport)}</TableCell>
                        <TableCell>₹{fmt(s.special)}</TableCell><TableCell>{s.pfRate}%</TableCell><TableCell>{s.taxRate}%</TableCell>
                        <TableCell className="font-semibold">₹{fmt(gross)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={()=>setSalaryDialogEmp(s.empId)}><Edit3 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!salaryDialogEmp} onOpenChange={()=>setSalaryDialogEmp(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Salary Structure - {salaryDialogEmp?getEmp(salaryDialogEmp)?.name:''}</DialogTitle></DialogHeader>
              {salaryDialogEmp&&(()=>{
                const s=salaryStructures.find(x=>x.empId===salaryDialogEmp)!
                return(
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Basic Salary</Label><Input defaultValue={s.basic} /></div>
                    <div><Label>HRA</Label><Input defaultValue={s.hra} /></div>
                    <div><Label>Medical Allowance</Label><Input defaultValue={s.medical} /></div>
                    <div><Label>Transport Allowance</Label><Input defaultValue={s.transport} /></div>
                    <div><Label>Special Allowance</Label><Input defaultValue={s.special} /></div>
                    <div><Label>PF Rate (%)</Label><Input defaultValue={s.pfRate} /></div>
                    <div><Label>Tax Rate (%)</Label><Input defaultValue={s.taxRate} /></div>
                  </div>
                )
              })()}
              <Button className="bg-[#F37021] hover:bg-[#e06010] text-white mt-3" onClick={()=>{setSalaryDialogEmp(null);toast.success('Salary structure updated')}}>Save Structure</Button>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== TAB 6: PAYSLIPS ===== */}
        <TabsContent value="payslips" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select defaultValue="3">
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=><SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select defaultValue="2025">
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024,2025,2026].map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Generated Payslips - March 2025</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>ID</TableHead><TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {employees.map(e=>{ const p=calcPayroll(e.id); return(
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>{e.id}</TableCell>
                        <TableCell>₹{fmt(p.gross)}</TableCell>
                        <TableCell className="text-red-600">₹{fmt(p.deductions)}</TableCell>
                        <TableCell className="font-bold text-green-700">₹{fmt(p.net)}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700">Generated</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={()=>{setSelectedPayslip(e.id)}}><FileText className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={()=>toast.success('Downloaded')}><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={()=>toast.success('Email sent')}><Send className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={()=>toast.success('Printing...')}><Printer className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
