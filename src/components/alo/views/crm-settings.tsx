"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon, PageHeader, SectionCard } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

const OFFICE_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_OFFICE_DAYS = OFFICE_DAY_NAMES.map((_, dayOfWeek) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
  isWorkDay: [0, 1, 2, 3, 4, 6].includes(dayOfWeek),
  afterHoursAiAuto: true,
}));

export function CrmSettings() {
  const { toast } = useToast();

  const [sla, setSla] = React.useState({
    firstResponse: "15",
    followUp: "60",
    escalation40: "40",
    escalation50: "50",
  });

  const [officeHours, setOfficeHours] = React.useState({
    days: DEFAULT_OFFICE_DAYS,
    timeZone: 'Asia/Dhaka',
    canManage: false,
    legacyReview: false,
    scheduleConflict: false,
    loading: true,
    saving: false,
  });

  const [scoring, setScoring] = React.useState({
    emailProvided: 10,
    phoneProvided: 10,
    preferredCountrySet: 15,
    englishScoreSet: 20,
    budgetAbove2k: 25,
    immediateIntake: 20,
    hotTier: 80,
    urgentTier: 90,
  });

  const [assignment, setAssignment] = React.useState({
    mode: "ROUND_ROBIN",
    respectCapacity: true,
    maxStudentsPerCounselor: 50,
    assignByLanguage: false,
    assignByCountry: true,
    autoEscalateAfter: "48",
  });

  const [autoReply, setAutoReply] = React.useState({
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
    aiAssist: true,
    requireHumanApproval: true,
  });

  React.useEffect(() => {
    let active = true;
    const loadOfficeHours = async () => {
      try {
        const response = await fetch('/api/crm/ucc/office-hours', { cache: 'no-store', credentials: 'include' });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) throw new Error(payload?.error || `Office hours unavailable (HTTP ${response.status})`);
        const rows = Array.isArray(payload.officeHours) ? payload.officeHours : [];
        const byDay = new Map<number, (typeof DEFAULT_OFFICE_DAYS)[number]>();
        for (const row of rows) {
          if (Number.isInteger(row?.dayOfWeek) && row.dayOfWeek >= 0 && row.dayOfWeek <= 6) {
            byDay.set(row.dayOfWeek, {
              dayOfWeek: row.dayOfWeek,
              startTime: typeof row.startTime === 'string' ? row.startTime : '09:00',
              endTime: typeof row.endTime === 'string' ? row.endTime : '18:00',
              isWorkDay: row.isWorkDay === true,
              afterHoursAiAuto: row.afterHoursAiAuto !== false,
            });
          }
        }
        if (active) setOfficeHours((current) => ({
          ...current,
          days: DEFAULT_OFFICE_DAYS.map((day) => byDay.get(day.dayOfWeek) || day),
          timeZone: typeof payload.timezone === 'string' ? payload.timezone : 'Asia/Dhaka',
          canManage: payload.canManageOfficeHours === true,
          legacyReview: payload.legacyDefaultReviewRequired === true,
          scheduleConflict: payload.scheduleConflict === true,
          loading: false,
        }));
      } catch (error) {
        if (active) {
          setOfficeHours((current) => ({ ...current, loading: false }));
          toast({ title: 'Office-hours schedule could not be loaded', description: error instanceof Error ? error.message : 'Try again later.', variant: 'destructive' });
        }
      }
    };
    void loadOfficeHours();
    return () => { active = false; };
  }, [toast]);

  const updateOfficeDay = (dayOfWeek: number, patch: Partial<(typeof DEFAULT_OFFICE_DAYS)[number]>) => {
    setOfficeHours((current) => ({
      ...current,
      days: current.days.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day),
    }));
  };

  const saveOfficeHours = async () => {
    if (!officeHours.days.some((day) => day.isWorkDay)) {
      toast({ title: 'A business day is required', description: 'Keep at least one day open so SLA deadlines can be scheduled safely.', variant: 'destructive' });
      return;
    }
    setOfficeHours((current) => ({ ...current, saving: true }));
    try {
      const response = await fetch('/api/crm/ucc/office-hours', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ schedule: officeHours.days.map(({ dayOfWeek, startTime, endTime, isWorkDay, afterHoursAiAuto }) => ({ dayOfWeek, startTime, endTime, isWorkDay, afterHoursAiAuto })) }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Office hours could not be saved (HTTP ${response.status})`);
      setOfficeHours((current) => ({ ...current, legacyReview: false, scheduleConflict: false }));
      toast({ title: 'Office-hours schedule saved', description: `${officeHours.timeZone} · persisted schedule updated; no messages were sent.` });
    } catch (error) {
      toast({ title: 'Office-hours schedule was not saved', description: error instanceof Error ? error.message : 'Try again later.', variant: 'destructive' });
    } finally {
      setOfficeHours((current) => ({ ...current, saving: false }));
    }
  };

  const handleSave = (section: string) => {
    toast({
      title: `${section} settings saved`,
      description: "Changes are stored locally in this preview.",
    });
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="CRM Settings"
        subtitle="Configure SLA timers, office hours, lead scoring, and assignment rules"
        icon="Settings2"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SLA Times */}
        <SectionCard
          title="SLA Times"
          description="Set response time targets and escalation thresholds"
          icon="Timer"
          action={
            <Button
              size="sm"
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
              onClick={() => handleSave("SLA")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">First Response (min)</Label>
                <Input
                  type="number"
                  value={sla.firstResponse}
                  onChange={(e) => setSla({ ...sla, firstResponse: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Follow-up Window (min)</Label>
                <Input
                  type="number"
                  value={sla.followUp}
                  onChange={(e) => setSla({ ...sla, followUp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Escalation Level 40% (hrs)</Label>
                <Input
                  type="number"
                  value={sla.escalation40}
                  onChange={(e) => setSla({ ...sla, escalation40: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Escalation Level 50% (hrs)</Label>
                <Input
                  type="number"
                  value={sla.escalation50}
                  onChange={(e) => setSla({ ...sla, escalation50: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="rounded-lg bg-[var(--alo-brand-light)] p-3 text-xs text-[var(--alo-brand)]">
              <Icon name="Info" className="mr-1 inline size-3.5" />
              Escalations notify the counselor's manager and senior leadership.
            </div>
          </div>
        </SectionCard>

        {/* Office Hours */}
        <SectionCard
          title="Office Hours"
          description="Persist the Asia/Dhaka schedule used for follow-up and business-time SLA calculations"
          icon="Clock"
          action={
            <Button
              size="sm"
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
              onClick={() => void saveOfficeHours()}
              disabled={officeHours.loading || officeHours.saving || !officeHours.canManage}
            >
              {officeHours.saving ? 'Saving…' : 'Save'}
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--alo-brand-light)] p-3 text-xs text-[var(--alo-brand)]">
              <span><Icon name="Info" className="mr-1 inline size-3.5" />Default: Saturday–Thursday, 09:00–18:00; Friday closed.</span>
              <Badge variant="outline">{officeHours.timeZone}</Badge>
            </div>
            {officeHours.scheduleConflict && (
              <p className="rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-xs text-crm-warning-text">
                Stored weekday rows conflict. Automatic after-hours acknowledgements remain disabled until an authorized administrator reviews and saves the schedule. Saving updates existing weekday rows in place; no schedule records are deleted.
              </p>
            )}
            {officeHours.legacyReview && (
              <p className="rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-xs text-crm-warning-text">
                The saved schedule matches the previous 10:00–19:00 default. It has not been changed automatically; review the intended hours and save to adopt the current 09:00–18:00 fallback.
              </p>
            )}
            {officeHours.loading ? (
              <p className="py-4 text-sm text-[var(--alo-text-muted)]">Loading the persisted office-hours schedule…</p>
            ) : (
              <div className="space-y-2">
                {officeHours.days.map((day) => (
                  <div key={day.dayOfWeek} className="grid grid-cols-[1fr_auto_1fr_1fr_auto] items-center gap-2 rounded-lg border border-[var(--alo-border)] p-2">
                    <Label className="text-xs font-medium">{OFFICE_DAY_NAMES[day.dayOfWeek]}</Label>
                    <Switch
                      checked={day.isWorkDay}
                      onCheckedChange={(isWorkDay) => updateOfficeDay(day.dayOfWeek, { isWorkDay })}
                      disabled={officeHours.saving || !officeHours.canManage}
                      aria-label={`${OFFICE_DAY_NAMES[day.dayOfWeek]} is a business day`}
                    />
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(event) => updateOfficeDay(day.dayOfWeek, { startTime: event.target.value })}
                      disabled={!day.isWorkDay || officeHours.saving || !officeHours.canManage}
                      aria-label={`${OFFICE_DAY_NAMES[day.dayOfWeek]} opening time`}
                    />
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(event) => updateOfficeDay(day.dayOfWeek, { endTime: event.target.value })}
                      disabled={!day.isWorkDay || officeHours.saving || !officeHours.canManage}
                      aria-label={`${OFFICE_DAY_NAMES[day.dayOfWeek]} closing time`}
                    />
                    <Switch
                      checked={day.afterHoursAiAuto}
                      onCheckedChange={(afterHoursAiAuto) => updateOfficeDay(day.dayOfWeek, { afterHoursAiAuto })}
                      disabled={officeHours.saving || !officeHours.canManage}
                      aria-label={`${OFFICE_DAY_NAMES[day.dayOfWeek]} after-hours reply draft enabled`}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-2 px-2 text-[11px] text-[var(--alo-text-muted)]">
                  <span />
                  <span>Open</span>
                  <span>Start</span>
                  <span>End</span>
                  <span>Reply draft</span>
                </div>
              </div>
            )}
            <p className="text-[11px] text-[var(--alo-text-muted)]">After-hours reply drafts are not sent automatically by this settings screen. Human review and provider configuration remain separate.</p>
          </div>
        </SectionCard>

        {/* Lead Scoring Rules */}
        <SectionCard
          title="Lead Scoring Rules"
          description="Configure points assigned to lead attributes"
          icon="Target"
          action={
            <Button
              size="sm"
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
              onClick={() => handleSave("Scoring")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-2">
            {[
              { key: "emailProvided", label: "Email provided", value: scoring.emailProvided },
              { key: "phoneProvided", label: "Phone provided", value: scoring.phoneProvided },
              {
                key: "preferredCountrySet",
                label: "Preferred country selected",
                value: scoring.preferredCountrySet,
              },
              {
                key: "englishScoreSet",
                label: "English score submitted",
                value: scoring.englishScoreSet,
              },
              {
                key: "budgetAbove2k",
                label: "Budget > 2,000 BDT/month",
                value: scoring.budgetAbove2k,
              },
              {
                key: "immediateIntake",
                label: "Immediate intake (within 3 months)",
                value: scoring.immediateIntake,
              },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between">
                <span className="text-sm text-[var(--alo-text)]">{row.label}</span>
                <Input
                  type="number"
                  className="w-20"
                  value={row.value}
                  onChange={(e) =>
                    setScoring({ ...scoring, [row.key]: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-[var(--alo-page)] p-3">
              <div>
                <p className="text-xs text-[var(--alo-text-muted)]">Hot Lead Threshold</p>
                <Badge className="mt-1 bg-[var(--alo-cta)] text-white">≥ {scoring.hotTier}</Badge>
              </div>
              <div>
                <p className="text-xs text-[var(--alo-text-muted)]">Urgent Threshold</p>
                <Badge className="mt-1 bg-[var(--alo-error)] text-white">≥ {scoring.urgentTier}</Badge>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Assignment Rules */}
        <SectionCard
          title="Assignment Rules"
          description="Define how new leads are routed to counselors"
          icon="Users"
          action={
            <Button
              size="sm"
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
              onClick={() => handleSave("Assignment")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[var(--alo-text-muted)]">Assignment Mode</Label>
              <Select
                value={assignment.mode}
                onValueChange={(v) => setAssignment({ ...assignment, mode: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                  <SelectItem value="LEAST_LOAD">Least Loaded</SelectItem>
                  <SelectItem value="LANGUAGE_MATCH">Language Match</SelectItem>
                  <SelectItem value="COUNTRY_EXPERT">Country Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Respect counselor capacity</Label>
              <Switch
                checked={assignment.respectCapacity}
                onCheckedChange={(v) =>
                  setAssignment({ ...assignment, respectCapacity: v })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--alo-text-muted)]">
                Max Students per Counselor
              </Label>
              <Input
                type="number"
                value={assignment.maxStudentsPerCounselor}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    maxStudentsPerCounselor: parseInt(e.target.value) || 50,
                  })
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Match by preferred country</Label>
              <Switch
                checked={assignment.assignByCountry}
                onCheckedChange={(v) =>
                  setAssignment({ ...assignment, assignByCountry: v })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Match by language</Label>
              <Switch
                checked={assignment.assignByLanguage}
                onCheckedChange={(v) =>
                  setAssignment({ ...assignment, assignByLanguage: v })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--alo-text-muted)]">
                Auto-escalate after (hours, no response)
              </Label>
              <Input
                type="number"
                value={assignment.autoEscalateAfter}
                onChange={(e) =>
                  setAssignment({ ...assignment, autoEscalateAfter: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </SectionCard>

        {/* Auto-reply / AI Settings */}
        <SectionCard
          title="Auto-Reply & AI Assist"
          description="Configure AI-assisted replies for inbound messages"
          icon="Sparkles"
          className="lg:col-span-2"
          action={
            <Button
              size="sm"
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
              onClick={() => handleSave("Auto-reply")}
            >
              Save
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { key: "emailEnabled", label: "Email auto-reply" },
              { key: "whatsappEnabled", label: "WhatsApp auto-reply" },
              { key: "smsEnabled", label: "SMS auto-reply" },
              { key: "aiAssist", label: "Use AI for response drafting" },
              {
                key: "requireHumanApproval",
                label: "Require human approval before sending",
              },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-lg border border-[var(--alo-brand-border)] bg-[var(--alo-page)] px-3 py-2"
              >
                <Label className="text-sm text-[var(--alo-text)]">{row.label}</Label>
                <Switch
                  checked={(autoReply as any)[row.key]}
                  onCheckedChange={(v) => setAutoReply({ ...autoReply, [row.key]: v })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-[var(--alo-brand-pale)] p-3 text-xs text-[var(--alo-brand)]">
            <Icon name="Sparkles" className="mr-1 inline size-3.5" />
            AI-assisted replies use the ALO AI model and require human approval by default.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
export default CrmSettings;
