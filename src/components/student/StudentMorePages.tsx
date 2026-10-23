'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Copy,
  Check,
  Share2,
  Mail,
  Phone,
  Users,
  Gift,
  ArrowRight,
  Star,
  Search,
  FileText,
  Shield,
  CreditCard,
  GraduationCap,
  Award,
  Globe,
  Headphones,
  ChevronRight,
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  BookOpen,
  Lightbulb,
  Target,
  Upload,
  TrendingUp,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Languages,
  Download,
  Trash2,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Info,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

/* ================================================================== */
/*  1. STUDENT REFERRALS                                               */
/* ================================================================== */

// Real Referral rows, per GET /api/student/referrals.
interface ReferralRow {
  id: string;
  referralCode: string;
  referredName: string | null;
  status: string;
  source: string | null;
  rewardOffered: string | null;
  rewardStatus: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  QUALIFIED: 'bg-blue-50 text-blue-700',
  CONSULTATION_DONE: 'bg-blue-50 text-blue-700',
  APPLICATION_SUBMITTED: 'bg-indigo-50 text-indigo-700',
  ENROLLED: 'bg-emerald-50 text-emerald-700',
  REWARDED: 'bg-emerald-50 text-emerald-700',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export function StudentReferrals() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/student/referrals');
        if (!response.ok) throw new Error(`Could not load referrals (HTTP ${response.status})`);
        const payload = await response.json();
        if (cancelled) return;
        setReferralCode(payload?.referralCode || null);
        setReferrals(Array.isArray(payload?.referrals) ? payload.referrals : []);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setReferralCode(null);
        setReferrals([]);
        setLoadError(error instanceof Error ? error.message : 'Could not load referrals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShareWhatsApp = () => {
    if (!referralCode) return;
    const text = `Study abroad with ALO Education! Use my referral code: ${referralCode} when you register at aloeducation.com`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!referralCode) return;
    const subject = 'Study Abroad with ALO Education';
    const body = `Hi!\n\nI'm using ALO Education to plan my study abroad journey. You can too — use my referral code ${referralCode} when you register.\n\naloeducation.com`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Refer & Earn</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Share your referral code and earn rewards for every successful enrollment.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-[var(--alo-body)] mb-3">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-lg border border-blue-200 px-4 py-3 font-mono text-lg font-bold text-[var(--alo-text)] tracking-wider">
              {loading ? 'Loading…' : referralCode || 'No referral code issued yet'}
            </div>
            <Button
              onClick={handleCopy}
              disabled={!referralCode}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copied ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              disabled={!referralCode}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              onClick={handleShareWhatsApp}
            >
              <svg viewBox="0 0 24 24" className="size-4 mr-2 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share via WhatsApp
            </Button>
            <Button
              variant="outline"
              disabled={!referralCode}
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              onClick={handleShareEmail}
            >
              <Mail className="size-4 mr-2" />
              Share via Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats — derived from the real referral records */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total referred',
            value: loading ? '…' : String(referrals.length),
            icon: Users,
            color: 'text-blue-600',
          },
          {
            label: 'Enrolled',
            value: loading
              ? '…'
              : String(
                referrals.filter((referral) =>
                  ['ENROLLED', 'REWARDED'].includes(referral.status),
                ).length,
              ),
            icon: CheckCircle2,
            color: 'text-emerald-600',
          },
          {
            label: 'Rewards awarded',
            value: loading
              ? '…'
              : String(referrals.filter((referral) => referral.rewardStatus === 'AWARDED').length),
            icon: Gift,
            color: 'text-orange-600',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={cn('size-5 mx-auto mb-2', stat.color)} />
              <p className="text-2xl font-bold text-[var(--alo-text)]">{stat.value}</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError && (
            <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>
          )}
          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--alo-text-muted)]">Loading referrals…</p>
          ) : referrals.length === 0 && !loadError ? (
            <p className="py-8 text-center text-sm text-[var(--alo-text-muted)]">
              You have not referred anyone yet. Share your code to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referred</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="text-right">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium text-[var(--alo-text)]">
                      {referral.referredName || 'Name not provided'}
                    </TableCell>
                    <TableCell className="text-[var(--alo-text-muted)]">{formatDate(referral.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs font-medium',
                          STATUS_STYLES[referral.status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]',
                        )}
                      >
                        {(referral.status || 'UNKNOWN').replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--alo-body)]">
                      {referral.rewardOffered
                        ? `${referral.rewardOffered}${referral.rewardStatus ? ` · ${referral.rewardStatus}` : ''}`
                        : 'None recorded'}
                    </TableCell>
                    <TableCell className="text-right text-[var(--alo-text-muted)]">
                      {referral.source || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Share Your Code',
                desc: 'Send your unique referral code to friends who want to study abroad.',
                icon: Share2,
              },
              {
                step: '2',
                title: 'Friend Registers',
                desc: 'They sign up and mention your code during registration.',
                icon: Users,
              },
              {
                step: '3',
                title: 'Earn Reward',
                desc: 'Once they enrol, your referral record moves to enrolled and any agreed reward is tracked.',
                icon: Gift,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--alo-text)]">{item.title}</h4>
                  <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral Rules */}
      <Card className="border-orange-200 bg-orange-50/40">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="size-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--alo-text)]">Referral Rules</p>
            <p className="text-xs text-[var(--alo-body)] mt-1">
              Each referral you make is recorded against your code with its current status. Any
              reward is shown per referral only when one has been agreed and recorded on that
              record — reward amounts, eligibility conditions and expiry periods are set by your
              counsellor and are not stated here. Contact your counsellor for the current referral
              programme terms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  2. STUDENT HELP CENTER                                             */
