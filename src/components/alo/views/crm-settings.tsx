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

export function CrmSettings() {
  const { toast } = useToast();

  const [sla, setSla] = React.useState({
    firstResponse: "15",
    followUp: "60",
    escalation40: "40",
    escalation50: "50",
  });

  const [officeHours, setOfficeHours] = React.useState({
    enabled: true,
    start: "09:00",
    end: "18:00",
    weekendOff: true,
    timeZone: "Asia/Dhaka",
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
              className="bg-[#0057B8] text-white hover:bg-[#003F87]"
              onClick={() => handleSave("SLA")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A7299]">First Response (min)</Label>
                <Input
                  type="number"
                  value={sla.firstResponse}
                  onChange={(e) => setSla({ ...sla, firstResponse: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Follow-up Window (min)</Label>
                <Input
                  type="number"
                  value={sla.followUp}
                  onChange={(e) => setSla({ ...sla, followUp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Escalation Level 40% (hrs)</Label>
                <Input
                  type="number"
                  value={sla.escalation40}
                  onChange={(e) => setSla({ ...sla, escalation40: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Escalation Level 50% (hrs)</Label>
                <Input
                  type="number"
                  value={sla.escalation50}
                  onChange={(e) => setSla({ ...sla, escalation50: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="rounded-lg bg-[#EAF3FF] p-3 text-xs text-[#0057B8]">
              <Icon name="Info" className="mr-1 inline size-3.5" />
              Escalations notify the counselor's manager and senior leadership.
            </div>
          </div>
        </SectionCard>

        {/* Office Hours */}
        <SectionCard
          title="Office Hours"
          description="Define business hours for SLA calculations"
          icon="Clock"
          action={
            <Button
              size="sm"
              className="bg-[#0057B8] text-white hover:bg-[#003F87]"
              onClick={() => handleSave("Office Hours")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable office hours</Label>
              <Switch
                checked={officeHours.enabled}
                onCheckedChange={(v) => setOfficeHours({ ...officeHours, enabled: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A7299]">Start Time</Label>
                <Input
                  type="time"
                  value={officeHours.start}
                  onChange={(e) => setOfficeHours({ ...officeHours, start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">End Time</Label>
                <Input
                  type="time"
                  value={officeHours.end}
                  onChange={(e) => setOfficeHours({ ...officeHours, end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">Time Zone</Label>
              <Select
                value={officeHours.timeZone}
                onValueChange={(v) => setOfficeHours({ ...officeHours, timeZone: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Weekends off</Label>
              <Switch
                checked={officeHours.weekendOff}
                onCheckedChange={(v) => setOfficeHours({ ...officeHours, weekendOff: v })}
              />
            </div>
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
              className="bg-[#0057B8] text-white hover:bg-[#003F87]"
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
                <span className="text-sm text-[#0B2447]">{row.label}</span>
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
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-[#F7FAFE] p-3">
              <div>
                <p className="text-xs text-[#5A7299]">Hot Lead Threshold</p>
                <Badge className="mt-1 bg-[#E8501A] text-white">≥ {scoring.hotTier}</Badge>
              </div>
              <div>
                <p className="text-xs text-[#5A7299]">Urgent Threshold</p>
                <Badge className="mt-1 bg-rose-600 text-white">≥ {scoring.urgentTier}</Badge>
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
              className="bg-[#0057B8] text-white hover:bg-[#003F87]"
              onClick={() => handleSave("Assignment")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#5A7299]">Assignment Mode</Label>
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
              <Label className="text-xs text-[#5A7299]">
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
              <Label className="text-xs text-[#5A7299]">
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
              className="bg-[#0057B8] text-white hover:bg-[#003F87]"
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
                className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
              >
                <Label className="text-sm text-[#0B2447]">{row.label}</Label>
                <Switch
                  checked={(autoReply as any)[row.key]}
                  onCheckedChange={(v) => setAutoReply({ ...autoReply, [row.key]: v })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-violet-50 p-3 text-xs text-violet-700">
            <Icon name="Sparkles" className="mr-1 inline size-3.5" />
            AI-assisted replies use the ALO AI model and require human approval by default.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
export default CrmSettings;
