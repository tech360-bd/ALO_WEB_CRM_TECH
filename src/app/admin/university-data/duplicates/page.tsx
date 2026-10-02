'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, GitMerge, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UniversityDuplicatesCenter() {
  const token = usePortalStore(state => state.token);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/university-data/duplicates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDuplicateGroups(json.duplicates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleMerge = async (masterId: string, duplicateId: string) => {
    if (!confirm('Merge duplicate university into master record? Associated courses will be safely reassigned.')) return;
    setMerging(true);
    try {
      const res = await fetch('/api/admin/university-data/duplicates/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ masterId, duplicateId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Records merged successfully! Provenance preserved.' });
        fetchDuplicates();
      } else {
        setMessage({ type: 'error', text: data.error || 'Merge failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#F97316] flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">University & Course Duplicate Engine</h1>
              <p className="text-gray-400 text-sm">Automated Similarity Matching & Non-Destructive Merge Resolution</p>
            </div>
          </div>
        </div>

        <Button onClick={fetchDuplicates} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Duplicate Pairs Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10">
          <CardTitle className="text-base font-semibold">Potential Duplicate Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-base font-semibold text-gray-300">Clean Database State</p>
              <p className="text-xs text-gray-500 mt-1">No duplicate universities or courses detected at current confidence threshold.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateGroups.map((group, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        {group.confidence || 90}% Match
                      </Badge>
                      <p className="font-semibold text-white">{group.masterName}</p>
                      <span className="text-gray-500">vs</span>
                      <p className="text-gray-300">{group.duplicateName}</p>
                    </div>
                    <p className="text-xs text-gray-400">Match Reason: {group.reason || 'Normalized name and country match'}</p>
                  </div>

                  <Button
                    onClick={() => handleMerge(group.masterId, group.duplicateId)}
                    disabled={merging}
                    className="bg-[#0B5ED7] hover:bg-[#0046a0] text-white flex items-center gap-2"
                  >
                    <GitMerge className="w-4 h-4" />
                    <span>Merge into Master</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