/* ================================================================== */

const HELP_CATEGORIES = [
  { icon: FileText, title: 'Application Help', count: 12, color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Upload, title: 'Document Guide', count: 8, color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Shield, title: 'Visa Information', count: 15, color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: CreditCard, title: 'Payment & Finance', count: 10, color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: Search, title: 'Course Finder', count: 6, color: 'text-green-600', bg: 'bg-green-50' },
  { icon: GraduationCap, title: 'English Tests', count: 9, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { icon: Award, title: 'Scholarship Guide', count: 11, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Headphones, title: 'Technical Support', count: 7, color: 'text-[var(--alo-body)]', bg: 'bg-[var(--alo-page)]' },
];

const FAQ_DATA = [
  {
    q: 'How do I upload documents?',
    a: 'Navigate to "My Documents" from the sidebar. Click the "Upload Document" button, select the document type (e.g., Transcript, Passport, IELTS Certificate), and upload a clear PDF or image file. Our team will review it within 24-48 hours. You\'ll receive a notification once the document is verified or if any issues are found.',
  },
  {
    q: 'What is the visa application process?',
    a: 'After receiving a CAS (Confirmation of Acceptance for Studies) from your university, you can begin the visa application. Go to "Visa Guidance" to access your personalized checklist. You\'ll need to complete a TB test, prepare financial documents, and book a biometric appointment. Our counselors will guide you through each step and review your application before submission.',
  },
  {
    q: 'How can I contact my counselor?',
    a: 'You can message your counselor directly through the "Messages" section. If a counselor has been assigned to you, their name appears on that thread. Response times depend on who is assigned and when the message arrives, so we do not quote a fixed turnaround here.',
  },
  {
    q: 'What scholarships am I eligible for?',
    a: 'Scholarship eligibility depends on the specific award, and each one sets its own criteria. Open the "Scholarships" page to see awards that have been recorded with their requirements, amounts, deadlines and source, and check that source before you rely on any of them. Your counselor can also tell you which ones fit your profile.',
  },
  {
    q: 'How do I check my application status?',
    a: 'Go to "My Applications" to view all your submitted applications. Each application shows its current stage (Draft, Submitted, Conditional Offer, Unconditional Offer, etc.) with a timeline of updates. You\'ll also receive notifications for any status changes. Click on any application to see detailed information and required next steps.',
  },
];

export function StudentHelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Help Center</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Find answers, guides, and get support for your study abroad journey.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--alo-text-muted)]" />
        <Input
          placeholder="Search help articles..."
          className="pl-9 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Cards */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--alo-text)] mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HELP_CATEGORIES.map((cat) => (
            <Card
              key={cat.title}
              className="cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', cat.bg)}>
                  <cat.icon className={cn('size-5', cat.color)} />
                </div>
                <h3 className="text-sm font-medium text-[var(--alo-text)] group-hover:text-blue-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-[var(--alo-text-muted)]">{cat.count} articles</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_DATA.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-[var(--alo-text)] hover:text-blue-600 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--alo-body)] leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Still Need Help */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--alo-text)]">Still need help?</h3>
            <p className="text-sm text-[var(--alo-body)] mt-1">
              Reach your assigned counsellor through the Messages section, where the thread carries
              their name.
            </p>
            <p className="text-sm text-[var(--alo-text-muted)] mt-0.5">
              Published support numbers and opening hours are not shown here because none has been
              verified against a current source.
            </p>
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Headphones className="size-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  3. STUDENT SETTINGS                                                */
/* ================================================================== */

interface ToggleSetting {
  key: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}

