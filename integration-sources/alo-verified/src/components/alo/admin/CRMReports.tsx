'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { BarChart3, TrendingUp, Users, DollarSign, FileText, Building2, Megaphone, UserCheck, Download, Save, Plus } from 'lucide-react'
import { toast } from 'sonner'

const C = ['#F37021', '#0066CC', '#22c55e', '#FFB347', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280']
const NAVY = '#1A2332'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const revTrend = months.map((m,i) => ({ month: m, revenue: [45,52,61,48,72,85,68,91,78,95,88,102][i]*1000, students: [12,15,18,11,22,28,20,32,25,35,30,38][i] }))
const enrollMonth = months.map((m,i) => ({ month: m, ug: [8,10,12,7,15,18,13,21,16,22,19,25][i], pg: [3,4,5,3,5,8,5,9,7,10,8,10][i], phd: [1,1,1,1,2,2,2,2,2,3,3,3][i] }))
const countryData = [{country:'UK',count:85},{country:'USA',count:62},{country:'Canada',count:48},{country:'Australia',count:41},{country:'Germany',count:28},{country:'Malaysia',count:22}]
const appStatus = [{name:'Submitted',value:120,color:C[0]},{name:'In Review',value:85,color:C[1]},{name:'Offered',value:62,color:C[2]},{name:'Enrolled',value:45,color:C[3]},{name:'Rejected',value:18,color:C[6]},{name:'Withdrawn',value:10,color:C[7]}]
const topPartners = [{name:'EduBridge',students:42,revenue:126000},{name:'GlobalEd',students:35,revenue:105000},{name:'StudyLink',students:28,revenue:84000},{name:'PathWay',students:22,revenue:66000},{name:'FutureEd',students:18,revenue:54000}]
const srcData = [{source:'Direct',value:35},{source:'Partner',value:30},{source:'Referral',value:20},{source:'Website',value:15}]
const funnelData = [{stage:'Leads',count:500},{stage:'Qualified',count:320},{stage:'Applied',count:200},{stage:'Offered',count:120},{stage:'Enrolled',count:85}]
const finMonth = months.map((m,i) => ({ month: m, revenue: [45,52,61,48,72,85,68,91,78,95,88,102][i]*1000, expense: [28,32,38,30,42,50,40,55,46,58,52,64][i]*1000 }))
const commData = [{partner:'EduBridge',paid:85000,pending:12000},{partner:'GlobalEd',paid:72000,pending:8000},{partner:'StudyLink',paid:55000,pending:15000},{partner:'PathWay',paid:48000,pending:6000},{partner:'FutureEd',paid:38000,pending:9000}]
const agingData = [{range:'0-30',amount:45000},{range:'31-60',amount:32000},{range:'61-90',amount:18000},{range:'90+',amount:8000}]
const svcData = [{service:'Consultation',revenue:85000},{service:'Application',revenue:220000},{service:'Visa',revenue:180000},{service:'Accommodation',revenue:95000},{service:'Insurance',revenue:42000}]
const pRanking = topPartners.map((p,i) => ({...p, conversion: [72,68,64,58,52][i], type: i%2===0?'TYPE1':'TYPE2', rate: [4.2,3.8,3.5,3.2,2.8][i] }))
const mktLead = [{source:'Facebook',leads:120,converted:28,cost:2400},{source:'Google',leads:85,converted:22,cost:3200},{source:'WhatsApp',leads:95,converted:18,cost:800},{source:'Referral',leads:60,converted:25,cost:0},{source:'Instagram',leads:75,converted:12,cost:1800},{source:'Website',leads:50,converted:15,cost:1200}]
const campData = [{name:'Summer UK',impressions:15000,clicks:850,conversions:42},{name:'Canada Express',impressions:12000,clicks:620,conversions:35},{name:'Australia Open',impressions:9000,clicks:480,conversions:28},{name:'Scholarship Drive',impressions:18000,clicks:1100,conversions:55}]
const socialData = [{platform:'Facebook',followers:5200,engagement:3.2},{platform:'Instagram',followers:3800,engagement:4.5},{platform:'TikTok',followers:6200,engagement:6.8},{platform:'YouTube',followers:2100,engagement:2.1},{platform:'LinkedIn',followers:1500,engagement:1.8}]
const emailData = [{campaign:'Welcome Series',sent:1200,opened:480,clicked:120},{campaign:'Visa Updates',sent:800,opened:520,clicked:180},{campaign:'Scholarship Alert',sent:1500,opened:680,clicked:220},{campaign:'Partner Digest',sent:400,opened:240,clicked:60}]
const hrAtt = [{dept:'Counseling',present:22,absent:3,leave:2},{dept:'Visa',present:15,absent:1,leave:1},{dept:'Marketing',present:12,absent:2,leave:1},{dept:'Finance',present:8,absent:0,leave:1},{dept:'HR',present:5,absent:1,leave:0}]
const salaryData = [{range:'20-30k',count:8},{range:'30-40k',count:15},{range:'40-50k',count:12},{range:'50-60k',count:6},{range:'60k+',count:4}]
const leaveData = [{type:'Casual',used:45,total:90},{type:'Sick',used:28,total:60},{type:'Annual',used:62,total:120},{type:'Maternity',used:5,total:12}]

function KPICard({ title, value, change, icon: Icon, color }: { title: string; value: string; change: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-xl font-bold mt-1" style={{ color: NAVY }}>{value}</p>
            <Badge className={`mt-1 text-xs ${change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{change}</Badge>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: color + '15' }}><Icon className="h-5 w-5" style={{ color }} /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{headers.map(h => <th key={h} className="text-left py-2 px-2 font-medium text-gray-500">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b last:border-0 hover:bg-gray-50">{r.map((c, j) => <td key={j} className="py-2 px-2">{c}</td>)}</tr>)}</tbody></table></div>
  )
}

export default function CRMReports() {
  const [activeTab, setActiveTab] = useState('executive')
  const [cReportType, setCReportType] = useState('student')
  const [cDateFrom, setCDateFrom] = useState('')
  const [cDateTo, setCDateTo] = useState('')
  const [cDept, setCDept] = useState('all')
  const [cPartner, setCPartner] = useState('all')
  const [cStatus, setCStatus] = useState('all')
  const [cCountry, setCCountry] = useState('all')
  const [showResults, setShowResults] = useState(false)

  const satisfactionData = [{category:'Counseling',score:4.5},{category:'Visa Support',score:4.2},{category:'University Match',score:4.6},{category:'Communication',score:3.9},{category:'Overall',score:4.3}]

  const customReportRows = [
    ['STU-001','Tanvir Ahmed','UK','Counseling','Enrolled','Jan 2025'],
    ['STU-002','Fatima Khan','Canada','Visa','In Review','Feb 2025'],
    ['STU-003','Rahul Sharma','Australia','Marketing','Applied','Mar 2025'],
    ['STU-004','Nusrat Jahan','USA','HR','Offered','Jan 2025'],
    ['STU-005','Arif Hossain','Germany','Finance','Submitted','Apr 2025'],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-[#F37021]" />
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Reports & Analytics</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1">
            {[
              { v: 'executive', l: 'Executive', icon: TrendingUp },
              { v: 'student', l: 'Student', icon: Users },
              { v: 'financial', l: 'Financial', icon: DollarSign },
              { v: 'partner', l: 'Partner', icon: Building2 },
              { v: 'marketing', l: 'Marketing', icon: Megaphone },
              { v: 'hr', l: 'HR', icon: UserCheck },
              { v: 'custom', l: 'Custom', icon: FileText },
            ].map(t => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs gap-1 data-[state=active]:bg-[#F37021] data-[state=active]:text-white">
                <t.icon className="h-3.5 w-3.5" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Executive Dashboard */}
        <TabsContent value="executive" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <KPICard title="Total Revenue" value="৳8.85L" change="+12%" icon={DollarSign} color={C[0]} />
            <KPICard title="Students Enrolled" value="286" change="+8%" icon={Users} color={C[1]} />
            <KPICard title="Applications" value="340" change="+15%" icon={FileText} color={C[2]} />
            <KPICard title="Visa Success" value="94%" change="+3%" icon={TrendingUp} color={C[4]} />
            <KPICard title="Partner Revenue" value="৳4.35L" change="+10%" icon={Building2} color={C[5]} />
            <KPICard title="Productivity" value="92%" change="+5%" icon={UserCheck} color={C[3]} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Revenue Trend (12 Months)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ revenue: { color: C[0] } }} className="h-56">
                  <AreaChart data={revTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><ChartTooltip content={<ChartTooltipContent />} /><Area type="monotone" dataKey="revenue" stroke={C[0]} fill={C[0]} fillOpacity={0.15} name="Revenue" /></AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Student Enrollment Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ students: { color: C[1] } }} className="h-56">
                  <LineChart data={revTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><ChartTooltip content={<ChartTooltipContent />} /><Line type="monotone" dataKey="students" stroke={C[1]} strokeWidth={2} dot={{ fill: C[1], r: 3 }} name="Students" /></LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Application Status</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ Submitted: { color: C[0] }, 'In Review': { color: C[1] }, Offered: { color: C[2] }, Enrolled: { color: C[3] }, Rejected: { color: C[6] }, Withdrawn: { color: C[7] } }} className="h-52">
                  <PieChart><ChartTooltip content={<ChartTooltipContent />} /><Pie data={appStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">{appStatus.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Top Partners</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ students: { color: C[1] } }} className="h-52">
                  <BarChart data={topPartners} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={65} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="students" fill={C[1]} radius={[0,4,4,0]} name="Students" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Students by Country</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { color: C[0] } }} className="h-52">
                  <BarChart data={countryData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="country" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill={C[0]} radius={[4,4,0,0]} name="Students" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Reports */}
        <TabsContent value="student" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Enrollment by Month (UG/PG/PhD)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ ug: { color: C[0] }, pg: { color: C[1] }, phd: { color: C[2] } }} className="h-56">
                  <BarChart data={enrollMonth}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="ug" stackId="a" fill={C[0]} name="UG" /><Bar dataKey="pg" stackId="a" fill={C[1]} name="PG" /><Bar dataKey="phd" stackId="a" fill={C[2]} name="PhD" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Students by Source</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ Direct: { color: C[0] }, Partner: { color: C[1] }, Referral: { color: C[2] }, Website: { color: C[3] } }} className="h-56">
                  <PieChart><ChartTooltip content={<ChartTooltipContent />} /><Pie data={srcData} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="source" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>{srcData.map((_, i) => <Cell key={i} fill={C[i]} />)}</Pie></PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Application Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { color: C[0] } }} className="h-56">
                  <BarChart data={funnelData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="stage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill={C[0]} radius={[4,4,0,0]} name="Count" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Satisfaction Scores</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ score: { color: C[1] } }} className="h-56">
                  <BarChart data={satisfactionData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0,5]} tick={{ fontSize: 10 }} /><YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="score" fill={C[1]} radius={[0,4,4,0]} name="Score" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total Revenue" value="৳8.85L" change="+12%" icon={DollarSign} color={C[0]} />
            <KPICard title="Commission Paid" value="৳2.98L" change="+8%" icon={Building2} color={C[1]} />
            <KPICard title="Collection Rate" value="87%" change="+4%" icon={TrendingUp} color={C[2]} />
            <KPICard title="Net Profit" value="৳3.45L" change="+18%" icon={DollarSign} color={C[4]} />
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Revenue vs Expense Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ revenue: { color: C[0] }, expense: { color: C[6] } }} className="h-56">
                <AreaChart data={finMonth}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><ChartTooltip content={<ChartTooltipContent />} /><Area type="monotone" dataKey="revenue" stroke={C[0]} fill={C[0]} fillOpacity={0.1} name="Revenue" /><Area type="monotone" dataKey="expense" stroke={C[6]} fill={C[6]} fillOpacity={0.1} name="Expense" /></AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Commission Paid vs Pending</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ paid: { color: C[2] }, pending: { color: C[3] } }} className="h-52">
                  <BarChart data={commData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="partner" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="paid" fill={C[2]} radius={[4,4,0,0]} name="Paid" /><Bar dataKey="pending" fill={C[3]} radius={[4,4,0,0]} name="Pending" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Invoice Aging</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ amount: { color: C[0] } }} className="h-52">
                  <BarChart data={agingData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="amount" fill={C[0]} radius={[4,4,0,0]} name="Amount" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Revenue by Service</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ revenue: { color: C[1] } }} className="h-52">
                  <BarChart data={svcData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="service" type="category" tick={{ fontSize: 10 }} width={85} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="revenue" fill={C[1]} radius={[0,4,4,0]} name="Revenue" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Profit & Loss Summary</CardTitle></CardHeader>
              <CardContent>
                <MiniTable headers={['Item','Amount','']} rows={[
                  ['Gross Revenue','৳8,85,000',''],['Commission Paid','৳2,98,000',''],['Operating Expense','৳2,42,000',''],['Net Profit','৳3,45,000',''],['Margin','39%','']
                ]} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Partner Reports */}
        <TabsContent value="partner" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Active Partners" value="5" change="+1" icon={Building2} color={C[0]} />
            <KPICard title="Total Students" value="145" change="+12%" icon={Users} color={C[1]} />
            <KPICard title="Avg Conversion" value="62.8%" change="+5%" icon={TrendingUp} color={C[2]} />
            <KPICard title="Total Revenue" value="৳4.35L" change="+10%" icon={DollarSign} color={C[4]} />
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Partner Performance Ranking</CardTitle></CardHeader>
            <CardContent>
              <MiniTable headers={['Rank','Partner','Students','Revenue','Conversion','Type','Rating']} rows={pRanking.map((p, i) => [(i+1), p.name, p.students, `৳${(p.revenue/1000).toFixed(0)}k`, `${p.conversion}%`, p.type, `${p.rate}/5`])} />
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Commission by Partner</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ paid: { color: C[2] }, pending: { color: C[3] } }} className="h-52">
                  <BarChart data={commData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="partner" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="paid" fill={C[2]} name="Paid" /><Bar dataKey="pending" fill={C[3]} name="Pending" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>TYPE1 vs TYPE2 Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ TYPE1: { color: C[0] }, TYPE2: { color: C[1] } }} className="h-52">
                  <PieChart><ChartTooltip content={<ChartTooltipContent />} /><Pie data={[{name:'TYPE1',value:3},{name:'TYPE2',value:2}]} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>{[{name:'TYPE1',value:3},{name:'TYPE2',value:2}].map((_, i) => <Cell key={i} fill={C[i]} />)}</Pie></PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Reports */}
        <TabsContent value="marketing" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total Leads" value="485" change="+22%" icon={Megaphone} color={C[0]} />
            <KPICard title="Conversion Rate" value="18.6%" change="+3%" icon={TrendingUp} color={C[2]} />
            <KPICard title="Cost/Lead" value="৳19.4" change="-8%" icon={DollarSign} color={C[1]} />
            <KPICard title="Social Reach" value="18.8K" change="+15%" icon={Users} color={C[4]} />
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Lead Source Effectiveness</CardTitle></CardHeader>
            <CardContent>
              <MiniTable headers={['Source','Leads','Converted','Cost','CPL']} rows={mktLead.map(l => [l.source, l.leads, l.converted, `৳${l.cost}`, `৳${l.cost > 0 ? (l.cost/l.leads).toFixed(0) : 0}`])} />
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Campaign Performance</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ impressions: { color: C[0] }, clicks: { color: C[1] }, conversions: { color: C[2] } }} className="h-52">
                  <BarChart data={campData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="conversions" fill={C[2]} name="Conversions" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Social Media Engagement</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ followers: { color: C[1] }, engagement: { color: C[0] } }} className="h-52">
                  <BarChart data={socialData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="platform" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="followers" fill={C[1]} name="Followers" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Email Campaign Metrics</CardTitle></CardHeader>
            <CardContent>
              <MiniTable headers={['Campaign','Sent','Opened','Open Rate','Clicked','CTR']} rows={emailData.map(e => [e.campaign, e.sent, e.opened, `${((e.opened/e.sent)*100).toFixed(1)}%`, e.clicked, `${((e.clicked/e.sent)*100).toFixed(1)}%`])} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>WhatsApp Conversation Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[['Active Chats','142','+18%'],['Avg Response','4.2 min','-12%'],['Templates Used','86','+25%'],['Resolution Rate','78%','+5%']].map(([l,v,c]) => (
                  <div key={l} className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">{l}</p><p className="text-lg font-bold" style={{ color: NAVY }}>{v}</p><Badge className={`text-xs ${c.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'}`}>{c}</Badge></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Reports */}
        <TabsContent value="hr" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total Staff" value="45" change="+2" icon={Users} color={C[1]} />
            <KPICard title="Attendance" value="91%" change="+3%" icon={UserCheck} color={C[2]} />
            <KPICard title="Avg Salary" value="৳38K" change="+5%" icon={DollarSign} color={C[0]} />
            <KPICard title="Turnover Rate" value="8.2%" change="-2%" icon={TrendingUp} color={C[6]} />
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Department Attendance Summary</CardTitle></CardHeader>
            <CardContent>
              <MiniTable headers={['Department','Present','Absent','On Leave','Rate']} rows={hrAtt.map(d => [d.dept, d.present, d.absent, d.leave, `${((d.present/(d.present+d.absent+d.leave))*100).toFixed(0)}%`])} />
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Salary Distribution</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { color: C[0] } }} className="h-52">
                  <BarChart data={salaryData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill={C[0]} radius={[4,4,0,0]} name="Employees" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Leave Utilization</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ used: { color: C[0] }, total: { color: C[7] } }} className="h-52">
                  <BarChart data={leaveData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="type" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="used" fill={C[0]} name="Used" /><Bar dataKey="total" fill={C[7]} name="Total" /></BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Overtime Analysis</CardTitle></CardHeader>
              <CardContent>
                <MiniTable headers={['Department','Total OT Hours','Avg OT/Person','OT Cost']} rows={[
                  ['Counseling','180','8.2','৳45,000'],['Visa','120','7.5','৳30,000'],['Marketing','95','7.9','৳24,000'],['Finance','45','5.6','৳11,000'],['HR','30','5.0','৳7,500']
                ]} />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Employee Turnover Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ rate: { color: C[6] } }} className="h-52">
                  <LineChart data={[{m:'Q1',rate:10.2},{m:'Q2',rate:9.5},{m:'Q3',rate:8.8},{m:'Q4',rate:8.2}]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} domain={[0,15]} /><ChartTooltip content={<ChartTooltipContent />} /><Line type="monotone" dataKey="rate" stroke={C[6]} strokeWidth={2} dot={{ fill: C[6], r: 4 }} name="Turnover %" /></LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Report Builder */}
        <TabsContent value="custom" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Report Builder</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Report Type</label>
                  <Select value={cReportType} onValueChange={setCReportType}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="student">Student Report</SelectItem><SelectItem value="financial">Financial Report</SelectItem><SelectItem value="partner">Partner Report</SelectItem><SelectItem value="marketing">Marketing Report</SelectItem><SelectItem value="hr">HR Report</SelectItem><SelectItem value="visa">Visa Report</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Date From</label><Input type="date" value={cDateFrom} onChange={e => setCDateFrom(e.target.value)} /></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Date To</label><Input type="date" value={cDateTo} onChange={e => setCDateTo(e.target.value)} /></div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Department</label>
                  <Select value={cDept} onValueChange={setCDept}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem><SelectItem value="counseling">Counseling</SelectItem><SelectItem value="visa">Visa</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="finance">Finance</SelectItem><SelectItem value="hr">HR</SelectItem></SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Partner</label>
                  <Select value={cPartner} onValueChange={setCPartner}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Partners</SelectItem>{topPartners.map(p => <SelectItem key={p.name} value={p.name.toLowerCase()}>{p.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                  <Select value={cStatus} onValueChange={setCStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem><SelectItem value="in_review">In Review</SelectItem><SelectItem value="offered">Offered</SelectItem><SelectItem value="applied">Applied</SelectItem></SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Country</label>
                  <Select value={cCountry} onValueChange={setCCountry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Countries</SelectItem>{countryData.map(c => <SelectItem key={c.country} value={c.country.toLowerCase()}>{c.country}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-[#F37021] hover:bg-[#e06010] text-white" onClick={() => { setShowResults(true); toast.success('Report generated successfully') }}>
                  <Plus className="h-4 w-4 mr-1" />Generate Report
                </Button>
                <Button variant="outline" onClick={() => toast.success('Report exported to CSV')}><Download className="h-4 w-4 mr-1" />Export to CSV</Button>
                <Button variant="outline" onClick={() => toast.success('Report template saved')}><Save className="h-4 w-4 mr-1" />Save Template</Button>
              </div>
            </CardContent>
          </Card>
          {showResults && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Report Results — {cReportType.charAt(0).toUpperCase() + cReportType.slice(1)} Report</CardTitle></CardHeader>
              <CardContent>
                <MiniTable headers={['ID','Name','Country','Department','Status','Date']} rows={customReportRows} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
