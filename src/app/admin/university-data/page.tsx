'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GraduationCap, BookOpen, Globe2, ShieldCheck, RefreshCw, Search,
  ExternalLink, CheckCircle2, AlertTriangle, Plus, Eye, Filter, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function UniversityDataCenterPage() {
  const token = usePortalStore(state => state.token);
  const [activeTab, setActiveTab] = useState<'universities' | 'courses'>('universities');
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'universities') {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (countryFilter !== 'all') params.set('country', countryFilter);
        const res = await fetch(`/api/universities?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setUniversities(json.universities || []);
        }
      } else {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (countryFilter !== 'all') params.set('country', countryFilter);
        const res = await fetch(`/api/courses?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setCourses(json.courses || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, countryFilter, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-page)] min-h-screen text-[var(--alo-text)]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--alo-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[var(--alo-text)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">University & Course Data Center</h1>
              <p className="text-[var(--alo-text-muted)] text-sm">Master Catalog for Course Finder, Country Pages, CRM, and AI Agents</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/university-data/updates">
            <Button variant="outline" className="border-[var(--alo-border)] text-[var(--alo-placeholder)] hover:text-[var(--alo-text)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-crm-success-text" />
              <span>Weekly AI Updates</span>
            </Button>
          </Link>
          <Link href="/admin/university-data/duplicates">
            <Button variant="outline" className="border-[var(--alo-border)] text-[var(--alo-placeholder)] hover:text-[var(--alo-text)] flex items-center gap-2">
              <Filter className="w-4 h-4 text-crm-warning-text" />
              <span>Duplicate Center</span>
            </Button>
          </Link>
          <Button onClick={fetchData} variant="outline" className="border-[var(--alo-border)] text-[var(--alo-placeholder)] hover:text-[var(--alo-text)]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--alo-border)] gap-2">
        <button
          onClick={() => { setActiveTab('universities'); setSearch(''); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'universities' ? 'border-[var(--alo-brand)] text-[var(--alo-text)]' : 'border-transparent text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]'
          }`}
        >
          Universities ({universities.length})
        </button>
        <button
          onClick={() => { setActiveTab('courses'); setSearch(''); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'courses' ? 'border-[var(--alo-brand)] text-[var(--alo-text)]' : 'border-transparent text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]'
          }`}
        >
          Courses ({courses.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" />
          <Input
            placeholder={activeTab === 'universities' ? 'Search universities, city, country...' : 'Search course title, discipline...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)] placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl px-4 py-2 text-sm text-[var(--alo-placeholder)] focus:outline-none focus:border-[var(--alo-brand)]"
          >
            <option value="all">All Countries</option>
            <option value="UK">United Kingdom</option>
            <option value="USA">United States</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Ireland">Ireland</option>
            <option value="Germany">Germany</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === 'universities' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--alo-border)] text-left text-[var(--alo-text-muted)] bg-[var(--alo-surface-muted)]">
                    <th className="p-3 font-medium">University</th>
                    <th className="p-3 font-medium">Country & City</th>
                    <th className="p-3 font-medium">Ranking</th>
                    <th className="p-3 font-medium">Courses</th>
                    <th className="p-3 font-medium">Verification</th>
                    <th className="p-3 font-medium">Official Source</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {universities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--alo-text-muted)]">
                        No universities found.
                      </td>
                    </tr>
                  ) : (
                    universities.map(u => (
                      <tr key={u.id} className="border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                        <td className="p-3 font-semibold text-[var(--alo-text)]">{u.name}</td>
                        <td className="p-3 text-[var(--alo-placeholder)]">{u.country}{u.city ? `, ${u.city}` : ''}</td>
                        <td className="p-3 font-mono text-xs text-[var(--alo-info-text)]">#{u.ranking || u.worldRanking || 'N/A'}</td>
                        <td className="p-3 text-[var(--alo-placeholder)]">{u._count?.courses || u.courses?.length || 0}</td>
                        <td className="p-3">
                          <Badge className={
                            u.verificationStatus === 'HUMAN_APPROVED' || u.status === 'active'
                              ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border'
                              : 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border'
                          }>
                            {u.verificationStatus || u.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-[var(--alo-info-text)]">
                          {u.website || u.officialUrl ? (
                            <a href={u.website || u.officialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                              <span>Website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[var(--alo-text-muted)]">No URL</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="text-[var(--alo-placeholder)] hover:text-[var(--alo-text)]">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--alo-border)] text-left text-[var(--alo-text-muted)] bg-[var(--alo-surface-muted)]">
                    <th className="p-3 font-medium">Course Title</th>
                    <th className="p-3 font-medium">University</th>
                    <th className="p-3 font-medium">Level</th>
                    <th className="p-3 font-medium">Duration</th>
                    <th className="p-3 font-medium">Tuition Fee</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--alo-text-muted)]">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    courses.map(c => (
                      <tr key={c.id} className="border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                        <td className="p-3 font-semibold text-[var(--alo-text)]">{c.courseTitle}</td>
                        <td className="p-3 text-[var(--alo-placeholder)]">{c.university?.name || c.universityId}</td>
                        <td className="p-3 text-xs text-[var(--alo-info-text)]">{c.studyLevel || c.programLevel || 'Undergraduate'}</td>
                        <td className="p-3 text-xs text-[var(--alo-text-muted)]">{c.durationMonths ? `${c.durationMonths} Mos` : 'N/A'}</td>
                        <td className="p-3 font-mono text-xs text-crm-success-text">
                          {c.intakeFees?.[0]?.yearlyTuition ? `${c.intakeFees[0].tuitionCurrency || '£'} ${c.intakeFees[0].yearlyTuition.toLocaleString()}` : 'Contact for fee'}
                        </td>
                        <td className="p-3">
                          <Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border">
                            {c.status || 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="text-[var(--alo-placeholder)] hover:text-[var(--alo-text)]">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