export function StudentSettings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    const allSettings = [
      ...NOTIFICATION_SETTINGS,
      ...PRIVACY_SETTINGS,
    ];
    allSettings.forEach((s) => {
      defaults[s.key] = s.defaultChecked;
    });
    return defaults;
  });

  const [language, setLanguage] = useState('en');
  const [phone, setPhone] = useState('+880 1712-345678');

  const toggleSetting = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Settings</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Manage your account, notifications, and preferences.
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--alo-text-muted)]">Email</Label>
            <Input value="rahim.alam@email.com" readOnly className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--alo-text-muted)]">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Lock className="size-3.5 mr-1.5" />
            Change Password
          </Button>
          <div className="flex justify-end pt-2">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Notification Settings</CardTitle>
          <CardDescription>Choose how and when you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATION_SETTINGS.map((setting, i) => (
            <div key={setting.key}>
              <div className="flex items-center justify-between py-3">
                <div className="pr-4">
                  <Label className="text-sm font-medium text-[var(--alo-text)] cursor-pointer" htmlFor={setting.key}>
                    {setting.label}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{setting.description}</p>
                  )}
                </div>
                <Switch
                  id={setting.key}
                  checked={toggles[setting.key]}
                  onCheckedChange={() => toggleSetting(setting.key)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              {i < NOTIFICATION_SETTINGS.length - 1 && <Separator />}
            </div>
          ))}
          <div className="flex justify-end pt-3">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {PRIVACY_SETTINGS.map((setting, i) => (
            <div key={setting.key}>
              <div className="flex items-center justify-between py-3">
                <div className="pr-4">
                  <Label className="text-sm font-medium text-[var(--alo-text)] cursor-pointer" htmlFor={setting.key}>
                    {setting.label}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{setting.description}</p>
                  )}
                </div>
                <Switch
                  id={setting.key}
                  checked={toggles[setting.key]}
                  onCheckedChange={() => toggleSetting(setting.key)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              {i < PRIVACY_SETTINGS.length - 1 && <Separator />}
            </div>
          ))}
          <div className="flex justify-end pt-3">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              Save Privacy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--alo-text)]">Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <Languages className="size-4 text-[var(--alo-text-muted)]" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bn">বাংলা</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-red-700">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--alo-text)]">Request Data Export</p>
              <p className="text-xs text-[var(--alo-text-muted)]">Download all your data in a portable format.</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => toast.success('Data export requested. You will receive an email shortly.')}>
              <Download className="size-3.5 mr-1.5" />
              Export Data
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--alo-text)]">Deactivate Account</p>
              <p className="text-xs text-[var(--alo-text-muted)]">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="destructive" size="sm" className="shrink-0 bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="size-3.5 mr-1.5" />
                  Deactivate Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account, all
                    applications, documents, messages, and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => toast.error('Account deactivation is disabled in demo mode.')}
                  >
                    Yes, deactivate my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const NOTIFICATION_SETTINGS: ToggleSetting[] = [
  { key: 'notif-email', label: 'Email notifications', description: 'Receive updates via email', defaultChecked: true },
  { key: 'notif-whatsapp', label: 'WhatsApp notifications', description: 'Get alerts on WhatsApp', defaultChecked: true },
  { key: 'notif-deadline', label: 'Deadline reminders', description: 'Reminders before important deadlines', defaultChecked: true },
  { key: 'notif-app-updates', label: 'Application updates', description: 'Status changes for your applications', defaultChecked: true },
  { key: 'notif-doc-status', label: 'Document status', description: 'Document verification results', defaultChecked: false },
  { key: 'notif-scholarship', label: 'Scholarship alerts', description: 'New scholarship opportunities', defaultChecked: true },
  { key: 'notif-marketing', label: 'Marketing emails', description: 'Promotions and newsletters', defaultChecked: false },
];

const PRIVACY_SETTINGS: ToggleSetting[] = [
  {
    key: 'privacy-partners',
    label: 'Profile visible to partners',
    description: 'Allow university partners to see your basic profile for matching',
    defaultChecked: true,
  },
  {
    key: 'privacy-leaderboard',
    label: 'Show on public leaderboard',
    description: 'Display your achievements on the student leaderboard',
    defaultChecked: false,
  },
];

/* ================================================================== */
/*  4. STUDENT AI ADVISOR                                              */
/* ================================================================== */

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

const QUICK_CHIPS = [
  'Check my eligibility',
  'Recommend courses',
  'SOP tips',
  'Visa guidance',
  'Scholarship search',
  'Compare universities',
];

