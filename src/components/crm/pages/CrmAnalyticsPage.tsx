'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Target,
  DollarSign, Globe, GraduationCap, Calendar, ArrowUpRight,
  ArrowDownRight, Download, Filter, ChevronDown, PieChart,
  Activity, School, MapPin, Award, Briefcase,
} from 'lucide-react';

interface DateRange {
  label: string;
  value: string;
}

interface KpiCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  prefix?: string;
}

interface LeadSource {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface CountryData {
  country: string;
  flag: string;
  students: number;
  percentage: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  leads: number;
  conversions: number;
  revenue: number;
}

interface UniversityRow {
  rank: number;
  name: string;
  country: string;
  applications: number;
  offers: number;
  acceptanceRate: number;
}

interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const dateRanges: DateRange[] = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const kpiData: KpiCard[] = [
  { label: 'Total Leads', value: '2,847', change: '+12.5%', trend: 'up', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { label: 'Conversion Rate', value: '34.2%', change: '+2.1%', trend: 'up', icon: Target, color: 'text-green-600 bg-green-100' },
  { label: 'Active Students', value: '1,256', change: '+8.3%', trend: 'up', icon: GraduationCap, color: 'text-orange-600 bg-orange-100' },
  { label: 'Revenue', value: '$1,234,567', change: '+15.7%', trend: 'up', icon: DollarSign, color: 'text-purple-600 bg-purple-100' },
];

const leadSources: LeadSource[] = [
  { name: 'Website', count: 892, percentage: 31.3, color: 'bg-blue-600' },
  { name: 'Social Media', count: 645, percentage: 22.7, color: 'bg-pink-500' },
  { name: 'Referrals', count: 534, percentage: 18.8, color: 'bg-green-500' },
  { name: 'Events/Fairs', count: 398, percentage: 14.0, color: 'bg-orange-500' },
  { name: 'Walk-in', count: 234, percentage: 8.2, color: 'bg-purple-500' },
  { name: 'WhatsApp', count: 144, percentage: 5.1, color: 'bg-emerald-500' },
];

const countryData: CountryData[] = [
  { country: 'United Kingdom', flag: '🇬🇧', students: 856, percentage: 42.3, color: 'bg-blue-600' },
  { country: 'Australia', flag: '🇦🇺', students: 324, percentage: 16.0, color: 'bg-yellow-500' },
  { country: 'Canada', flag: '🇨🇦', students: 278, percentage: 13.7, color: 'bg-red-500' },
  { country: 'USA', flag: '🇺🇸', students: 234, percentage: 11.6, color: 'bg-blue-500' },
  { country: 'Germany', flag: '🇩🇪', students: 156, percentage: 7.7, color: 'bg-gray-700' },
  { country: 'New Zealand', flag: '🇳🇿', students: 98, percentage: 4.8, color: 'bg-emerald-600' },
  { country: 'Ireland', flag: '🇮🇪', students: 78, percentage: 3.9, color: 'bg-green-600' },
];

const monthlyTrends: MonthlyTrend[] = [
  { month: 'Jan', leads: 245, conversions: 78, revenue: 85400 },
  { month: 'Feb', leads: 312, conversions: 95, revenue: 102300 },
  { month: 'Mar', leads: 289, conversions: 88, revenue: 97600 },
  { month: 'Apr', leads: 334, conversions: 112, revenue: 118500 },
  { month: 'May', leads: 378, conversions: 128, revenue: 134200 },
  { month: 'Jun', leads: 425, conversions: 145, revenue: 152800 },
  { month: 'Jul', leads: 398, conversions: 138, revenue: 145600 },
  { month: 'Aug', leads: 456, conversions: 156, revenue: 167400 },
  { month: 'Sep', leads: 512, conversions: 178, revenue: 189200 },
  { month: 'Oct', leads: 478, conversions: 165, revenue: 178300 },
  { month: 'Nov', leads: 434, conversions: 148, revenue: 156700 },
  { month: 'Dec', leads: 389, conversions: 132, revenue: 142500 },
];

const topUniversities: UniversityRow[] = [
  { rank: 1, name: 'University of Manchester', country: 'UK', applications: 234, offers: 189, acceptanceRate: 80.8 },
  { rank: 2, name: 'University of Edinburgh', country: 'UK', applications: 198, offers: 156, acceptanceRate: 78.8 },
  { rank: 3, name: 'University of Birmingham', country: 'UK', applications: 178, offers: 145, acceptanceRate: 81.5 },
  { rank: 4, name: 'University of Leeds', country: 'UK', applications: 167, offers: 134, acceptanceRate: 80.2 },
  { rank: 5, name: 'Monash University', country: 'Australia', applications: 145, offers: 112, acceptanceRate: 77.2 },
  { rank: 6, name: 'University of Glasgow', country: 'UK', applications: 134, offers: 109, acceptanceRate: 81.3 },
  { rank: 7, name: 'University of Nottingham', country: 'UK', applications: 123, offers: 98, acceptanceRate: 79.7 },
  { rank: 8, name: 'University of Toronto', country: 'Canada', applications: 112, offers: 78, acceptanceRate: 69.6 },
];

const funnelStages: FunnelStage[] = [
  { label: 'Inquiry', count: 2847, percentage: 100, color: 'bg-blue-600' },
  { label: 'Consultation', count: 2134, percentage: 75, color: 'bg-blue-500' },
  { label: 'Application', count: 1567, percentage: 55, color: 'bg-orange-500' },
  { label: 'Offer Received', count: 1123, percentage: 39.4, color: 'bg-yellow-500' },
  { label: 'Visa Approved', count: 974, percentage: 34.2, color: 'bg-green-500' },
  { label: 'Enrolled', count: 856, percentage: 30.1, color: 'bg-emerald-600' },
];

function formatRevenue(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export default function CrmAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const maxLeads = Math.max(...monthlyTrends.map(m => m.leads));
  const maxRevenue = Math.max(...monthlyTrends.map(m => m.revenue));
  const maxFunnel = funnelStages[0].count;

  const totalLeadCount = leadSources.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Comprehensive performance dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {dateRanges.find(d => d.value === dateRange)?.label || 'Last 30 Days'}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showDateDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50 py-1">
                {dateRanges.map(dr => (
                  <button
                    key={dr.value}
                    onClick={() => { setDateRange(dr.value); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${dateRange === dr.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                  >
                    {dr.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiData.map(kpi => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{kpi.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: Lead Sources + Country Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Sources Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Lead Sources
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{totalLeadCount} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {leadSources.map(source => (
              <div key={source.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{source.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{source.count}</span>
                    <span className="text-xs text-gray-400">({source.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${source.color} flex items-center justify-end pr-2 transition-all duration-500`}
                    style={{ width: `${source.percentage}%` }}
                  >
                    {source.percentage > 12 && (
                      <span className="text-[10px] text-white font-medium">{source.percentage}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                Country Distribution
              </CardTitle>
              <Badge variant="secondary" className="text-xs">2,024 students</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Visual Bar Representation */}
            <div className="flex h-4 rounded-full overflow-hidden mb-4">
              {countryData.map(c => (
                <div
                  key={c.country}
                  className={`${c.color} transition-all duration-500`}
                  style={{ width: `${c.percentage}%` }}
                  title={`${c.flag} ${c.country}: ${c.students} (${c.percentage}%)`}
                />
              ))}
            </div>
            <div className="space-y-2">
              {countryData.map(c => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-lg">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-gray-700">{c.country}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{c.students}</span>
                        <span className="text-xs text-gray-400">{c.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.color} transition-all duration-500`}
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends - Line Chart using styled divs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Monthly Trends
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-xs text-gray-500">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Conversions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-500">Revenue</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Y-axis labels and grid */}
            <div className="flex">
              <div className="w-12 flex flex-col justify-between text-[10px] text-gray-400 pr-2 text-right">
                <span>{maxLeads}</span>
                <span>{Math.round(maxLeads * 0.75)}</span>
                <span>{Math.round(maxLeads * 0.5)}</span>
                <span>{Math.round(maxLeads * 0.25)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 relative">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
                  <div
                    key={fraction}
                    className="border-b border-gray-100 absolute w-full"
                    style={{ bottom: `${fraction * 100}%` }}
                  />
                ))}
                {/* Bars container */}
                <div className="flex items-end gap-1 h-48 pt-4">
                  {monthlyTrends.map(trend => (
                    <div key={trend.month} className="flex-1 flex flex-col items-center gap-0.5 group">
                      <div className="w-full flex gap-0.5 items-end h-44" style={{ justifyContent: 'center' }}>
                        {/* Revenue bar (orange) */}
                        <div
                          className="w-2.5 bg-orange-500 rounded-t transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer"
                          style={{ height: `${(trend.revenue / maxRevenue) * 100}%` }}
                          title={`${trend.month}: ${formatRevenue(trend.revenue)}`}
                        />
                        {/* Leads bar (blue) */}
                        <div
                          className="w-2.5 bg-blue-600 rounded-t transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer"
                          style={{ height: `${(trend.leads / maxLeads) * 100}%` }}
                          title={`${trend.month}: ${trend.leads} leads`}
                        />
                        {/* Conversions bar (green) */}
                        <div
                          className="w-2.5 bg-green-500 rounded-t transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer"
                          style={{ height: `${(trend.conversions / maxLeads) * 100}%` }}
                          title={`${trend.month}: ${trend.conversions} conversions`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">{trend.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom: Top Universities + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Universities Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Top Universities</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500">#</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">University</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Country</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500">Apps</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500">Offers</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topUniversities.map(uni => (
                    <tr key={uni.rank} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="text-center px-3 py-2.5">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${uni.rank <= 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {uni.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{uni.name}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="text-[10px]">{uni.country}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm text-gray-700">{uni.applications}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-medium text-green-700">{uni.offers}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${uni.acceptanceRate >= 80 ? 'bg-green-500' : uni.acceptanceRate >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                              style={{ width: `${uni.acceptanceRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{uni.acceptanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelStages.map((stage, index) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-24 text-right">
                    <p className="text-xs font-medium text-gray-700">{stage.label}</p>
                    <p className="text-sm font-bold text-gray-900">{stage.count.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className={`h-10 rounded-lg ${stage.color} flex items-center px-3 transition-all duration-700 relative overflow-hidden`}
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                      <span className="text-white text-xs font-semibold relative z-10">{stage.percentage}%</span>
                    </div>
                    {index < funnelStages.length - 1 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                        ↓ {((1 - stage.count / (funnelStages[index]?.count || 1)) * 100).toFixed(0)}% drop
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel Summary */}
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-700">3.3x</p>
                <p className="text-[10px] text-gray-500">Inquiry to Application</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="text-lg font-bold text-orange-700">71.7%</p>
                <p className="text-[10px] text-gray-500">Application to Offer</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-700">86.7%</p>
                <p className="text-[10px] text-gray-500">Visa Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Sparkline Row */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Revenue Trend
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 text-xs">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +15.7% vs last period
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-20">
            {monthlyTrends.map((trend, i) => {
              const maxRev = Math.max(...monthlyTrends.map(m => m.revenue));
              const height = (trend.revenue / maxRev) * 100;
              return (
                <div key={trend.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatRevenue(trend.revenue)}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${i === monthlyTrends.length - 1 ? 'bg-green-500' : 'bg-green-300 hover:bg-green-400'}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-gray-500">{trend.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
