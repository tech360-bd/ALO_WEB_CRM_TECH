'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Megaphone, Calendar, Plus, Edit, Trash2, Eye, Target,
  DollarSign, TrendingUp, Users, BarChart3, Copy, Play, Pause,
  Archive, Filter, ArrowRight, Globe, Zap,
} from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

interface CampaignRow {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'draft' | 'completed' | 'archived';
  leads: number;
  cost: number;
  roi: number;
  conversionRate: number;
  startDate: string;
  endDate: string;
  goal: string;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  platform: string;
  type: 'post' | 'campaign' | 'event' | 'deadline';
  time: string;
}

interface BuilderForm {
  name: string;
  goal: string;
  platforms: string[];
  country: string;
  studentType: string;
  budgetRange: string;
  budget: string;
  startDate: string;
  endDate: string;
  contentRequirements: string;
  autoSchedule: boolean;
  notifyOnComplete: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  draft: { label: 'Draft', color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]' },
  completed: { label: 'Completed', color: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]' },
  archived: { label: 'Archived', color: 'bg-gray-200 text-[var(--alo-text-muted)] border-[var(--alo-border-strong)]' },
};

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: 'bg-blue-500',
  Instagram: 'bg-pink-500',
  LinkedIn: 'bg-sky-600',
  TikTok: 'bg-gray-800',
  YouTube: 'bg-red-600',
  WhatsApp: 'bg-green-600',
  Website: 'bg-[var(--alo-cta)]',
};

const PLATFORM_DOT_COLORS: Record<string, string> = {
  Facebook: 'bg-blue-500',
  Instagram: 'bg-pink-500',
  LinkedIn: 'bg-sky-600',
  TikTok: 'bg-gray-800',
  YouTube: 'bg-red-600',
  WhatsApp: 'bg-green-600',
  Website: 'bg-[var(--alo-cta)]',
};

// ============================================================
// Mock Data — Campaigns
// ============================================================

const MOCK_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'c-001', name: 'UK Fall 2025 — Facebook Lead Gen',
    platform: 'Facebook', status: 'active', leads: 178, cost: 85000, roi: 3.2,
    conversionRate: 12.4, startDate: '2025-01-05', endDate: '2025-03-15', goal: 'Increase Leads',
  },
  {
    id: 'c-002', name: 'Australia Nursing — Instagram Reels',
    platform: 'Instagram', status: 'active', leads: 89, cost: 38000, roi: 2.1,
    conversionRate: 8.7, startDate: '2025-01-10', endDate: '2025-02-28', goal: 'Promote Course',
  },
  {
    id: 'c-003', name: 'Canada Winter — LinkedIn B2B',
    platform: 'LinkedIn', status: 'paused', leads: 45, cost: 62000, roi: 2.8,
    conversionRate: 9.2, startDate: '2024-12-01', endDate: '2025-01-31', goal: 'University Partner',
  },
  {
    id: 'c-004', name: 'Germany Free Tuition — TikTok',
    platform: 'TikTok', status: 'draft', leads: 0, cost: 0, roi: 0,
    conversionRate: 0, startDate: '2025-02-01', endDate: '2025-04-30', goal: 'Scholarship',
  },
  {
    id: 'c-005', name: 'UK Scholarship Alert — WhatsApp Broadcast',
    platform: 'WhatsApp', status: 'active', leads: 234, cost: 12000, roi: 8.5,
    conversionRate: 18.3, startDate: '2025-01-01', endDate: '2025-01-31', goal: 'Scholarship',
  },
  {
    id: 'c-006', name: 'USA MS Targeted — YouTube Pre-roll',
    platform: 'YouTube', status: 'completed', leads: 112, cost: 48000, roi: 3.1,
    conversionRate: 10.1, startDate: '2024-10-01', endDate: '2024-12-15', goal: 'Increase Leads',
  },
  {
    id: 'c-007', name: 'Dhaka Education Fair — Website Landing',
    platform: 'Website', status: 'completed', leads: 67, cost: 15000, roi: 4.5,
    conversionRate: 14.2, startDate: '2024-11-20', endDate: '2024-12-20', goal: 'Drive Events',
  },
  {
    id: 'c-008', name: 'IELTS Promo — Multi-platform',
    platform: 'Facebook', status: 'archived', leads: 156, cost: 55000, roi: 2.6,
    conversionRate: 11.5, startDate: '2024-08-01', endDate: '2024-09-30', goal: 'Promote Course',
  },
];

