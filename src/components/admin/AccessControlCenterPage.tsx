'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Lock, Users, Package, Award, Sparkles, AlertCircle, CheckCircle2, Sliders, Database, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function AccessControlCenterPage() {
  const { token } = usePortalStore();
  const [activeTab, setActiveTab] = useState<'employees' | 'packages' | 'quotas' | 'audit'>('employees');
  const [loading, setLoading] = useState(true);

  // Data states
  const [packages, setPackages] = useState<any[]>([]);
  const [quotaRequests, setQuotaRequests] = useState<any[]>([]);

  const loadControlCenterData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/access-control-center', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPackages(json.packages || []);
        setQuotaRequests(json.quotaRequests || []);
      }
    } catch (err) {
      console.error('Failed to load access control center data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadControlCenterData();
  }, [loadControlCenterData]);

  const handleApproveQuotaRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/access-control-center', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Quota request approved!');
        loadControlCenterData();
      } else {
        toast.error(json.error || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6">
      {/* Control Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Super Admin Master Access Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage ALO employee designations, private HR privacy, B2B partner packages, seat limits, and marketing quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">SUPER_ADMIN ONLY</Badge>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === 'employees' ? 'brand' : 'ghost'}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab('employees')}
        >
          <Users className="w-3.5 h-3.5 mr-1" /> ALO Employee Roles &amp; Privacy
        </Button>
        <Button
          variant={activeTab === 'packages' ? 'brand' : 'ghost'}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab('packages')}
        >
          <Package className="w-3.5 h-3.5 mr-1" /> B2B Partner Packages
        </Button>
        <Button
          variant={activeTab === 'quotas' ? 'brand' : 'ghost'}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab('quotas')}
        >
          <Sliders className="w-3.5 h-3.5 mr-1" /> Quotas &amp; Seat Requests
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'brand' : 'ghost'}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab('audit')}
        >
          <Key className="w-3.5 h-3.5 mr-1" /> Audit &amp; Privacy Rules
        </Button>
      </div>

      {/* TAB 1: EMPLOYEE ROLES & DESIGNATION PRIVACY */}
      {activeTab === 'employees' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">ALO Employee Designations &amp; Privacy Protection</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Only Employee, Super Admin, Chairman, and authorized HR Manager can view private profile data (Salary, Emergency Contact, NID/Passport, Bank details, HR docs).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                'Chairman', 'CEO', 'Director', 'Office Manager', 'Country Manager', 'Counselor',
                'Senior Counselor', 'Application Manager', 'Application Team', 'Visa Officer',
                'Finance Officer', 'Marketing Manager', 'Marketing Officer', 'Front Desk', 'HR Manager', 'Support Staff'
              ].map((role) => (
                <div key={role} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{role}</span>
                  <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-700">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: B2B PARTNER PACKAGES */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <Badge className="w-max text-[10px] bg-slate-100 text-slate-800">STARTER PARTNER</Badge>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">Starter Package</CardTitle>
              <CardDescription className="text-xs">Entry-level partner setup</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2 text-slate-600">
              <p>• 1 Super Admin + 2 Employee Seats</p>
              <p>• 15 Images / month</p>
              <p>• 10 Videos / month (30s max)</p>
              <p>• 3 English Mock Test Vouchers per student</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-indigo-200 shadow-xs">
            <CardHeader className="pb-2">
              <Badge className="w-max text-[10px] bg-indigo-100 text-indigo-800">GROWTH PARTNER</Badge>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">Growth Package</CardTitle>
              <CardDescription className="text-xs">Expanded capacity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2 text-slate-600">
              <p>• Custom Employee Seats</p>
              <p>• 50 Images / month</p>
              <p>• 30 Videos / month</p>
              <p>• Dedicated Landing Page</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 shadow-xs">
            <CardHeader className="pb-2">
              <Badge className="w-max text-[10px] bg-purple-100 text-purple-800">PREMIUM PARTNER</Badge>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">Premium Package</CardTitle>
              <CardDescription className="text-xs">Enterprise tier</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2 text-slate-600">
              <p>• Unlimited Employee Seats</p>
              <p>• Custom Marketing Quotas</p>
              <p>• Priority ALO Support</p>
              <p>• Advanced B2B Analytics</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: QUOTAS & SEAT REQUESTS */}
      {activeTab === 'quotas' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Partner Extra Seat &amp; Quota Requests</CardTitle>
            <CardDescription className="text-xs text-slate-500">Super Admin approval queue for seat expansion and extra marketing assets.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Partner</TableHead>
                  <TableHead className="text-xs font-semibold">Request Type</TableHead>
                  <TableHead className="text-xs font-semibold">Current / Requested</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotaRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">
                      No pending quota or seat requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotaRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-xs font-bold text-slate-800">{req.partnerId}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{req.requestType}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-600">{req.currentLimit} &rarr; {req.requestedLimit}</TableCell>
                      <TableCell className="text-xs text-slate-500">{req.reason || 'Team expansion'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {req.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleApproveQuotaRequest(req.id)}>
                            Approve Request
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: AUDIT & PRIVACY RULES */}
      {activeTab === 'audit' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Privacy Enforcement &amp; Audit Trail Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Salary &amp; HR document view attempts automatically logged to audit trail.</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>B2B application routing restricts partner visibility to own students only.</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
