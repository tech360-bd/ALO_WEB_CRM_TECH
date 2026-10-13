'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  employmentType: string
  joiningDate: string
  department?: { name: string }
  designation?: { name: string }
  branch?: { name: string }
  _count?: { assignedLeads: number; assignedTasks: number; attendance: number }
}

export default function CRMEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '',
    gender: '', dateOfBirth: '', role: 'employee', employmentType: 'full-time',
    joiningDate: '', salary: '', departmentId: '', designationId: '', branchId: '',
    status: 'active', createUserAccount: true
  })

  useEffect(() => { fetchEmployees() }, [search, statusFilter, departmentFilter, pagination.page])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      let url = `/api/employees?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`
      if (departmentFilter) url += `&departmentId=${departmentFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setEmployees(json.employees || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleAddEmployee = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('First name, last name, and email are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salary: parseFloat(form.salary) || 0 })
      })
      if (res.ok) {
        toast.success('Employee added successfully')
        setAddDialogOpen(false)
        setForm({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', gender: '', dateOfBirth: '', role: 'employee', employmentType: 'full-time', joiningDate: '', salary: '', departmentId: '', designationId: '', branchId: '', status: 'active', createUserAccount: true })
        fetchEmployees()
      } else { toast.error('Failed to add employee') }
    } catch { toast.error('Failed to add employee') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Employees Management</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white"><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
              </div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="counselor">Counselor</SelectItem>
                      <SelectItem value="junior_counselor">Junior Counselor</SelectItem>
                      <SelectItem value="visa_officer">Visa Officer</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="marketing_executive">Marketing Executive</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Employment Type</Label>
                  <Select value={form.employmentType} onValueChange={v => setForm({...form, employmentType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="full-time">Full-time</SelectItem><SelectItem value="part-time">Part-time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="intern">Intern</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} /></div>
              </div>
              <div><Label>Salary</Label><Input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="Monthly salary" /></div>
              <Button onClick={handleAddEmployee} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">{submitting ? 'Adding...' : 'Add Employee'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="on_leave">On Leave</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No employees found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                      <TableCell>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{emp.department?.name || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{emp.role?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell><Badge className={emp.status === 'active' ? 'bg-green-100 text-green-700' : emp.status === 'on_leave' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}>{emp.status}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell capitalize text-sm">{emp.employmentType}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => { setSelectedEmployee(emp); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {employees.length} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Employee Details</DialogTitle></DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                <Badge className={selectedEmployee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{selectedEmployee.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Employee ID</p><p className="font-medium">{selectedEmployee.employeeId}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedEmployee.email}</p></div>
                <div><p className="text-gray-500">Department</p><p className="font-medium">{selectedEmployee.department?.name || 'N/A'}</p></div>
                <div><p className="text-gray-500">Designation</p><p className="font-medium">{selectedEmployee.designation?.name || 'N/A'}</p></div>
                <div><p className="text-gray-500">Role</p><p className="font-medium capitalize">{selectedEmployee.role?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-gray-500">Branch</p><p className="font-medium">{selectedEmployee.branch?.name || 'N/A'}</p></div>
                <div><p className="text-gray-500">Leads</p><p className="font-medium">{selectedEmployee._count?.assignedLeads || 0}</p></div>
                <div><p className="text-gray-500">Tasks</p><p className="font-medium">{selectedEmployee._count?.assignedTasks || 0}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
