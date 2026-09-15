"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader } from "@/components/alo/shared";

// Types
interface DashboardMetrics {
  totalUniversitiesResearched: number;
  totalEvidence: number;
  totalAgreements: number;
  pendingAgreements: number;
  activeAgreements: number;
  totalContacts: number;
  universityContacts: number;
  totalEmails: number;
  totalResearchActivities: number;
  pendingActivities: number;
  totalKnowledgePosts: number;
  businessStrategies: number;
}

interface ResearchActivity {
  id: string;
  universitySlug: string;
  universityName: string;
  countrySlug: string;
  activityType: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedOfficerName: string;
  nextAction: string;
  dueDate?: string;
  createdAt: string;
}

interface PartnershipComm {
  id: string;
  universitySlug: string;
  universityName: string;
  communicationType: string;
  subject: string;
  body: string;
  direction: string;
  status: string;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

interface BusinessStrategy {
  id: string;
  title: string;
  slug: string;
  countrySlug: string;
  region: string;
  strategyType: string;
  description: string;
  bestMethods: string;
  bestLocations: string;
  targetUniversities: string;
  contactStrategy: string;
  researchLeverage: string;
  businessExpansion: string;
  status: string;
  createdAt: string;
}

interface B2BContact {
  id: string;
  name: string;
  organization: string;
  type: string;
  email: string;
  phone: string;
  countrySlug: string;
  position: string;
  notes: string;
  lastContactedAt: string;
}

interface Agreement {
  id: string;
  agreementCode: string;
  universitySlug: string;
  universityName: string;
  countrySlug: string;
  status: string;
  partnershipType: string;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

const COUNTRIES = [
  { slug: "uk", label: "UK — United Kingdom", region: "Europe", priority: "High", universities: 130 },
  { slug: "usa", label: "USA — United States", region: "North America", priority: "High", universities: 4000 },
  { slug: "canada", label: "Canada", region: "North America", priority: "High", universities: 200 },
  { slug: "australia", label: "Australia", region: "Oceania", priority: "High", universities: 100 },
  { slug: "germany", label: "Germany", region: "Europe", priority: "Medium", universities: 400 },
  { slug: "france", label: "France", region: "Europe", priority: "Medium", universities: 250 },
  { slug: "netherlands", label: "Netherlands", region: "Europe", priority: "Medium", universities: 60 },
  { slug: "sweden", label: "Sweden", region: "Europe", priority: "Medium", universities: 50 },
  { slug: "new-zealand", label: "New Zealand", region: "Oceania", priority: "Medium", universities: 30 },
  { slug: "ireland", label: "Ireland", region: "Europe", priority: "High", universities: 30 },
];

const RAPID_METHODS = [
  { title: "Direct University Partnership Outreach", desc: "Email + LinkedIn + Phone to International Office, Partnerships Team, Admissions", time: "2-5 days", success: "High", steps: ["Research university international office contacts via B2BContact", "Leverage UniversityResearchEvidence & DigitalTwin data to personalize pitch", "Send official email via OfficialEmail system with ALO credentials, student volume, markets", "Follow-up call within 48h, schedule meeting"] },
  { title: "Agent Aggregator & Referral Network", desc: "Leverage existing partners, agents, B2B contacts to get warm introductions", time: "1-3 days", success: "Very High", steps: ["Identify B2BContact type=AGENT who already work with target university", "Request intro via PartnershipCommunication", "Offer commission share or reciprocal referral"] },
  { title: "Education Fairs & Conferences", desc: "Meet university reps at ICEF, NAFSA, EAIE, UK ENIC fairs", time: "1-4 weeks", success: "High", steps: ["List upcoming fairs in business strategy", "Pre-book meetings via contact details", "Prepare research data & business strategy doc to present"] },
  { title: "Digital Research Leverage", desc: "Use AI-collected university research data to demonstrate value", time: "Immediate", success: "High", steps: ["Show UniversityDigitalTwin — courses, intakes, scholarships, SEO data", "Present how ALO can drive enrollments via CRM & Marketing Hub", "Offer free trial: list university on ALO portal + 5 student leads"] },
  { title: "Commission-Based Fast Track", desc: "Offer zero upfront, commission-only partnership to reduce university risk", time: "2-7 days", success: "Very High", steps: ["Use UniversityAgreement partnershipType=COMMISSION", "Clear commissionTerms: 10-15% first year", "Expedite agreement via PARTNER_COMMUNICATION email"] },
];

export function InternationalOfficerDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [researchActivities, setResearchActivities] = React.useState<ResearchActivity[]>([]);
  const [communications, setCommunications] = React.useState<PartnershipComm[]>([]);
  const [strategies, setStrategies] = React.useState<BusinessStrategy[]>([]);
  const [contacts, setContacts] = React.useState<B2BContact[]>([]);
  const [agreements, setAgreements] = React.useState<Agreement[]>([]);
  const [activeTab, setActiveTab] = React.useState("overview");

