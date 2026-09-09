'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Award, GraduationCap, Globe, DollarSign, Calendar, Filter } from 'lucide-react';

const COUNTRIES = ['All', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'Malaysia', 'New Zealand', 'Ireland', 'Netherlands'];

interface Scholarship {
  id: string; university: string; course: string; name: string; amount: number; currency: string;
  eligibility: string; deadline: string; level: string; country: string; status: string;
}

export default function CrmScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/crm/courses?level=Master%27s&limit=50').then(r => r.json()).catch(() => ({ data: [] })),
      fetch('/api/crm/courses?level=PhD&limit=50').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([masters, phd]) => {
      const items: Scholarship[] = [];
      const process = (data: any[], level: string) => {
        data.forEach((c: any) => {
          if (c.tuition > 0 && c.university) {
            items.push({
              id: c.courseId, university: c.university?.name || 'Unknown', course: c.courseTitle,
              name: `${c.university?.name?.split(' ').slice(0, 2).join(' ')} ${level === "Master's" ? 'International Merit' : 'PhD Research'} Scholarship`,
              amount: Math.round(c.tuition * (level === "Master's" ? 0.2 : 0.5)), currency: c.tuitionCurrency || 'GBP',
              eligibility: level === "Master's" ? 'Minimum 2:1 or equivalent GPA 3.3+' : 'Masters degree with research proposal',
              deadline: 'Rolling admissions', level, country: c.university?.country || 'Unknown', status: 'Active',
            });
          }
        });
      };
      process(masters?.data || [], "Master's");
      process(phd?.data || [], 'PhD');
      setScholarships(items.slice(0, 100));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => scholarships.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.university.toLowerCase().includes(search.toLowerCase()) || s.course.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === 'All' || s.country === countryFilter;
    const matchLevel = !levelFilter || s.level === levelFilter;
    return matchSearch && matchCountry && matchLevel;
  }), [scholarships, search, countryFilter, levelFilter]);

  const stats = useMemo(() => ({
    total: scholarships.length, active: scholarships.filter(s => s.status === 'Active').length,
    countries: new Set(scholarships.map(s => s.country)).size, avgAmount: scholarships.length ? Math.round(scholarships.reduce((s, x) => s + x.amount, 0) / scholarships.length) : 0,
  }), [scholarships]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Scholarships</h1><p className="text-gray-500">Browse and manage scholarship opportunities for students</p></div>
        <Button className="bg-orange-500 hover:bg-orange-600"><Award className="w-4 h-4 mr-2" />Add Scholarship</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Scholarships', value: stats.total, icon: Award, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: stats.active, icon: GraduationCap, color: 'text-green-600 bg-green-50' },
          { label: 'Countries', value: stats.countries, icon: Globe, color: 'text-amber-600 bg-amber-50' },
          { label: 'Avg. Award', value: `${stats.avgAmount.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search scholarships..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Levels</option>
          <option value="Master's">Master's</option>
          <option value="PhD">PhD</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-3 bg-gray-200 rounded w-2/3" /></div></CardContent></Card>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.slice(0, 24).map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.university}</p>
                  </div>
                  <Badge className={s.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}>{s.status}</Badge>
                </div>
                <p className="text-xs text-blue-600 font-medium">{s.course}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-lg font-bold text-orange-600"><DollarSign className="w-4 h-4" />{s.amount.toLocaleString()} <span className="text-xs text-gray-400 font-normal">{s.currency}</span></div>
                  <div className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{s.deadline}</div>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center gap-2 text-xs"><Globe className="w-3 h-3 text-gray-400" /><span>{s.country}</span><span className="text-gray-300">|</span><GraduationCap className="w-3 h-3 text-gray-400" /><span>{s.level}</span></div>
                  <p className="text-xs text-gray-500"><Filter className="w-3 h-3 inline mr-1" />{s.eligibility}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <Card><CardContent className="p-12 text-center text-gray-400"><Award className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No scholarships found</p></CardContent></Card>}
      {filtered.length > 24 && <div className="text-center py-4"><Button variant="outline">Load More ({filtered.length - 24} remaining)</Button></div>}
    </div>
  );
}