// A single real greeting. The old version scripted a whole exchange in
// which the assistant had already read the student's grades and returned a
// ranked university match — none of which had happened.
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'greeting',
    role: 'ai',
    content:
      "Hello, I'm your AI study coach. Ask me about destinations, courses, English tests, documents or visas. I do not have access to your grades or test scores, so I cannot rank you against a course — for that, use the course finder or ask your counselor.",
  },
];

export function StudentAIAdvisor() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', content: input.trim() };
    const aiMsg: ChatMessage = {
      id: `m-${Date.now() + 1}`,
      role: 'ai',
      content:
        "I can't answer that from anything I have verified, and I won't guess. For questions about your own grades, eligibility, fees or deadlines, ask the counsellor assigned to you — their name is on your message thread — or use the course finder, which shows the source recorded against each course.",
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  const handleChip = (chip: string) => {
    setInput(chip);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--alo-text)]">AI Study Coach</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Ask me anything about studying abroad</p>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 pb-4 shrink-0">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Zap className="size-3" />
            {chip}
          </button>
        ))}
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-340px)]"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="size-7 shrink-0 mt-0.5">
                  <AvatarFallback
                    className={cn(
                      'text-white text-xs',
                      msg.role === 'ai'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-slate-700'
                    )}
                  >
                    {msg.role === 'ai' ? <Bot className="size-3.5" /> : <UserIcon className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'ai'
                      ? 'bg-[var(--alo-surface-muted)] text-[var(--alo-text)] rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="px-4 pb-2">
            <p className="text-[11px] text-[var(--alo-text-muted)] text-center">
              AI suggestions are for guidance only. Always verify with your counselor.
            </p>
          </div>
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 flex gap-2 shrink-0">
          <Input
            placeholder="Ask me about courses, visas, scholarships..."
            className="flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  5. STUDENT RECOMMENDATIONS                                         */
/* ================================================================== */

// Real SavedCourse rows, per GET /api/student/shortlist.
interface ShortlistCourse {
  id: string;
  courseName: string;
  universityName: string;
  country: string;
  level: string;
  department: string;
  tuitionFee: string;
  intake: string;
  notes: string;
  createdAt: string;
}

function shortlistDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export function StudentRecommendations() {
  const [courses, setCourses] = useState<ShortlistCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/student/shortlist');
        if (!response.ok) throw new Error(`Could not load your shortlist (HTTP ${response.status})`);
        const payload = await response.json();
        if (cancelled) return;
        if (!payload?.success) throw new Error(payload?.error || 'Your shortlist is unavailable');
        setCourses(Array.isArray(payload.data) ? payload.data : []);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setCourses([]);
        setLoadError(error instanceof Error ? error.message : 'Could not load your shortlist');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Your shortlist</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Courses you have saved. Nothing is ranked or scored here: eligibility still has to be
          checked against each course&apos;s published requirements.
        </p>
      </div>

      {loadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="size-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--alo-text)]">
            Saved courses{!loading ? ` (${courses.length})` : ''}
          </h2>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--alo-text-muted)]">
              Loading your shortlist…
            </CardContent>
          </Card>
        ) : courses.length === 0 && !loadError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="size-8 mx-auto mb-3 text-[var(--alo-placeholder)]" />
              <p className="text-sm text-[var(--alo-body)] font-medium">You have not saved any course yet.</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1">
                Use the course finder to search verified courses, then save the ones you want to
                compare.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--alo-text)]">
                        {course.courseName || 'Course name not recorded'}
                      </p>
                      <p className="text-xs text-[var(--alo-body)] mt-0.5">
                        {course.universityName || 'University not recorded'}
                        {course.country ? ` · ${course.country}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {course.level || 'Level not recorded'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-[var(--alo-text-muted)]">Department</p>
                      <p className="text-[var(--alo-text)]">{course.department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--alo-text-muted)]">Intake</p>
                      <p className="text-[var(--alo-text)]">{course.intake || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--alo-text-muted)]">Tuition fee</p>
                      <p className="text-[var(--alo-text)]">{course.tuitionFee || 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--alo-text-muted)]">Saved</p>
                      <p className="text-[var(--alo-text)]">{shortlistDate(course.createdAt)}</p>
                    </div>
                  </div>

                  {course.notes ? (
                    <p className="text-xs text-[var(--alo-body)] mt-3 border-t border-[var(--alo-border)] pt-2">
                      {course.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border-orange-200 bg-orange-50/40">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="size-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--alo-text)]">About eligibility and scholarships</p>
            <p className="text-xs text-[var(--alo-body)] mt-1">
              This page does not score a match, quote a scholarship amount or state a deadline,
              because none of those figures is verified here. Before you rely on an entry
              requirement, fee or funding amount, check the course record and the source recorded
              against it, or ask your counsellor to confirm it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