  // Forms
  const [researchFormOpen, setResearchFormOpen] = React.useState(false);
  const [commFormOpen, setCommFormOpen] = React.useState(false);
  const [strategyFormOpen, setStrategyFormOpen] = React.useState(false);
  const [contactFormOpen, setContactFormOpen] = React.useState(false);
  const [agreementFormOpen, setAgreementFormOpen] = React.useState(false);

  const [researchForm, setResearchForm] = React.useState({ universitySlug: "", universityName: "", countrySlug: "uk", activityType: "RESEARCH", title: "", description: "", priority: "MEDIUM", nextAction: "" });
  const [commForm, setCommForm] = React.useState({ universitySlug: "", universityName: "", communicationType: "EMAIL", subject: "", body: "", contactName: "", contactEmail: "", status: "DRAFT" });
  const [strategyForm, setStrategyForm] = React.useState({ title: "", countrySlug: "uk", region: "Europe", strategyType: "RAPID_PARTNERSHIP", description: "", bestMethods: "", bestLocations: "", contactStrategy: "", researchLeverage: "", businessExpansion: "" });
  const [contactForm, setContactForm] = React.useState({ name: "", organization: "", type: "UNIVERSITY", email: "", phone: "", countrySlug: "uk", position: "", notes: "" });
  const [agreementForm, setAgreementForm] = React.useState({ universitySlug: "", universityName: "", countrySlug: "uk", partnershipType: "AGENT", contactName: "", contactEmail: "", notes: "" });

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, researchRes, commRes, strategyRes, contactRes, agreementRes] = await Promise.all([
        fetch("/api/international-officer/dashboard", { cache: "no-store" }),
        fetch("/api/international-officer/research-activities?limit=20", { cache: "no-store" }),
        fetch("/api/international-officer/partnership-communications?limit=20", { cache: "no-store" }),
        fetch("/api/international-officer/business-strategy?limit=20", { cache: "no-store" }),
        fetch("/api/international-officer/contacts?limit=50", { cache: "no-store" }),
        fetch("/api/international-officer/agreements?limit=20", { cache: "no-store" }),
      ]);
      const dashJson = dashRes.ok ? await dashRes.json() : null;
      const researchJson = researchRes.ok ? await researchRes.json() : { activities: [] };
      const commJson = commRes.ok ? await commRes.json() : { communications: [] };
      const strategyJson = strategyRes.ok ? await strategyRes.json() : { strategies: [] };
      const contactJson = contactRes.ok ? await contactRes.json() : { contacts: [] };
      const agreementJson = agreementRes.ok ? await agreementRes.json() : { agreements: [] };

