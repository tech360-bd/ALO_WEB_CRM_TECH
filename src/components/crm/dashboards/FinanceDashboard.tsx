'use client';

import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign, Clock, CheckCircle2, AlertTriangle, Receipt,
  ArrowUpRight, ArrowDownRight, Building2, Users, Download,
  ChevronRight, TrendingUp, CreditCard,
} from 'lucide-react';

const revenueByBranch = [
  { branch: 'Dhaka (Dhanmondi)', revenue: '৳15.8L', deposits: '৳3.2L', commissions: '৳4.1L', pending: '৳2.1L' },
  { branch: 'Chattogram', revenue: '৳10.2L', deposits: '৳2.4L', commissions: '৳2.8L', pending: '৳1.5L' },
  { branch: 'Sylhet', revenue: '৳8.4L', deposits: '৳1.6L', commissions: '৳2.2L', pending: '৳1.8L' },
  { branch: 'Rajshahi', revenue: '৳6.1L', deposits: '৳0.8L', commissions: '৳1.7L', pending: '৳1.2L' },
  { branch: 'Dhaka (Banani)', revenue: '৳4.7L', deposits: '৳0.5L', commissions: '৳1.5L', pending: '৳1.9L' },
];

const paymentReceipts = [
  { student: 'Arif Khan', amount: '৳85,000', method: 'Bank Transfer', date: 'Dec 10', status: 'verified' },
  { student: 'Sadia Rahman', amount: '৳1,20,000', method: 'Cash', date: 'Dec 9', status: 'verified' },
  { student: 'Imtiaz Ahmed', amount: '৳65,000', method: 'bKash', date: 'Dec 9', status: 'pending' },
  { student: 'Rakib Hasan', amount: '৳95,000', method: 'Bank Transfer', date: 'Dec 8', status: 'verified' },
  { student: 'Priti Das', amount: '৳75,000', method: 'Cash', date: 'Dec 8', status: 'pending' },
];

const partnerCommissions = [
  { partner: 'Stellar Education', students: 34, commission: '৳2.8L', paid: '৳2.1L', pending: '৳0.7L' },
  { partner: 'Global Pathways', students: 28, commission: '৳2.2L', paid: '৳1.8L', pending: '৳0.4L' },
  { partner: 'EduBridge BD', students: 22, commission: '৳1.6L', paid: '৳1.2L', pending: '৳0.4L' },
  { partner: 'Way to Study', students: 18, commission: '৳1.1L', paid: '৳0.6L', pending: '৳0.5L' },
];

const kpis = [
  { label: 'Total Revenue', value: '৳45.2L', change: '+8%', up: true, icon: DollarSign, sub: 'This fiscal year' },
  { label: 'Pending Deposits', value: '৳8.5L', change: '-12%', up: true, icon: Clock, sub: 'Awaiting payment' },
  { label: 'Commission Payable', value: '৳12.3L', change: '+5%', up: false, icon: CreditCard, sub: 'Outstanding' },
  { label: 'Commission Paid', value: '৳28.7L', change: '+10%', up: true, icon: CheckCircle2, sub: 'Settled' },
  { label: 'Refund Requests', value: '3', change: '+1', up: false, icon: AlertTriangle, sub: 'Under review' },
  { label: 'This Month', value: '৳5.8L', change: '+12%', up: true, icon: TrendingUp, sub: 'Revenue' },
];

export default function FinanceDashboard() {
  const { user } = usePortalStore();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Finance Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><DollarSign className="w-3 h-3 mr-1" />Finance</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Download className="w-4 h-4" /> Export Ledger</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Receipt className="w-4 h-4" /> Record Payment</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-alo-brand" />
                <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-crm-success-text' : 'text-crm-danger-text'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue by Branch Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-alo-brand" /> Revenue by Branch
                </CardTitle>
                <span className="text-xs text-alo-text-muted">FY 2024-25</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Branch</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Revenue</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Deposits</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Commissions</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByBranch.map((b) => (
                      <TableRow key={b.branch}>
                        <TableCell className="text-sm font-medium text-alo-text">{b.branch}</TableCell>
                        <TableCell className="text-sm font-semibold text-alo-text text-right">{b.revenue}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{b.deposits}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{b.commissions}</TableCell>
                        <TableCell className="text-sm text-crm-warning-text text-right">{b.pending}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Receipts */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-alo-brand" /> Recent Payment Receipts
                </CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className=" text-alo-brand">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {paymentReceipts.map((p) => (
                  <div key={p.student} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-alo-text">{p.student}</p>
                      <p className="text-[11px] text-alo-text-muted">{p.method} · {p.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-alo-text">{p.amount}</span>
                      <Badge variant={p.status === 'verified' ? 'success' : 'warning'} className="text-[11px]">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Partner Commission Summary */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Users className="w-4 h-4 text-alo-brand" /> Partner Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {partnerCommissions.map((p) => (
                  <div key={p.partner} className="p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-alo-text">{p.partner}</p>
                      <span className="text-sm font-semibold text-alo-text">{p.commission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-alo-text-muted">{p.students} students</span>
                      <span className="text-[11px] text-crm-success-text">Paid: {p.paid}</span>
                      <span className="text-[11px] text-crm-warning-text">Pending: {p.pending}</span>
                    </div>
                    <Progress value={(parseInt(p.paid.replace(/[^0-9]/g, '')) / parseInt(p.commission.replace(/[^0-9]/g, ''))) * 100} className="h-1.5 mt-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-crm-warning-text" /> Pending Invoices
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">8 items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Stellar Education — Nov commission', 'Global Pathways — Service fee', 'EduBridge BD — Dec deposit'].map((inv, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-crm-warning-border bg-crm-warning-bg">
                    <p className="text-sm text-alo-text">{inv}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="warning" className="text-[11px]">Overdue</Badge>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-[11px] text-alo-brand">Send Reminder</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}