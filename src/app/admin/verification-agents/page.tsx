'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Play, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { runWeeklyUniversityVerificationAgent, VerificationAgentRunResult } from '@/lib/verification-agent';

export default function VerificationAgentsRoute() {
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<VerificationAgentRunResult | null>(null);

  const handleRunNow = async () => {
    setRunning(true);
    const result = await runWeeklyUniversityVerificationAgent([
      { universityId: 'UNI-001', universityName: 'University of Oxford', officialSourceUrl: 'https://www.oxford.ac.uk/courses' },
      { universityId: 'UNI-002', universityName: 'University of Cambridge', officialSourceUrl: 'https://www.cam.ac.uk/courses' },
    ]);
    setRunResult(result);
    setRunning(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Weekly AI University Verification Agent</h1>
          <p className="text-xs text-[var(--alo-text-muted)] mt-1">
            Agent: <strong className="text-[var(--alo-text)]">UniversityCourseVerificationAgent</strong> • Schedule: Weekly (Asia/Dhaka)
          </p>
        </div>
        <Button onClick={handleRunNow} disabled={running} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-semibold rounded-xl flex items-center gap-1.5">
          <Play className="w-4 h-4" /> {running ? 'Agent Inspecting Sources...' : 'Trigger Verification Agent Now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[var(--alo-text-muted)] font-medium">Scheduled Frequency</span>
          <p className="text-lg font-bold text-[var(--alo-text)]">Every Sunday at 00:00 (Asia/Dhaka)</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[var(--alo-text-muted)] font-medium">Domain Rate Limit</span>
          <p className="text-lg font-bold text-[var(--alo-text)]">Max 2 requests/sec per domain</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[var(--alo-text-muted)] font-medium">Robots.txt Policy</span>
          <p className="text-lg font-bold text-emerald-600">100% Lawful & Compliant</p>
        </Card>
      </div>

      {runResult && (
        <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-3 text-xs">
          <h3 className="font-bold text-[var(--alo-text)] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verification Agent Run Summary
          </h3>
          <p><strong>Run ID:</strong> {runResult.runId}</p>
          <p><strong>Sources Inspected:</strong> {runResult.sourcesChecked}</p>
          <p><strong>Hash Changes Detected:</strong> {runResult.contentHashChangesDetected}</p>
          <p><strong>Proposed Approval Items Created:</strong> {runResult.proposedChanges.length}</p>

          <div className="p-3 rounded-[12px] border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] font-mono text-[11px] leading-5 text-[var(--alo-text)] space-y-1 overflow-x-auto">
            {runResult.agentLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