      if (dashJson?.success) setMetrics(dashJson.metrics);
      setResearchActivities(researchJson.activities || []);
      setCommunications(commJson.communications || []);
      setStrategies(strategyJson.strategies || []);
      setContacts(contactJson.contacts || []);
      setAgreements(agreementJson.agreements || []);
    } catch (e: any) {
      toast({ title: "Failed to load dashboard", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // CRUD handlers
  async function handleCreateResearch() {
    try {
      const res = await fetch("/api/international-officer/research-activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(researchForm) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Research activity created" });
      setResearchFormOpen(false);
      setResearchForm({ universitySlug: "", universityName: "", countrySlug: "uk", activityType: "RESEARCH", title: "", description: "", priority: "MEDIUM", nextAction: "" });
      fetchDashboard();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  async function handleCreateComm() {
    try {
      const res = await fetch("/api/international-officer/partnership-communications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...commForm, createOfficialEmail: commForm.communicationType === "EMAIL" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Communication logged" });
      setCommFormOpen(false);
      setCommForm({ universitySlug: "", universityName: "", communicationType: "EMAIL", subject: "", body: "", contactName: "", contactEmail: "", status: "DRAFT" });
      fetchDashboard();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  async function handleCreateStrategy() {
    try {
      const res = await fetch("/api/international-officer/business-strategy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(strategyForm) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Business strategy created" });
      setStrategyFormOpen(false);
      setStrategyForm({ title: "", countrySlug: "uk", region: "Europe", strategyType: "RAPID_PARTNERSHIP", description: "", bestMethods: "", bestLocations: "", contactStrategy: "", researchLeverage: "", businessExpansion: "" });
      fetchDashboard();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  async function handleCreateContact() {
    try {
      const res = await fetch("/api/international-officer/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactForm) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Contact added" });
      setContactFormOpen(false);
      setContactForm({ name: "", organization: "", type: "UNIVERSITY", email: "", phone: "", countrySlug: "uk", position: "", notes: "" });
      fetchDashboard();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  async function handleCreateAgreement() {
    try {
      const res = await fetch("/api/international-officer/agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(agreementForm) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Agreement request created", description: json.agreement.agreementCode });
      setAgreementFormOpen(false);
      setAgreementForm({ universitySlug: "", universityName: "", countrySlug: "uk", partnershipType: "AGENT", contactName: "", contactEmail: "", notes: "" });
      fetchDashboard();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="International Officer Dashboard" subtitle="Manage university research activities, partnership communications, contact details, and business strategy for rapid partnerships." icon="Globe" />
        <LoadingGrid count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="International Officer Dashboard"
        subtitle="Manage university research activities, partnership communications (emails & agreements), contact details, and business strategy — best methods & locations for rapidly establishing university partnerships."
        icon="Globe"
        action={<Button onClick={fetchDashboard} variant="outline" className="h-10"><Icon name="RefreshCw" className="size-4" />Refresh</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Universities Researched" value={metrics?.totalUniversitiesResearched || 0} icon="Building2" accent="blue" hint="CRM + ResearchEvidence" />
        <StatCard label="Research Activities" value={metrics?.totalResearchActivities || 0} icon="FileSearch" accent="violet" hint={`${metrics?.pendingActivities || 0} pending`} />
        <StatCard label="Agreements" value={metrics?.totalAgreements || 0} icon="FileSignature" accent="emerald" hint={`${metrics?.activeAgreements || 0} active`} />
        <StatCard label="Pending Agreements" value={metrics?.pendingAgreements || 0} icon="Clock" accent="orange" hint="Need action" />
        <StatCard label="Contacts" value={metrics?.totalContacts || 0} icon="Contact" accent="teal" hint={`${metrics?.universityContacts || 0} universities`} />
        <StatCard label="Strategies" value={metrics?.businessStrategies || 0} icon="MapPinned" accent="amber" hint="Active" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl border bg-white p-1 sm:inline-flex">
          <TabsTrigger value="overview" className="rounded-xl"><Icon name="LayoutDashboard" className="size-4" />Overview</TabsTrigger>
          <TabsTrigger value="research" className="rounded-xl"><Icon name="BookMarked" className="size-4" />University Research</TabsTrigger>
          <TabsTrigger value="communications" className="rounded-xl"><Icon name="Mail" className="size-4" />Partnership Comms</TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-xl"><Icon name="Contact" className="size-4" />Contact Details</TabsTrigger>
          <TabsTrigger value="agreements" className="rounded-xl"><Icon name="FileSignature" className="size-4" />Agreements</TabsTrigger>
          <TabsTrigger value="strategy" className="rounded-xl"><Icon name="MapPinned" className="size-4" />Business Strategy</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Rapid Partnership — Best Methods" description="Proven methods to rapidly establish partnerships with universities" icon="Zap">
              <div className="space-y-3">
                {RAPID_METHODS.map((m, i) => (
                  <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-semibold text-sm text-[#0F172A]">{i+1}. {m.title}</p><p className="text-xs text-[#64748B] mt-0.5">{m.desc}</p></div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">{m.success}</Badge>
                        <Badge variant="outline" className="text-[10px]">{m.time}</Badge>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {m.steps.map((s, j) => (<li key={j} className="text-xs text-[#475569] flex gap-1.5"><span className="text-[#0057B8]">•</span>{s}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Best Locations for Rapid Partnerships" description="Priority countries & regions based on student demand, partnership ease, commission" icon="Globe">
              <div className="space-y-2">
                {COUNTRIES.map((c) => (
                  <div key={c.slug} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs">{c.slug.toUpperCase().slice(0,2)}</div>
                      <div><p className="font-medium text-sm text-[#0F172A]">{c.label}</p><p className="text-xs text-[#64748B]">{c.region} • {c.universities} universities</p></div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", c.priority==="High" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>{c.priority}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <p className="font-semibold text-sm text-[#0F172A] flex items-center gap-1"><Icon name="Lightbulb" className="size-4 text-amber-600" />Business Expansion Tips</p>
                <ul className="mt-2 space-y-1 text-xs text-[#475569]">
                  <li>• Focus on UK, Canada, Australia first — fastest agreement turnaround (COMMISSION type)</li>
                  <li>• Leverage research data: show university ranking, courses, scholarships from DigitalTwin</li>
                  <li>• Use B2BContact warm intros — 3x faster than cold outreach</li>
                  <li>• Offer free marketing: list university on ALO portal, run targeted campaigns</li>
                  <li>• Attend ICEF, NAFSA, EAIE fairs — pre-book 20+ meetings via contact details</li>
                </ul>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Recent Research Activities" icon="FileSearch" action={<Button size="sm" onClick={() => setActiveTab("research")} variant="outline" className="h-8">View All</Button>}>
              {researchActivities.length===0 ? <EmptyState icon="FileSearch" title="No research activities" description="Start researching universities" /> : (
                <div className="space-y-2">
                  {researchActivities.slice(0,5).map((r) => (
                    <div key={r.id} className="rounded-lg border p-2.5 bg-white flex justify-between">
                      <div><p className="font-medium text-sm">{r.universityName}</p><p className="text-xs text-slate-500">{r.title} • {r.status} • {r.priority}</p></div>
                      <Badge variant="outline" className="text-[10px] h-fit">{r.activityType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            <SectionCard title="Recent Partnership Communications" icon="Mail" action={<Button size="sm" onClick={() => setActiveTab("communications")} variant="outline" className="h-8">View All</Button>}>
              {communications.length===0 ? <EmptyState icon="Mail" title="No communications" description="Log emails and meetings" /> : (
                <div className="space-y-2">
                  {communications.slice(0,5).map((c) => (
                    <div key={c.id} className="rounded-lg border p-2.5 bg-white flex justify-between">
                      <div><p className="font-medium text-sm">{c.universityName} — {c.subject}</p><p className="text-xs text-slate-500">{c.communicationType} • {c.status} • {c.contactEmail}</p></div>
                      <Badge variant="outline" className="text-[10px] h-fit">{c.direction}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* Research */}
        <TabsContent value="research" className="space-y-4">
          <SectionCard title="University Research Activities" description="Track research, outreach, agreement negotiations, leveraging UniversityResearchEvidence & DigitalTwin" icon="BookMarked" action={<Button onClick={() => setResearchFormOpen(true)} className="h-9 bg-[#0057B8] text-white hover:bg-[#004494]"><Icon name="Plus" className="size-4" />New Activity</Button>}>
            {researchActivities.length===0 ? <EmptyState icon="FileSearch" title="No research activities" description="Create first university research activity" /> : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {researchActivities.map((r) => (
                  <Card key={r.id} className="rounded-xl border">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between"><p className="font-semibold text-sm">{r.universityName}</p><Badge variant="outline" className="text-[10px]">{r.status}</Badge></div>
                      <p className="text-sm text-slate-700">{r.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
                      <div className="flex gap-1 flex-wrap"><Badge variant="outline" className="text-[10px]">{r.activityType}</Badge><Badge variant="outline" className="text-[10px]">{r.priority}</Badge><Badge variant="outline" className="text-[10px]">{r.countrySlug}</Badge></div>
                      {r.nextAction && <p className="text-xs bg-amber-50 border border-amber-200 rounded-md p-2"><span className="font-semibold">Next:</span> {r.nextAction}</p>}
                      <div className="flex justify-between text-[11px] text-slate-400"><span>{r.assignedOfficerName || "Unassigned"}</span><span>{new Date(r.createdAt).toLocaleDateString()}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="space-y-4">
          <SectionCard title="Partnership Communications" description="Emails, agreements, calls, meetings timeline — integrated with OfficialEmail & UniversityAgreement" icon="Mail" action={<Button onClick={() => setCommFormOpen(true)} className="h-9 bg-[#0057B8] text-white hover:bg-[#004494]"><Icon name="Plus" className="size-4" />Log Communication</Button>}>
            {communications.length===0 ? <EmptyState icon="Mail" title="No communications logged" description="Start logging partnership emails and meetings" /> : (
              <div className="space-y-2">
                {communications.map((c) => (
                  <div key={c.id} className="rounded-xl border p-3 bg-white">
                    <div className="flex justify-between gap-2"><div><p className="font-medium text-sm">{c.universityName} — {c.subject}</p><p className="text-xs text-slate-500">{c.contactName} • {c.contactEmail} • {c.communicationType} • {c.direction}</p><p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.body.slice(0,200)}</p></div><Badge variant="outline" className={cn("h-fit text-[10px]", c.status==="SENT" ? "bg-emerald-50 text-emerald-700" : c.status==="REPLIED" ? "bg-blue-50 text-blue-700" : "bg-slate-50")}>{c.status}</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts" className="space-y-4">
          <SectionCard title="Contact Details" description="B2B contacts for universities, agents, partners — name, organization, email, phone, position, notes, last contacted" icon="Contact" action={<Button onClick={() => setContactFormOpen(true)} className="h-9 bg-[#0057B8] text-white hover:bg-[#004494]"><Icon name="Plus" className="size-4" />Add Contact</Button>}>
            {contacts.length===0 ? <EmptyState icon="Contact" title="No contacts" description="Add university contacts to start outreach" /> : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {contacts.map((ct) => (
                  <Card key={ct.id} className="rounded-xl border"><CardContent className="pt-4 space-y-2"><div className="flex justify-between"><p className="font-semibold text-sm">{ct.name}</p><Badge variant="outline" className="text-[10px]">{ct.type}</Badge></div><p className="text-xs text-slate-600">{ct.organization} • {ct.position}</p><p className="text-xs text-slate-500">{ct.email}</p><p className="text-xs text-slate-500">{ct.phone}</p><p className="text-xs bg-slate-50 rounded p-2">{ct.notes || "No notes"}</p><div className="flex justify-between text-[11px] text-slate-400"><span>{ct.countrySlug}</span><span>{ct.lastContactedAt ? new Date(ct.lastContactedAt).toLocaleDateString() : ""}</span></div></CardContent></Card>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Agreements */}
        <TabsContent value="agreements" className="space-y-4">
          <SectionCard title="University Agreements" description="Manage partnership agreements — ALO-AGR-XXXXX, status PENDING/ACTIVE, type AGENT/COMMISSION, researchData JSON" icon="FileSignature" action={<Button onClick={() => setAgreementFormOpen(true)} className="h-9 bg-[#0057B8] text-white hover:bg-[#004494]"><Icon name="Plus" className="size-4" />New Agreement</Button>}>
            {agreements.length===0 ? <EmptyState icon="FileSignature" title="No agreements" description="Create agreement request to start partnership" /> : (
              <div className="space-y-2">
                {agreements.map((a) => (
                  <div key={a.id} className="rounded-xl border p-3 bg-white flex justify-between">
                    <div><p className="font-medium text-sm">{a.agreementCode} — {a.universityName}</p><p className="text-xs text-slate-500">{a.partnershipType} • {a.countrySlug} • {a.contactName} • {a.contactEmail}</p></div>
                    <Badge variant="outline" className={cn("h-fit text-[10px]", a.status==="ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : a.status==="PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-50")}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Business Strategy */}
        <TabsContent value="strategy" className="space-y-4">
          <SectionCard title="Partnership Business Strategy" description="Clearly outline business strategy regarding partnerships — best methods and locations for rapidly establishing partnerships with universities. How to communicate with universities, leverage research data, expand business." icon="MapPinned" action={<Button onClick={() => setStrategyFormOpen(true)} className="h-9 bg-amber-600 text-white hover:bg-amber-700"><Icon name="Plus" className="size-4" />New Strategy</Button>}>
            {strategies.length===0 ? (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-6 text-center">
                  <Icon name="MapPinned" className="size-10 mx-auto text-amber-600 mb-2" />
                  <p className="font-semibold text-[#0F172A]">No business strategy documented yet</p>
                  <p className="text-sm text-[#64748B] mt-1">Create your first strategy outlining best methods and locations for rapid partnerships</p>
                  <Button onClick={() => setStrategyFormOpen(true)} className="mt-3 h-9 bg-amber-600 text-white">Create Strategy</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-xl border bg-white p-4">
                    <h4 className="font-bold text-sm flex items-center gap-2"><Icon name="Zap" className="size-4 text-amber-600" />Default Rapid Partnership Playbook (Template)</h4>
                    <div className="mt-3 space-y-3 text-xs text-slate-700">
                      <div><p className="font-semibold">Best Methods:</p><ul className="list-disc pl-4 space-y-1 mt-1"><li>Direct outreach to International Office via OfficialEmail + B2BContact (2-5 days)</li><li>Agent warm intro via existing B2BContact type=AGENT (1-3 days, highest success)</li><li>Commission-only fast track: UniversityAgreement type=COMMISSION, 10-15% commission, zero upfront (2-7 days)</li><li>Education fairs ICEF/NAFSA/EAIE — pre-book meetings (1-4 weeks)</li><li>Digital research leverage: show UniversityDigitalTwin + ResearchEvidence to prove value</li></ul></div>
                      <div><p className="font-semibold">Best Locations:</p><ul className="list-disc pl-4 space-y-1 mt-1"><li>UK (130 unis, high demand, easy COMMISSION agreements, Tier 4 visa)</li><li>Canada (200 unis, SDS, high commission, fast approval)</li><li>Australia (100 unis, GTE, high value)</li><li>USA (4000 unis, but complex — start with community colleges & state unis)</li><li>Ireland, Germany, Netherlands (medium, growing demand, EU post-study work)</li></ul></div>
                      <div><p className="font-semibold">How to Communicate:</p><p>Personalize using research data (courses, intakes, scholarships from DigitalTwin), send via OfficialEmail type UNIVERSITY_COMMUNICATION, follow up call 48h, log in PartnershipCommunication, track reply status.</p></div>
                      <div><p className="font-semibold">Leverage Research Data:</p><p>Use UniversityResearchEvidence (fieldName/Value, sourceUrl, confidence, verificationStatus) + UniversityDigitalTwin + CrmUniversity to show you understand their programs, gaps, SEO opportunities, and can drive qualified leads via CRM + Marketing Hub.</p></div>
                      <div><p className="font-semibold">Business Expansion:</p><p>Start with COMMISSION, upsell to AGENT/REPRESENTATIVE after 10+ enrollments, offer free marketing (list on portal, campaigns), provide student volume from Bangladesh market, use KnowledgeSharing hub to share success stories.</p></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {strategies.map((s) => (
                  <Card key={s.id} className="rounded-xl border"><CardContent className="pt-4 space-y-3"><div className="flex justify-between"><p className="font-bold text-sm">{s.title}</p><Badge variant="outline" className="text-[10px]">{s.status}</Badge></div><p className="text-xs text-slate-500">{s.countrySlug} • {s.region} • {s.strategyType}</p><p className="text-sm text-slate-700">{s.description}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><div className="rounded-lg border p-2 bg-amber-50/50"><p className="font-semibold">Best Methods</p><p className="mt-1 whitespace-pre-wrap">{s.bestMethods.slice(0,500)}</p></div><div className="rounded-lg border p-2 bg-blue-50/50"><p className="font-semibold">Best Locations</p><p className="mt-1 whitespace-pre-wrap">{s.bestLocations.slice(0,500)}</p></div><div className="rounded-lg border p-2 bg-emerald-50/50"><p className="font-semibold">Contact Strategy</p><p className="mt-1 whitespace-pre-wrap">{s.contactStrategy.slice(0,500)}</p></div><div className="rounded-lg border p-2 bg-violet-50/50"><p className="font-semibold">Research Leverage & Expansion</p><p className="mt-1 whitespace-pre-wrap">{(s.researchLeverage + "\n" + s.businessExpansion).slice(0,500)}</p></div></div></CardContent></Card>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={researchFormOpen} onOpenChange={setResearchFormOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>New University Research Activity</DialogTitle><DialogDescription>Track research, outreach, negotiation</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>University Slug *</Label><Input value={researchForm.universitySlug} onChange={(e) => setResearchForm({ ...researchForm, universitySlug: e.target.value })} placeholder="university-of-birmingham" /></div><div className="grid gap-1"><Label>University Name *</Label><Input value={researchForm.universityName} onChange={(e) => setResearchForm({ ...researchForm, universityName: e.target.value })} placeholder="University of Birmingham" /></div></div>
            <div className="grid grid-cols-3 gap-2"><div className="grid gap-1"><Label>Country</Label><Select value={researchForm.countrySlug} onValueChange={(v) => setResearchForm({ ...researchForm, countrySlug: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((c) => (<SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>))}</SelectContent></Select></div><div className="grid gap-1"><Label>Type</Label><Select value={researchForm.activityType} onValueChange={(v) => setResearchForm({ ...researchForm, activityType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RESEARCH">Research</SelectItem><SelectItem value="PARTNERSHIP_OUTREACH">Outreach</SelectItem><SelectItem value="AGREEMENT_NEGOTIATION">Negotiation</SelectItem><SelectItem value="EMAIL_COMMUNICATION">Email</SelectItem><SelectItem value="MEETING">Meeting</SelectItem><SelectItem value="FOLLOW_UP">Follow-up</SelectItem></SelectContent></Select></div><div className="grid gap-1"><Label>Priority</Label><Select value={researchForm.priority} onValueChange={(v) => setResearchForm({ ...researchForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div></div>
            <div className="grid gap-1"><Label>Title *</Label><Input value={researchForm.title} onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })} placeholder="Research scholarship & courses" /></div>
            <div className="grid gap-1"><Label>Description</Label><Textarea value={researchForm.description} onChange={(e) => setResearchForm({ ...researchForm, description: e.target.value })} rows={3} /></div>
            <div className="grid gap-1"><Label>Next Action</Label><Input value={researchForm.nextAction} onChange={(e) => setResearchForm({ ...researchForm, nextAction: e.target.value })} placeholder="Send email to international office" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResearchFormOpen(false)}>Cancel</Button><Button onClick={handleCreateResearch} className="bg-[#0057B8] text-white">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={commFormOpen} onOpenChange={setCommFormOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Log Partnership Communication</DialogTitle><DialogDescription>Email, agreement, call, meeting</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>University Slug *</Label><Input value={commForm.universitySlug} onChange={(e) => setCommForm({ ...commForm, universitySlug: e.target.value })} /></div><div className="grid gap-1"><Label>University Name</Label><Input value={commForm.universityName} onChange={(e) => setCommForm({ ...commForm, universityName: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Type</Label><Select value={commForm.communicationType} onValueChange={(v) => setCommForm({ ...commForm, communicationType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="AGREEMENT">Agreement</SelectItem><SelectItem value="CALL">Call</SelectItem><SelectItem value="MEETING">Meeting</SelectItem><SelectItem value="WHATSAPP">WhatsApp</SelectItem><SelectItem value="OFFICIAL_LETTER">Official Letter</SelectItem></SelectContent></Select></div><div className="grid gap-1"><Label>Status</Label><Select value={commForm.status} onValueChange={(v) => setCommForm({ ...commForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="SENT">Sent</SelectItem><SelectItem value="DELIVERED">Delivered</SelectItem><SelectItem value="REPLIED">Replied</SelectItem></SelectContent></Select></div></div>
            <div className="grid gap-1"><Label>Subject *</Label><Input value={commForm.subject} onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })} placeholder="Partnership proposal" /></div>
            <div className="grid gap-1"><Label>Body</Label><Textarea value={commForm.body} onChange={(e) => setCommForm({ ...commForm, body: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Contact Name</Label><Input value={commForm.contactName} onChange={(e) => setCommForm({ ...commForm, contactName: e.target.value })} /></div><div className="grid gap-1"><Label>Contact Email</Label><Input value={commForm.contactEmail} onChange={(e) => setCommForm({ ...commForm, contactEmail: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCommFormOpen(false)}>Cancel</Button><Button onClick={handleCreateComm} className="bg-[#0057B8] text-white">Log</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Contact Detail</DialogTitle><DialogDescription>B2B contact for university, agent, partner</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Name *</Label><Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} /></div><div className="grid gap-1"><Label>Organization *</Label><Input value={contactForm.organization} onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Type</Label><Select value={contactForm.type} onValueChange={(v) => setContactForm({ ...contactForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UNIVERSITY">University</SelectItem><SelectItem value="AGENT">Agent</SelectItem><SelectItem value="PARTNER">Partner</SelectItem><SelectItem value="INSTITUTION">Institution</SelectItem></SelectContent></Select></div><div className="grid gap-1"><Label>Country</Label><Select value={contactForm.countrySlug} onValueChange={(v) => setContactForm({ ...contactForm, countrySlug: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((c) => (<SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>))}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Email</Label><Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div><div className="grid gap-1"><Label>Phone</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div></div>
            <div className="grid gap-1"><Label>Position</Label><Input value={contactForm.position} onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })} placeholder="International Officer, Partnership Manager" /></div>
            <div className="grid gap-1"><Label>Notes</Label><Textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setContactFormOpen(false)}>Cancel</Button><Button onClick={handleCreateContact} className="bg-[#0057B8] text-white">Add Contact</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={agreementFormOpen} onOpenChange={setAgreementFormOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>New University Agreement</DialogTitle><DialogDescription>Request partnership agreement ALO-AGR-XXXXX</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>University Slug *</Label><Input value={agreementForm.universitySlug} onChange={(e) => setAgreementForm({ ...agreementForm, universitySlug: e.target.value })} /></div><div className="grid gap-1"><Label>University Name *</Label><Input value={agreementForm.universityName} onChange={(e) => setAgreementForm({ ...agreementForm, universityName: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Country</Label><Select value={agreementForm.countrySlug} onValueChange={(v) => setAgreementForm({ ...agreementForm, countrySlug: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((c) => (<SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>))}</SelectContent></Select></div><div className="grid gap-1"><Label>Partnership Type</Label><Select value={agreementForm.partnershipType} onValueChange={(v) => setAgreementForm({ ...agreementForm, partnershipType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AGENT">Agent</SelectItem><SelectItem value="REPRESENTATIVE">Representative</SelectItem><SelectItem value="REFERRAL">Referral</SelectItem><SelectItem value="COMMISSION">Commission</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="grid gap-1"><Label>Contact Name</Label><Input value={agreementForm.contactName} onChange={(e) => setAgreementForm({ ...agreementForm, contactName: e.target.value })} /></div><div className="grid gap-1"><Label>Contact Email</Label><Input value={agreementForm.contactEmail} onChange={(e) => setAgreementForm({ ...agreementForm, contactEmail: e.target.value })} /></div></div>
            <div className="grid gap-1"><Label>Notes</Label><Textarea value={agreementForm.notes} onChange={(e) => setAgreementForm({ ...agreementForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAgreementFormOpen(false)}>Cancel</Button><Button onClick={handleCreateAgreement} className="bg-[#0057B8] text-white">Request Agreement</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={strategyFormOpen} onOpenChange={setStrategyFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>New Partnership Business Strategy</DialogTitle><DialogDescription>Outline best methods and locations for rapidly establishing partnerships with universities. How to communicate, leverage research data, expand business.</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label>Title *</Label><Input value={strategyForm.title} onChange={(e) => setStrategyForm({ ...strategyForm, title: e.target.value })} placeholder="UK Rapid Partnership Strategy 2025" /></div>
            <div className="grid grid-cols-3 gap-2"><div className="grid gap-1"><Label>Country</Label><Select value={strategyForm.countrySlug} onValueChange={(v) => setStrategyForm({ ...strategyForm, countrySlug: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((c) => (<SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>))}</SelectContent></Select></div><div className="grid gap-1"><Label>Region</Label><Input value={strategyForm.region} onChange={(e) => setStrategyForm({ ...strategyForm, region: e.target.value })} /></div><div className="grid gap-1"><Label>Type</Label><Select value={strategyForm.strategyType} onValueChange={(v) => setStrategyForm({ ...strategyForm, strategyType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RAPID_PARTNERSHIP">Rapid Partnership</SelectItem><SelectItem value="RESEARCH_COLLABORATION">Research Collaboration</SelectItem><SelectItem value="AGENT_AGREEMENT">Agent Agreement</SelectItem><SelectItem value="COMMISSION_BASED">Commission Based</SelectItem></SelectContent></Select></div></div>
            <div className="grid gap-1"><Label>Description *</Label><Textarea value={strategyForm.description} onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })} rows={2} placeholder="Overview of strategy" /></div>
            <div className="grid gap-1"><Label>Best Methods (for rapidly establishing partnerships)</Label><Textarea value={strategyForm.bestMethods} onChange={(e) => setStrategyForm({ ...strategyForm, bestMethods: e.target.value })} rows={4} placeholder="Direct outreach, agent warm intro, commission fast track, education fairs, digital research leverage..." /></div>
            <div className="grid gap-1"><Label>Best Locations (countries, cities, universities)</Label><Textarea value={strategyForm.bestLocations} onChange={(e) => setStrategyForm({ ...strategyForm, bestLocations: e.target.value })} rows={3} placeholder="UK, Canada, Australia high priority; USA, Germany, Netherlands medium; specific universities list..." /></div>
            <div className="grid gap-1"><Label>Contact Strategy (how to communicate with universities)</Label><Textarea value={strategyForm.contactStrategy} onChange={(e) => setStrategyForm({ ...strategyForm, contactStrategy: e.target.value })} rows={3} /></div>
            <div className="grid gap-1"><Label>Research Leverage (how to leverage research data)</Label><Textarea value={strategyForm.researchLeverage} onChange={(e) => setStrategyForm({ ...strategyForm, researchLeverage: e.target.value })} rows={3} /></div>
            <div className="grid gap-1"><Label>Business Expansion (how to expand business through partnerships)</Label><Textarea value={strategyForm.businessExpansion} onChange={(e) => setStrategyForm({ ...strategyForm, businessExpansion: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStrategyFormOpen(false)}>Cancel</Button><Button onClick={handleCreateStrategy} className="bg-amber-600 text-white hover:bg-amber-700">Create Strategy</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default InternationalOfficerDashboard;
