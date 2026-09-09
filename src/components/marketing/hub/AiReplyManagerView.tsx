"use client";

import React, { useState } from "react";
import {
  Bot,
  MessageSquare,
  ShieldCheck,
  ArrowRightLeft,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Clock,
  Languages,
  Eye,
  Send,
  AlertTriangle,
  CreditCard,
  Plane,
  HeadphonesIcon,
  PhoneCall,
  Volume2,
  ImageIcon,
  Mic,
  MousePointerClick,
  Mail,
  Ban,
  Unlock,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Zap,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Globe,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ---------- mock data ---------- */

const mockConversations = [
  { id: "c1", contact: "Rahim Uddin", phone: "+8801712345678", language: "Bangla", messages: 14, leadCreated: true, studentId: "STU-2045", satisfaction: "Positive", counselor: "Fatima Akter" },
  { id: "c2", contact: "Sara Islam", phone: "+8801898765432", language: "English", messages: 8, leadCreated: false, studentId: "—", satisfaction: "Neutral", counselor: "Karim Hossain" },
  { id: "c3", contact: "Mizanur Rahman", phone: "+8801534567890", language: "Mixed", messages: 22, leadCreated: true, studentId: "STU-2047", satisfaction: "Positive", counselor: "Nusrat Jahan" },
  { id: "c4", contact: "Tasnim Akter", phone: "+8801678901234", language: "Bangla", messages: 5, leadCreated: false, studentId: "—", satisfaction: "Negative", counselor: "Rezaul Haque" },
  { id: "c5", contact: "Arif Hossain", phone: "+8801612345678", language: "English", messages: 31, leadCreated: true, studentId: "STU-2050", satisfaction: "Positive", counselor: "Farhana Begum" },
];

const mockReplyRules = [
  { id: "r1", trigger: "Hi / Hello / Salam", reply: "Assalamu Alaikum! Welcome to ALO Education. How can we assist you with your study abroad plans today?", language: "Bangla", active: true },
  { id: "r2", trigger: "Hi / Hello / Salam", reply: "Hello! Welcome to ALO Education. How can we help you with studying abroad?", language: "English", active: true },
  { id: "r3", trigger: "Fee / Cost / Price", reply: "Thank you for your interest! Our consultation fee starts from BDT 500. For detailed pricing, please share which country and program you are interested in.", language: "Mixed", active: true },
  { id: "r4", trigger: "IELTS / PTE / TOEFL", reply: "We offer comprehensive IELTS & PTE preparation courses. Would you like to know about our upcoming batch schedules?", language: "English", active: false },
  { id: "r5", trigger: "Visa / Requirements", reply: "ভিসা রিকোয়ারমেন্ট নিয়ে আপনাকে সাহায্য করতে পারি। আপনি কোন দেশে আবেদন করতে চান?", language: "Bangla", active: true },
  { id: "r6", trigger: "Scholarship", reply: "Great news! We have scholarship updates for the UK, Australia, and Canada. Which country interests you most?", language: "English", active: true },
];

const mockBlockedUsers = [
  { id: "b1", name: "Spam Account 1", phone: "+8801899000111", reason: "Repeated spam messages", blockedAt: "2025-01-10", blockedBy: "System" },
  { id: "b2", name: "Fake Recruiter", phone: "+8801677000222", reason: "Impersonating ALO staff", blockedAt: "2025-01-15", blockedBy: "Admin" },
  { id: "b3", name: "Abusive User", phone: "+8801555000333", reason: "Harassment & abusive language", blockedAt: "2025-02-01", blockedBy: "Fatima Akter" },
];

const mockTransferHistory = [
  { id: "t1", contact: "Complex Visa Query", from: "AI Bot", to: "Fatima Akter", reason: "Complex query – multiple visa options", transferredAt: "2025-02-10 14:23" },
  { id: "t2", contact: "Angry Parent", from: "AI Bot", to: "Karim Hossain", reason: "Customer expressed anger / frustration", transferredAt: "2025-02-11 09:45" },
  { id: "t3", contact: "Payment Dispute", from: "AI Bot", to: "Nusrat Jahan", reason: "Payment-related query detected", transferredAt: "2025-02-12 16:10" },
  { id: "t4", contact: "Emergency Travel", from: "AI Bot", to: "Rezaul Haque", reason: "Emergency – urgent visa / travel", transferredAt: "2025-02-13 08:02" },
];

/* ---------- main component ---------- */

export default function AiReplyManagerView() {
  const [aiMasterToggle, setAiMasterToggle] = useState(true);
  const [afterHoursEnabled, setAfterHoursEnabled] = useState(true);
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [typingSeen, setTypingSeen] = useState(true);
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [voiceAnalysis, setVoiceAnalysis] = useState(true);
  const [imageAnalysis, setImageAnalysis] = useState(true);
  const [searchBlocked, setSearchBlocked] = useState("");
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({ trigger: "", reply: "", language: "Bangla" });

  const transferTriggers = [
    { label: "Complex Query", icon: AlertTriangle, enabled: true },
    { label: "Angry / Frustrated", icon: HeadphonesIcon, enabled: true },
    { label: "Payment Related", icon: CreditCard, enabled: true },
    { label: "Visa / Immigration", icon: Plane, enabled: true },
    { label: "Complaint", icon: PhoneCall, enabled: true },
    { label: "Emergency", icon: Zap, enabled: true },
  ];

  const [triggerStates, setTriggerStates] = useState(
    Object.fromEntries(transferTriggers.map((t) => [t.label, t.enabled]))
  );

  const toggleTrigger = (label: string) => {
    setTriggerStates((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-purple-500" />
            AI Reply Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI auto-replies, conversation handling, rules, and block/transfer policies for ALO Education.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white">
            <span className="text-sm font-medium text-muted-foreground">AI Master</span>
            <Switch checked={aiMasterToggle} onCheckedChange={setAiMasterToggle} />
            <span className={`text-sm font-semibold ${aiMasterToggle ? "text-purple-600" : "text-gray-400"}`}>
              {aiMasterToggle ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Conversations", value: "142", icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
          { label: "Replies Today", value: "1,285", icon: Send, color: "text-green-600 bg-green-50" },
          { label: "Transferred to Human", value: "23", icon: ArrowRightLeft, color: "text-amber-600 bg-amber-50" },
          { label: "Blocked Users", value: mockBlockedUsers.length, icon: Ban, color: "text-red-600 bg-red-50" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Reply Config
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            AI Conversations
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Rule-based Replies
          </TabsTrigger>
          <TabsTrigger value="block" className="gap-1.5">
            <Ban className="h-4 w-4" />
            Block/Transfer
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: Reply Config ===== */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Office Hours & After Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Office Hours
                </CardTitle>
                <CardDescription>Configure active response window and after-hours behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Time</Label>
                    <Input type="time" defaultValue="10:00" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <Input type="time" defaultValue="18:00" className="mt-1" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">After-hours Auto-reply</p>
                    <p className="text-xs text-muted-foreground">Send automated response outside office hours</p>
                  </div>
                  <Switch checked={afterHoursEnabled} onCheckedChange={setAfterHoursEnabled} />
                </div>
                {afterHoursEnabled && (
                  <Textarea
                    placeholder="After-hours reply message..."
                    defaultValue="Thank you for reaching ALO Education! Our office hours are 10 AM – 6 PM. We'll get back to you as soon as possible. আমাদের অফিস সময় সকাল ১০টা – সন্ধ্যা ৬টা।"
                    className="min-h-[80px]"
                  />
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Follow-up Automation</p>
                    <p className="text-xs text-muted-foreground">Auto-follow-up on unanswered leads after 24h</p>
                  </div>
                  <Switch checked={followUpEnabled} onCheckedChange={setFollowUpEnabled} />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-purple-500" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>OTP verification and data protection settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">OTP Before Private Data</p>
                    <p className="text-xs text-muted-foreground">Require OTP verification before sharing personal/sensitive data</p>
                  </div>
                  <Switch checked={otpEnabled} onCheckedChange={setOtpEnabled} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Supported Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
                      <Globe className="h-3 w-3" /> Bangla
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
                      <Globe className="h-3 w-3" /> English
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
                      <Globe className="h-3 w-3" /> Mixed (Benglish)
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conversation Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Typing & Seen Indicators</span>
                      </div>
                      <Switch checked={typingSeen} onCheckedChange={setTypingSeen} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Voice Message Analysis</span>
                      </div>
                      <Switch checked={voiceAnalysis} onCheckedChange={setVoiceAnalysis} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Image / Document Analysis</span>
                      </div>
                      <Switch checked={imageAnalysis} onCheckedChange={setImageAnalysis} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Human Transfer Triggers */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                  Human Transfer Triggers
                </CardTitle>
                <CardDescription>
                  Automatically transfer to a human counselor when these situations are detected by AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transferTriggers.map((trigger) => (
                    <div
                      key={trigger.label}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        triggerStates[trigger.label] ? "border-purple-200 bg-purple-50" : "border-muted bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${triggerStates[trigger.label] ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          <trigger.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{trigger.label}</span>
                      </div>
                      <Switch checked={triggerStates[trigger.label]} onCheckedChange={() => toggleTrigger(trigger.label)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Per-Conversation AI Toggle */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-5 w-5 text-purple-500" />
                  Per-Conversation AI Settings
                </CardTitle>
                <CardDescription>Enable or disable AI replies for specific conversation categories.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conversation Type</TableHead>
                      <TableHead className="text-center">AI Enabled</TableHead>
                      <TableHead>Auto-welcome</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { type: "General Inquiry", aiEnabled: true, autoWelcome: true, active: true },
                      { type: "Course Information", aiEnabled: true, autoWelcome: true, active: true },
                      { type: "Visa & Immigration", aiEnabled: false, autoWelcome: true, active: true },
                      { type: "Scholarship Queries", aiEnabled: true, autoWelcome: false, active: true },
                      { type: "IELTS / PTE Prep", aiEnabled: true, autoWelcome: true, active: true },
                      { type: "Payment & Billing", aiEnabled: false, autoWelcome: false, active: true },
                      { type: "Complaints & Feedback", aiEnabled: false, autoWelcome: false, active: true },
                      { type: "Document Collection", aiEnabled: true, autoWelcome: false, active: true },
                    ].map((row) => (
                      <TableRow key={row.type}>
                        <TableCell className="font-medium">{row.type}</TableCell>
                        <TableCell className="text-center">
                          <Switch defaultChecked={row.aiEnabled} />
                        </TableCell>
                        <TableCell>{row.autoWelcome ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-gray-300 mx-auto" />}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.active ? "default" : "secondary"} className={row.active ? "bg-purple-500 hover:bg-purple-600" : ""}>
                            {row.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAB 2: AI Conversations ===== */}
        <TabsContent value="conversations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    AI-Handled Conversations
                  </CardTitle>
                  <CardDescription>Recent conversations managed by the AI reply system.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-9 w-64" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-3.5 w-3.5" /> Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-center">Messages</TableHead>
                      <TableHead className="text-center">Lead Created</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockConversations.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{conv.contact}</p>
                            <p className="text-xs text-muted-foreground">{conv.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              conv.language === "Bangla"
                                ? "border-purple-200 bg-purple-50 text-purple-600"
                                : conv.language === "English"
                                ? "border-blue-200 bg-blue-50 text-blue-600"
                                : "border-amber-200 bg-amber-50 text-amber-600"
                            }
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            {conv.language}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{conv.messages}</TableCell>
                        <TableCell className="text-center">
                          {conv.leadCreated ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{conv.studentId}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              conv.satisfaction === "Positive"
                                ? "border-green-200 bg-green-50 text-green-600"
                                : conv.satisfaction === "Negative"
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                            }
                          >
                            {conv.satisfaction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{conv.counselor}</TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4 text-purple-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View conversation</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Transfer to human</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 3: Rule-based Replies ===== */}
        <TabsContent value="rules" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-purple-500" />
                    Rule-based Reply Templates
                  </CardTitle>
                  <CardDescription>
                    Pre-configured replies that bypass AI, saving cost and ensuring consistency. These trigger on exact keyword matches.
                  </CardDescription>
                </div>
                <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-500 hover:bg-purple-600 gap-1.5">
                      <Plus className="h-4 w-4" /> Add Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-purple-500" />
                        Add Reply Rule
                      </DialogTitle>
                      <DialogDescription>
                        Define a trigger keyword and the reply template. This rule will bypass AI processing.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label>Trigger Keywords</Label>
                        <Input
                          placeholder="e.g., Hi / Hello / Salam"
                          value={newRule.trigger}
                          onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate keywords with &quot; / &quot;</p>
                      </div>
                      <div>
                        <Label>Reply Template</Label>
                        <Textarea
                          placeholder="Enter the auto-reply message..."
                          value={newRule.reply}
                          onChange={(e) => setNewRule({ ...newRule, reply: e.target.value })}
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label>Language</Label>
                        <Select value={newRule.language} onValueChange={(v) => setNewRule({ ...newRule, language: v })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bangla">Bangla</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Mixed">Mixed (Benglish)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddRuleOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-purple-500 hover:bg-purple-600" onClick={() => setAddRuleOpen(false)}>
                        Save Rule
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger Keywords</TableHead>
                      <TableHead>Reply Template</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReplyRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs border-purple-200 bg-purple-50 text-purple-700">
                            {rule.trigger}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs truncate">{rule.reply}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-600">
                            <Globe className="h-3 w-3 mr-1" />
                            {rule.language}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={rule.active ? "default" : "secondary"} className={rule.active ? "bg-purple-500 hover:bg-purple-600" : ""}>
                            {rule.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4 text-purple-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <strong>Cost Saver:</strong> Rule-based replies bypass AI processing, reducing API costs for common greetings and FAQs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 4: Block/Transfer ===== */}
        <TabsContent value="block" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blocked Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ban className="h-5 w-5 text-red-500" />
                  Blocked Users
                </CardTitle>
                <CardDescription>Manage blocked numbers. They will not receive any replies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search blocked users..."
                    className="pl-9"
                    value={searchBlocked}
                    onChange={(e) => setSearchBlocked(e.target.value)}
                  />
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {mockBlockedUsers.map((user) => (
                    <div key={user.id} className="flex items-start justify-between p-3 rounded-lg border bg-red-50/50">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                        <p className="text-xs text-red-600">Reason: {user.reason}</p>
                        <p className="text-xs text-muted-foreground">Blocked on {user.blockedAt} by {user.blockedBy}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200 hover:bg-green-50 shrink-0">
                        <Unlock className="h-3.5 w-3.5" /> Unblock
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                        <Ban className="h-3.5 w-3.5" /> Block New Number
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Block a Phone Number</DialogTitle>
                        <DialogDescription>This number will not receive any messages from ALO Education.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>Phone Number</Label>
                          <Input placeholder="+8801XXXXXXXXX" className="mt-1" />
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <Textarea placeholder="Reason for blocking..." className="mt-1" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" className="gap-1">
                          <Ban className="h-4 w-4" /> Block Number
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Transfer History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                  Transfer History
                </CardTitle>
                <CardDescription>Recent AI-to-human transfers triggered by automated rules.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                  {mockTransferHistory.map((transfer) => (
                    <div key={transfer.id} className="p-3 rounded-lg border bg-amber-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{transfer.contact}</p>
                        <span className="text-xs text-muted-foreground">{transfer.transferredAt}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                          <Bot className="h-3 w-3 mr-1" /> {transfer.from}
                        </Badge>
                        <ChevronRight className="h-3 w-3" />
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          <UserCheck className="h-3 w-3 mr-1" /> {transfer.to}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        {transfer.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