// ============================================================
// Mock Data — Calendar Events
// ============================================================

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'e-001', date: '2025-01-05', title: 'UK Fall 2025 Campaign Launch', platform: 'Facebook', type: 'campaign', time: '09:00' },
  { id: 'e-002', date: '2025-01-06', title: 'Instagram Reel: Nursing in Aus', platform: 'Instagram', type: 'post', time: '12:00' },
  { id: 'e-003', date: '2025-01-08', title: 'LinkedIn Article: Canada MBA', platform: 'LinkedIn', type: 'post', time: '10:00' },
  { id: 'e-004', date: '2025-01-10', title: 'WhatsApp Broadcast: Scholarships', platform: 'WhatsApp', type: 'campaign', time: '08:00' },
  { id: 'e-005', date: '2025-01-12', title: 'Dhaka Education Fair', platform: 'Website', type: 'event', time: '10:00' },
  { id: 'e-006', date: '2025-01-15', title: 'UK Deadline Reminder Post', platform: 'Facebook', type: 'post', time: '11:00' },
  { id: 'e-007', date: '2025-01-15', title: 'Instagram Story: Visa Success', platform: 'Instagram', type: 'post', time: '18:00' },
  { id: 'e-008', date: '2025-01-18', title: 'UK University Webinar', platform: 'Website', type: 'event', time: '15:00' },
  { id: 'e-009', date: '2025-01-20', title: 'TikTok: Germany Free Tuition', platform: 'TikTok', type: 'post', time: '14:00' },
  { id: 'e-010', date: '2025-01-22', title: 'YouTube Video: Study in USA', platform: 'YouTube', type: 'post', time: '10:00' },
  { id: 'e-011', date: '2025-01-25', title: 'Campaign Review Meeting', platform: 'Website', type: 'deadline', time: '09:30' },
  { id: 'e-012', date: '2025-01-28', title: 'WhatsApp: Canada Info Session', platform: 'WhatsApp', type: 'campaign', time: '08:00' },
  { id: 'e-013', date: '2025-01-30', title: 'Month-end Analytics Report', platform: 'Website', type: 'deadline', time: '17:00' },
  { id: 'e-014', date: '2025-01-06', title: 'Facebook Carousel: Top 10 UK Unis', platform: 'Facebook', type: 'post', time: '09:00' },
  { id: 'e-015', date: '2025-01-14', title: 'LinkedIn Post: Partner Spotlight', platform: 'LinkedIn', type: 'post', time: '08:30' },
];

// ============================================================
// Helper: Format BDT
// ============================================================

function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}

// ============================================================
// Sub-component: KPI Summary Cards
// ============================================================

