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

const REFERRAL_HISTORY = [
  { name: 'Karim Hossain', date: '2025-09-15', status: 'Converted' as const, reward: '৳5,000' },
  { name: 'Fatima Begum', date: '2025-09-28', status: 'Pending' as const, reward: '—' },
  { name: 'Tanvir Ahmed', date: '2025-10-02', status: 'Not Eligible' as const, reward: '—' },
];

const STATUS_STYLES: Record<string, string> = {
  Converted: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  'Not Eligible': 'bg-slate-100 text-slate-500',
};

export function StudentReferrals() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'RAHIM-AE-2025';

  const handleCopy = async () => {
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
    const text = `Study abroad with ALO Education! Use my referral code: ${referralCode} to get special benefits. Register now at aloeducation.com`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = 'Study Abroad with ALO Education';
    const body = `Hi!\n\nI'm using ALO Education to plan my study abroad journey. You can too — use my referral code ${referralCode} when you register.\n\naloeducation.com`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refer & Earn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share your referral code and earn rewards for every successful enrollment.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-lg border border-blue-200 px-4 py-3 font-mono text-lg font-bold text-slate-900 tracking-wider">
              {referralCode}
            </div>
            <Button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copied ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
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
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              onClick={handleShareEmail}
            >
              <Mail className="size-4 mr-2" />
              Share via Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Referred', value: '3', icon: Users, color: 'text-blue-600' },
          { label: 'Converted', value: '1', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Earned', value: '৳5,000', icon: Gift, color: 'text-orange-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={cn('size-5 mx-auto mb-2', stat.color)} />
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REFERRAL_HISTORY.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-slate-900">{r.name}</TableCell>
                  <TableCell className="text-slate-500">{r.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn('text-xs font-medium', STATUS_STYLES[r.status])}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{r.reward}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">How It Works</CardTitle>
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
                desc: 'Once they successfully enroll, you earn ৳5,000!',
                icon: Gift,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
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
            <p className="text-sm font-semibold text-slate-900">Referral Rules</p>
            <p className="text-xs text-slate-600 mt-1">
              Earn ৳5,000 for each successful enrollment through your referral. The reward is credited
              to your account once your referral completes their first semester. Referral codes are
              valid for 6 months from the date of sharing. ALO Education reserves the right to modify
              the referral program terms.
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
  { icon: Headphones, title: 'Technical Support', count: 7, color: 'text-slate-600', bg: 'bg-slate-50' },
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
    a: 'You can message your counselor directly through the "Messages" section. Your assigned counselor (Sarah Khan) typically responds within 2-4 business hours. For urgent matters, you can also reach us via WhatsApp at +880 1700-000000 or call our office during business hours (Sat-Thu, 9 AM - 6 PM BST).',
  },
  {
    q: 'What scholarships am I eligible for?',
    a: 'Based on your academic profile (SSC GPA 5.0, HSC GPA 4.80, IELTS 7.0), you may be eligible for several scholarships including Chevening, Commonwealth, and university-specific merit awards. Check the "Scholarships" page for a personalized list with deadlines and requirements. We recommend applying early as most deadlines are 6-12 months before intake.',
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
        <h1 className="text-2xl font-bold text-slate-900">Help Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Find answers, guides, and get support for your study abroad journey.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search help articles..."
          className="pl-9 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Browse by Category</h2>
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
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-400">{cat.count} articles</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_DATA.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 leading-relaxed">
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
            <h3 className="text-base font-semibold text-slate-900">Still need help?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Our support team is available Sat–Thu, 9 AM – 6 PM BST.
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              WhatsApp: <span className="font-medium text-slate-700">+880 1700-000000</span>
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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account, notifications, and preferences.
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Email</Label>
            <Input value="rahim.alam@email.com" readOnly className="bg-slate-50 text-slate-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Phone</Label>
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
          <CardTitle className="text-base font-semibold text-slate-900">Notification Settings</CardTitle>
          <CardDescription>Choose how and when you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATION_SETTINGS.map((setting, i) => (
            <div key={setting.key}>
              <div className="flex items-center justify-between py-3">
                <div className="pr-4">
                  <Label className="text-sm font-medium text-slate-900 cursor-pointer" htmlFor={setting.key}>
                    {setting.label}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
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
          <CardTitle className="text-base font-semibold text-slate-900">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {PRIVACY_SETTINGS.map((setting, i) => (
            <div key={setting.key}>
              <div className="flex items-center justify-between py-3">
                <div className="pr-4">
                  <Label className="text-sm font-medium text-slate-900 cursor-pointer" htmlFor={setting.key}>
                    {setting.label}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
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
          <CardTitle className="text-base font-semibold text-slate-900">Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <Languages className="size-4 text-slate-500" />
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
              <p className="text-sm font-medium text-slate-900">Request Data Export</p>
              <p className="text-xs text-slate-500">Download all your data in a portable format.</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => toast.success('Data export requested. You will receive an email shortly.')}>
              <Download className="size-3.5 mr-1.5" />
              Export Data
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Deactivate Account</p>
              <p className="text-xs text-slate-500">
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'ai',
    content:
      "Hello Rahim! I'm your AI Study Coach. How can I help you today?",
  },
  {
    id: 'm2',
    role: 'user',
    content: 'What courses match my profile?',
  },
  {
    id: 'm3',
    role: 'ai',
    content:
      "Based on your IELTS 7.0, SSC GPA 5.0, HSC GPA 4.80, and preference for UK, I found 8 strong matches. Your top match is MSc Artificial Intelligence at University of Southampton (90% fit). Would you like me to show the full list?",
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
        "Great question! Let me look into that for you. Based on the latest data available, I'd recommend discussing this in detail with your counselor Sarah Khan for the most personalized guidance. Would you like me to help with anything else?",
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
          <h1 className="text-lg font-bold text-slate-900">AI Study Coach</h1>
          <p className="text-xs text-slate-500">Ask me anything about studying abroad</p>
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
                      ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
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
            <p className="text-[10px] text-slate-400 text-center">
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

const COURSE_RECS = [
  {
    id: 'cr1',
    university: 'University of Southampton',
    course: 'MSc Artificial Intelligence',
    country: 'UK',
    match: 90,
    reason: 'Strong match with your Computer Science background and IELTS 7.0. This program offers a specialization in machine learning that aligns with your interests.',
    deadline: '2025-07-01',
    scholarship: true,
  },
  {
    id: 'cr2',
    university: 'University of Manchester',
    course: 'MSc Data Science',
    country: 'UK',
    match: 85,
    reason: 'Your HSC GPA of 4.80 exceeds their minimum requirement. The program includes an industry placement year, which adds to your employability.',
    deadline: '2025-07-15',
    scholarship: false,
  },
  {
    id: 'cr3',
    university: 'University of Birmingham',
    course: 'MSc Computer Science',
    country: 'UK',
    match: 82,
    reason: 'Offers a flexible curriculum allowing you to choose AI/ML modules. Campus has a strong South Asian student community.',
    deadline: '2025-08-01',
    scholarship: true,
  },
  {
    id: 'cr4',
    university: 'University of Leeds',
    course: 'MSc Advanced Computer Science',
    country: 'UK',
    match: 78,
    reason: 'Russell Group university with excellent research facilities. Your profile meets all entry requirements comfortably.',
    deadline: '2025-06-30',
    scholarship: false,
  },
];

const SCHOLARSHIP_RECS = [
  {
    id: 'sr1',
    name: 'Chevening Scholarship',
    provider: 'UK Government',
    amount: 'Full tuition + living allowance',
    deadline: 'Nov 5, 2025',
    match: 'High',
    description: 'Fully funded scholarship for a one-year master\'s program in the UK. Your academic profile and leadership potential make you a strong candidate.',
  },
  {
    id: 'sr2',
    name: 'Commonwealth Scholarship',
    provider: 'Commonwealth Scholarship Commission',
    amount: 'Full tuition + travel + living',
    deadline: 'Dec 15, 2025',
    match: 'Medium',
    description: 'For students from developing Commonwealth countries. Requires a strong academic record and a clear development impact plan.',
  },
  {
    id: 'sr3',
    name: 'University of Southampton International Scholarship',
    provider: 'University of Southampton',
    amount: '£3,000 - £5,000',
    deadline: 'Rolling',
    match: 'High',
    description: 'Automatically considered for eligible international applicants. Merit-based with your IELTS 7.0 making you highly competitive.',
  },
];

const ACTION_ITEMS = [
  {
    id: 'ai1',
    title: 'Complete your IELTS to unlock 15 more courses',
    description: 'Some top universities require IELTS 7.5. Consider retaking to expand your options.',
    icon: Target,
    priority: 'high' as const,
    progress: 70,
  },
  {
    id: 'ai2',
    title: 'Upload passport to improve visa readiness',
    description: 'Your passport scan is missing. Upload it to track your visa checklist progress.',
    icon: Upload,
    priority: 'high' as const,
    progress: 0,
  },
  {
    id: 'ai3',
    title: 'Write your Statement of Purpose',
    description: 'A strong SOP can boost your chances by 30%. Start with our AI-powered SOP builder.',
    icon: BookOpen,
    priority: 'medium' as const,
    progress: 40,
  },
  {
    id: 'ai4',
    title: 'Get a recommendation letter',
    description: 'Most UK universities require 2 academic references. Reach out to your professors early.',
    icon: MessageSquare,
    priority: 'medium' as const,
    progress: 0,
  },
];

const PROFILE_IMPROVEMENTS = [
  { label: 'IELTS Score', current: '7.0', target: '7.5', progress: 85, color: 'bg-blue-500' },
  { label: 'Documents Uploaded', current: '6/10', target: '10/10', progress: 60, color: 'bg-amber-500' },
  { label: 'Profile Completeness', current: '75%', target: '100%', progress: 75, color: 'bg-emerald-500' },
  { label: 'SOP Readiness', current: 'Draft', target: 'Final', progress: 40, color: 'bg-purple-500' },
];

export function StudentRecommendations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recommended for You</h1>
        <p className="text-sm text-slate-500 mt-1">
          Personalized recommendations based on your academic profile and preferences.
        </p>
      </div>

      {/* Course Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="size-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Course Recommendations</h2>
        </div>
        <div className="space-y-3">
          {COURSE_RECS.map((course) => (
            <Card key={course.id} className="hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Match Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-blue-50">
                      <span className="text-lg font-bold text-blue-700">{course.match}%</span>
                      <span className="text-[10px] text-blue-500 font-medium">Match</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {course.course}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {course.university} · {course.country}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {course.scholarship && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            <Award className="size-3 mr-0.5" />
                            Scholarship
                          </Badge>
                        )}
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700">
                          <ArrowUpRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{course.reason}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="size-3" />
                        Deadline: {course.deadline}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scholarship Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="size-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-900">Scholarship Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCHOLARSHIP_RECS.map((sch) => (
            <Card key={sch.id} className="hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                    {sch.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] shrink-0',
                      sch.match === 'High' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {sch.match} match
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">{sch.provider}</p>
                <p className="text-sm font-semibold text-slate-900 mb-2">{sch.amount}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{sch.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="size-3" />
                    {sch.deadline}
                  </span>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="size-5 text-orange-600" />
          <h2 className="text-base font-semibold text-slate-900">Next Actions</h2>
        </div>
        <div className="space-y-3">
          {ACTION_ITEMS.map((item) => (
            <Card key={item.id} className="hover:border-orange-200 transition-all">
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    item.priority === 'high' ? 'bg-red-50' : 'bg-amber-50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'size-4.5',
                      item.priority === 'high' ? 'text-red-600' : 'text-amber-600'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-900">{item.title}</h4>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] shrink-0',
                        item.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  {item.progress > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">Progress</span>
                        <span className="text-[10px] font-medium text-slate-600">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Improve Your Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="size-5 text-blue-600" />
            Improve Your Profile
          </CardTitle>
          <CardDescription>Complete these items to unlock better recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PROFILE_IMPROVEMENTS.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                <span className="text-xs text-slate-500">
                  {item.current} → <span className="font-medium text-blue-600">{item.target}</span>
                </span>
              </div>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full transition-all', item.color)}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}