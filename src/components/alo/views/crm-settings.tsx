"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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

  // ─── Existing States ──────────────────────────────────────
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

  // ─── NEW: SMTP Settings ───────────────────────────────────
  const [smtp, setSmtp] = React.useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    fromName: "ALO Education",
    fromEmail: "noreply@aloeducation.com",
  });

  // ─── NEW: WhatsApp Settings ───────────────────────────────
  const [whatsapp, setWhatsapp] = React.useState({
    apiUrl: "",
    apiToken: "",
    defaultSenderNumber: "",
    templateLanguage: "en",
    autoReplyEnabled: true,
    consentRequired: true,
    businessHoursOnly: false,
  });

  // ─── NEW: Security Settings ───────────────────────────────
  const [security, setSecurity] = React.useState({
    minPasswordLength: "8",
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeoutMinutes: "480",
    twoFactorEnabled: false,
    twoFactorMethod: "TOTP",
    maxLoginAttempts: "5",
    lockoutDurationMinutes: "15",
    passwordExpiryDays: "90",
    enforcePasswordHistory: true,
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
        subtitle="Configure SLA timers, office hours, integrations, and security policies"
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
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
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
            <div className="rounded-lg bg-[#EAF3FF] p-3 text-xs text-[#0066CC]">
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
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
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
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
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
                <Badge className="mt-1 bg-[#F37021] text-white">≥ {scoring.hotTier}</Badge>
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
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
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
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
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

        {/* ═══════════════════════════════════════════════════════ */
        {/* NEW SECTION: SMTP / Email Settings                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <SectionCard
          title="SMTP / Email Settings"
          description="Configure outgoing email server for notifications and auto-replies"
          icon="Mail"
          action={
            <Button
              size="sm"
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
              onClick={() => handleSave("SMTP")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#5A7299]">SMTP Host</Label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Port</Label>
                <Input
                  placeholder="587"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2">
              <Label className="text-sm text-[#0B2447]">Use TLS/SSL (port 465)</Label>
              <Switch
                checked={smtp.secure}
                onCheckedChange={(v) => setSmtp({ ...smtp, secure: v })}
              />
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">SMTP Username</Label>
              <Input
                placeholder="user@aloeducation.com"
                value={smtp.user}
                onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">SMTP Password / App Token</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A7299]">From Name</Label>
                <Input
                  value={smtp.fromName}
                  onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">From Email</Label>
                <Input
                  type="email"
                  value={smtp.fromEmail}
                  onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <Icon name="ShieldAlert" className="mr-1 inline size-3.5" />
              SMTP credentials are encrypted at rest. Changes take effect immediately.
            </div>
          </div>
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════ */
        {/* NEW SECTION: WhatsApp Integration Settings          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <SectionCard
          title="WhatsApp Integration"
          description="Configure WhatsApp Business API for messaging and follow-ups"
          icon="MessageCircle"
          action={
            <Button
              size="sm"
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
              onClick={() => handleSave("WhatsApp")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#5A7299]">WhatsApp API URL</Label>
              <Input
                placeholder="https://graph.facebook.com/v18.0/"
                value={whatsapp.apiUrl}
                onChange={(e) => setWhatsapp({ ...whatsapp, apiUrl: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">API Token</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">Default Sender Number</Label>
              <Input
                placeholder="+8801XXXXXXXXX"
                value={whatsapp.defaultSenderNumber}
                onChange={(e) => setWhatsapp({ ...whatsapp, defaultSenderNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5A7299]">Default Template Language</Label>
              <Select
                value={whatsapp.templateLanguage}
                onValueChange={(v) => setWhatsapp({ ...whatsapp, templateLanguage: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="hi">हिন্দী (Hindi)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { key: "autoReplyEnabled", label: "Auto-reply enabled" },
                { key: "consentRequired", label: "Require opt-in consent" },
                { key: "businessHoursOnly", label: "Business hours only" },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
                >
                  <Label className="text-xs text-[#0B2447]">{row.label}</Label>
                  <Switch
                    checked={(whatsapp as any)[row.key]}
                    onCheckedChange={(v) => setWhatsapp({ ...whatsapp, [row.key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              <Icon name="MessageCircle" className="mr-1 inline size-3.5" />
              WhatsApp templates must be pre-approved by Meta. Consent is required for automated messaging.
            </div>
          </div>
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════ */
        {/* NEW SECTION: Security Settings                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <SectionCard
          title="Password Policy"
          description="Enforce strong passwords for all users"
          icon="KeyRound"
          action={
            <Button
              size="sm"
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
              onClick={() => handleSave("Password Policy")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A7299]">Min Password Length</Label>
                <Input
                  type="number"
                  value={security.minPasswordLength}
                  onChange={(e) => setSecurity({ ...security, minPasswordLength: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Password Expiry (days)</Label>
                <Input
                  type="number"
                  value={security.passwordExpiryDays}
                  onChange={(e) => setSecurity({ ...security, passwordExpiryDays: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "requireUppercase", label: "Require uppercase (A-Z)" },
                { key: "requireLowercase", label: "Require lowercase (a-z)" },
                { key: "requireNumbers", label: "Require numbers (0-9)" },
                { key: "requireSpecialChars", label: "Require special chars (!@#)" },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
                >
                  <Label className="text-xs text-[#0B2447]">{row.label}</Label>
                  <Switch
                    checked={(security as any)[row.key]}
                    onCheckedChange={(v) => setSecurity({ ...security, [row.key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2">
              <Label className="text-sm text-[#0B2447]">Enforce password history (no reuse of last 5)</Label>
              <Switch
                checked={security.enforcePasswordHistory}
                onCheckedChange={(v) => setSecurity({ ...security, enforcePasswordHistory: v })}
              />
            </div>
          </div>
        </SectionCard>

        {/* Session & Login Security */}
        <SectionCard
          title="Session & Login Security"
          description="Control session duration, 2FA, and brute-force protection"
          icon="ShieldCheck"
          action={
            <Button
              size="sm"
              className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
              onClick={() => handleSave("Session Security")}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A7299]">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Max Login Attempts</Label>
                <Input
                  type="number"
                  value={security.maxLoginAttempts}
                  onChange={(e) => setSecurity({ ...security, maxLoginAttempts: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">Lockout Duration (minutes)</Label>
                <Input
                  type="number"
                  value={security.lockoutDurationMinutes}
                  onChange={(e) => setSecurity({ ...security, lockoutDurationMinutes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5A7299]">2FA Method</Label>
                <Select
                  value={security.twoFactorMethod}
                  onValueChange={(v) => setSecurity({ ...security, twoFactorMethod: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOTP">Authenticator App (TOTP)</SelectItem>
                    <SelectItem value="SMS">SMS Code</SelectItem>
                    <SelectItem value="EMAIL">Email Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2">
              <div>
                <Label className="text-sm text-[#0B2447]">Enable Two-Factor Authentication (2FA)</Label>
                <p className="text-xs text-[#5A7299]">Requires all users to set up 2FA on next login</p>
              </div>
              <Switch
                checked={security.twoFactorEnabled}
                onCheckedChange={(v) => setSecurity({ ...security, twoFactorEnabled: v })}
              />
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              <Icon name="ShieldAlert" className="mr-1 inline size-3.5" />
              Changing session timeout will log out all active sessions. Enabling 2FA is a security best practice.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