function KpiCards({ campaigns }: { campaigns: CampaignRow[] }) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalLeads = activeCampaigns.reduce((a, c) => a + c.leads, 0);
  const totalSpend = activeCampaigns.reduce((a, c) => a + c.cost, 0);
  const avgROI = activeCampaigns.length > 0
    ? activeCampaigns.reduce((a, c) => a + c.roi, 0) / activeCampaigns.length
    : 0;
  const avgConversion = activeCampaigns.length > 0
    ? activeCampaigns.reduce((a, c) => a + c.conversionRate, 0) / activeCampaigns.length
    : 0;

  const cards = [
    {
      label: 'Active Campaigns',
      value: activeCampaigns.length.toString(),
      icon: Megaphone,
      change: '+2 this month',
      color: 'text-[var(--alo-cta-active)] bg-[var(--alo-cta-soft)]',
    },
    {
      label: 'Total Leads',
      value: totalLeads.toString(),
      icon: Users,
      change: '+18% vs last month',
      color: 'text-[var(--alo-brand)] bg-[var(--alo-brand-pale)]',
    },
    {
      label: 'Total Spend',
      value: formatBDT(totalSpend),
      icon: DollarSign,
      change: 'Budget: ৳3,00,000',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Avg. ROI',
      value: `${avgROI.toFixed(1)}x`,
      icon: TrendingUp,
      change: '+0.4x improvement',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Avg. Conversion',
      value: `${avgConversion.toFixed(1)}%`,
      icon: Target,
      change: '+1.2% vs last month',
      color: 'text-sky-600 bg-sky-50',
    },
    {
      label: 'Cost Per Lead',
      value: totalLeads > 0 ? formatBDT(Math.round(totalSpend / totalLeads)) : '৳0',
      icon: BarChart3,
      change: '-৳15 per lead',
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border border-[var(--alo-border)] shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-[var(--alo-text)]">{card.value}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] font-medium">{card.label}</p>
            <p className="text-[11px] text-emerald-600 mt-1">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// Sub-component: Campaign Table
// ============================================================

function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <Card className="border border-[var(--alo-border)] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">
          All Campaigns ({campaigns.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--alo-page)]/80">
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider">Campaign</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider">Platform</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider text-right">Leads</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider text-right">Cost (BDT)</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider text-right">ROI</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider text-right">Conv. Rate</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider">Dates</TableHead>
              <TableHead className="text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id} className="hover:bg-[var(--alo-cta-soft)]/30 transition-colors">
                <TableCell className="py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--alo-text)]">{c.name}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">{c.goal}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT_COLORS[c.platform] || 'bg-gray-400'}`} />
                    <span className="text-xs text-[var(--alo-body)]">{c.platform}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[11px] font-semibold px-2 py-0.5 ${STATUS_CONFIG[c.status]?.color || ''}`}>
                    {STATUS_CONFIG[c.status]?.label || c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-semibold text-[var(--alo-text)]">{c.leads}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-[var(--alo-body)]">{formatBDT(c.cost)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm font-semibold ${c.roi >= 3 ? 'text-emerald-600' : c.roi >= 2 ? 'text-amber-600' : 'text-[var(--alo-text-muted)]'}`}>
                    {c.roi > 0 ? `${c.roi}x` : '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-[var(--alo-body)]">{c.conversionRate > 0 ? `${c.conversionRate}%` : '—'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-[var(--alo-text-muted)]">
                    {c.startDate} → {c.endDate}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)]">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-cta-active)]">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    {c.status === 'active' && (
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-yellow-600">
                        <Pause className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {c.status === 'paused' && (
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-green-600">
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Sub-component: Calendar View
// ============================================================

function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>('2025-01-15');
  const [currentMonth, setCurrentMonth] = useState(0); // January 2025
  const [currentYear] = useState(2025);

  const year = currentYear;
  const month = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const upcomingEvents = events
    .filter((e) => e.date >= '2025-01-10')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2 border border-[var(--alo-border)] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">
              <Calendar className="w-4 h-4 inline mr-2 text-[var(--alo-cta)]" />
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setCurrentMonth(Math.max(0, month - 1))}>
                Prev
              </Button>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-7 text-[11px]">Today</Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setCurrentMonth(Math.min(11, month + 1))}>
                Next
              </Button>
            </div>
          </div>
          {/* Platform legend */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {Object.entries(PLATFORM_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[11px] text-[var(--alo-text-muted)]">{name}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-[var(--alo-text-muted)] uppercase py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-20 rounded-lg bg-[var(--alo-page)]/50" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === '2025-01-15';

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 rounded-lg border p-1 text-left transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-orange-400 bg-[var(--alo-cta-soft)]/50 shadow-sm'
                      : isToday
                      ? 'border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)]/30'
                      : 'border-[var(--alo-border)] hover:border-[var(--alo-border)] hover:bg-[var(--alo-page)]/50'
                  }`}
                >
                  <span className={`text-[11px] font-medium ${isToday ? 'text-[var(--alo-cta-active)] font-bold' : 'text-[var(--alo-body)]'}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[11px] leading-tight px-1 py-0.5 rounded truncate ${PLATFORM_COLORS[ev.platform]} text-white font-medium`}
                      >
                        {ev.title.length > 18 ? ev.title.slice(0, 18) + '...' : ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[11px] text-[var(--alo-text-muted)] px-1">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar: Selected date details + upcoming */}
      <div className="space-y-4">
        {/* Selected Date Details */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No events scheduled for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--alo-page)] border border-[var(--alo-border)]">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PLATFORM_COLORS[ev.platform]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--alo-text)] truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[var(--alo-text-muted)]">{ev.platform}</span>
                        <span className="text-[11px] text-[var(--alo-placeholder)]">•</span>
                        <span className="text-[11px] text-[var(--alo-text-muted)]">{ev.time}</span>
                        <Badge variant="outline" className="text-[11px] px-1 py-0">
                          {ev.type}
                        </Badge>
                      </div>
                    </div>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-6 w-6 p-0 text-[var(--alo-text-muted)] shrink-0">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">
              <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 py-1.5 group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--alo-page)] border border-[var(--alo-border)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[var(--alo-body)]">
                      {new Date(ev.date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[11px] text-[var(--alo-text-muted)] uppercase">
                      {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[var(--alo-body)] truncate group-hover:text-[var(--alo-cta-active)] transition-colors">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      {ev.platform} · {ev.time}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[var(--alo-placeholder)] group-hover:text-orange-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Drag hint */}
        <div className="rounded-lg border border-dashed border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)]/30 p-3 text-center">
          <Globe className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-[11px] text-[var(--alo-cta-active)] font-medium">Drag events to reschedule</p>
          <p className="text-[11px] text-orange-400">Visual drag & drop coming soon</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: Campaign Builder
// ============================================================

function CampaignBuilder() {
  const [form, setForm] = useState<BuilderForm>({
    name: '',
    goal: '',
    platforms: [],
    country: '',
    studentType: '',
    budgetRange: '',
    budget: '',
    startDate: '',
    endDate: '',
    contentRequirements: '',
    autoSchedule: false,
    notifyOnComplete: true,
  });

  const ALL_PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'WhatsApp', 'Website'];
  const GOALS = [
    'Increase Leads', 'Promote Course', 'Drive Events', 'Scholarship',
    'University Partner', 'B2B Partner', 'Visa Success Stories',
    'Deadline Reminder', 'Re-engage Leads', 'Boost Referral',
    'Promote IELTS/PTE', 'Promote Destination',
  ];
  const COUNTRIES = ['Bangladesh', 'All Countries', 'India', 'Nepal', 'Sri Lanka', 'Pakistan', 'Middle East'];
  const STUDENT_TYPES = ['Undergraduate', 'Graduate (MS/MA)', 'MBA', 'PhD', 'Diploma/Certificate', 'All Types'];
  const BUDGET_RANGES = ['Under ৳10,000', '৳10,000 – ৳50,000', '৳50,000 – ৳1,00,000', '৳1,00,000 – ৳3,00,000', 'Above ৳3,00,000'];

  function togglePlatform(platform: string) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  function updateField(field: keyof BuilderForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Builder Form */}
      <div className="lg:col-span-2 space-y-4">
        {/* Basic Info */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[var(--alo-cta)]" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Campaign Name</Label>
              <Input
                placeholder="e.g., UK Fall 2025 — Facebook Lead Gen"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Campaign Goal</Label>
              <Select value={form.goal} onValueChange={(v) => updateField('goal', v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Platform & Targeting */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--alo-brand)]" />
              Platform & Targeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-[var(--alo-body)] mb-2 block">Platforms (Multi-select)</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS.map((p) => {
                  const selected = form.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selected
                          ? 'border-orange-300 bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]'
                          : 'border-[var(--alo-border)] bg-white text-[var(--alo-text-muted)] hover:border-[var(--alo-border-strong)]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT_COLORS[p]}`} />
                      {p}
                      {selected && <span className="text-[var(--alo-cta)]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Target Country</Label>
                <Select value={form.country} onValueChange={(v) => updateField('country', v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Student Type</Label>
                <Select value={form.studentType} onValueChange={(v) => updateField('studentType', v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Budget Range</Label>
                <Select value={form.budgetRange} onValueChange={(v) => updateField('budgetRange', v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select range..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Schedule */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Budget & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Budget (BDT)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--alo-text-muted)] font-medium">৳</span>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={form.budget}
                  onChange={(e) => updateField('budget', e.target.value)}
                  className="h-9 text-sm pl-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Requirements */}
        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Content Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the content requirements, key messages, tone, creative direction, languages (Bangla/English), hashtags, CTA text, and any brand guidelines to follow..."
              value={form.contentRequirements}
              onChange={(e) => updateField('contentRequirements', e.target.value)}
              className="min-h-[120px] text-sm"
            />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.autoSchedule}
                  onCheckedChange={(v) => updateField('autoSchedule', v)}
                />
                <Label className="text-xs text-[var(--alo-body)]">Auto-schedule posts</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.notifyOnComplete}
                  onCheckedChange={(v) => updateField('notifyOnComplete', v)}
                />
                <Label className="text-xs text-[var(--alo-body)]">Notify on completion</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="">
            <Archive className="w-3.5 h-3.5 mr-1" />
            Save as Draft
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white">
            <ArrowRight className="w-3.5 h-3.5 mr-1" />
            Submit for Approval
          </Button>
        </div>
      </div>

      {/* Sidebar: Quick Info */}
      <div className="space-y-4">
        <Card className="border border-[var(--alo-border)] shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-3">Quick Tips</h4>
            <ul className="space-y-2">
              {[
                'Set a clear goal before creating a campaign',
                'Multi-platform campaigns reach more students',
                'Budget BDT 50K+ recommended for Facebook lead gen',
                'Use Bangla for Bangladesh targeting',
                'Schedule content 2 weeks in advance for approval',
                'Track ROI weekly for optimal performance',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-[var(--alo-body)] leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-[var(--alo-border)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_CAMPAIGNS.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[c.status]?.color.split(' ')[0] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[var(--alo-body)] truncate">{c.name}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">{c.platform} · {c.leads} leads</p>
                  </div>
                  <Badge variant="outline" className={`text-[11px] px-1.5 py-0 ${STATUS_CONFIG[c.status]?.color || ''}`}>
                    {STATUS_CONFIG[c.status]?.label || c.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Main Exported Component
// ============================================================

export default function CampaignBuilderCalendarView() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = MOCK_CAMPAIGNS.filter((c) => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-crm-page text-[var(--alo-text)]">Campaign Builder & Calendar</h1>
        <p className="text-body-sm text-[var(--alo-text-muted)] mt-1">
          Create, manage, and schedule marketing campaigns across all platforms for ALO Education.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="bg-[var(--alo-surface-muted)] p-0.5 h-9">
          <TabsTrigger value="campaigns" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-[var(--alo-cta-active)] data-[state=active]:shadow-sm">
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-[var(--alo-cta-active)] data-[state=active]:shadow-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="builder" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-[var(--alo-cta-active)] data-[state=active]:shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Campaign Builder
          </TabsTrigger>
        </TabsList>

        {/* ── Campaigns Tab ── */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* KPI Cards */}
          <KpiCards campaigns={MOCK_CAMPAIGNS} />

          {/* Filters */}
          <Card className="border border-[var(--alo-border)] shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--alo-text-muted)]" />
                  <span className="text-[11px] font-medium text-[var(--alo-text-muted)]">Filters:</span>
                </div>
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-56 text-xs"
                />
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {Object.keys(PLATFORM_COLORS).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
 variant="ghost"
 size="sm"
 className=" text-[11px] text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
 onClick={() => { setPlatformFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                >
                  Reset
                </Button>
                <div className="flex-1" />
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white ">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Table */}
          <CampaignTable campaigns={filteredCampaigns} />
        </TabsContent>

        {/* ── Calendar Tab ── */}
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView events={MOCK_CALENDAR_EVENTS} />
        </TabsContent>

        {/* ── Campaign Builder Tab ── */}
        <TabsContent value="builder" className="space-y-4">
          <CampaignBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
