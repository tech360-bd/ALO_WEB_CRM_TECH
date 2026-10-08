"use client";

import React, { useState } from "react";
import {
  Palette,
  FileEdit,
  Wand2,
  LayoutGrid,
  Upload,
  ImagePlus,
  Eye,
  Send,
  CalendarDays,
  Hash,
  MousePointerClick,
  Globe,
  Type,
  Check,
  X,
  Pencil,
  Trash2,
  Copy,
  Star,
  Clock,
  Download,
  ZoomIn,
  Sparkles,
  MessageSquareText,
  Video,
  Film,
  BookOpen,
  GraduationCap,
  Plane,
  Trophy,
  HelpCircle,
  Phone,
  Timer,
  Target,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Layers,
  ChevronDown,
  FileText,
  Megaphone,
  Quote,
  Image as ImageIcon,
  Square,
  Plus,
  Save,
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
import { Separator } from "@/components/ui/separator";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ---------- mock data ---------- */

const mockTemplates = [
  { id: "tmpl1", name: "University Spotlight", category: "University", platform: "Facebook", type: "Image", lastUsed: "2025-02-10", status: "Approved", likes: 234 },
  { id: "tmpl2", name: "Visa Success Story", category: "Visa Tips", platform: "Instagram", type: "Carousel", lastUsed: "2025-02-08", status: "Approved", likes: 567 },
  { id: "tmpl3", name: "Scholarship Alert", category: "Scholarship", platform: "LinkedIn", type: "Text", lastUsed: "2025-02-05", status: "Approved", likes: 189 },
  { id: "tmpl4", name: "IELTS Tips Weekly", category: "IELTS-PTE", platform: "Facebook", type: "Image", lastUsed: "2025-02-03", status: "Draft", likes: 0 },
  { id: "tmpl5", name: "Student Testimonial", category: "Student Success", platform: "YouTube Shorts", type: "Video", lastUsed: "2025-02-01", status: "Approved", likes: 1023 },
  { id: "tmpl6", name: "Country Guide: UK", category: "Country", platform: "Website Blog", type: "Text", lastUsed: "2025-01-28", status: "Approved", likes: 456 },
  { id: "tmpl7", name: "Deadline Reminder", category: "Deadline", platform: "WhatsApp Status", type: "Image", lastUsed: "2025-01-25", status: "Approved", likes: 89 },
  { id: "tmpl8", name: "Consultation CTA", category: "Consultation", platform: "Facebook", type: "Image", lastUsed: "2025-01-22", status: "Draft", likes: 0 },
  { id: "tmpl9", name: "Lead Gen Quiz", category: "Lead Gen", platform: "Instagram", type: "Story", lastUsed: "2025-01-20", status: "Approved", likes: 321 },
];

const platformIcons: Record<string, React.ElementType> = {
  Facebook: Facebook,
  Instagram: Instagram,
  LinkedIn: Linkedin,
  TikTok: Megaphone,
  "YouTube Shorts": Youtube,
  "WhatsApp Status": Phone,
  "Website Blog": Globe,
};

const contentCategories = [
  "Country",
  "University",
  "Visa Tips",
  "Scholarship",
  "IELTS-PTE",
  "Student Success",
  "FAQ",
  "Consultation",
  "Deadline",
  "Lead Gen",
];

/* ---------- main component ---------- */

export default function BrandAssetsPostCreatorView() {
  /* Brand Assets state */
  const [logoWatermark, setLogoWatermark] = useState(true);
  const [selectedBrandColor, setSelectedBrandColor] = useState("primary");

  const brandColors = [
    { key: "primary", label: "Primary Orange", hex: "#F97316", tw: "bg-[#F97316]" },
    { key: "white", label: "White Background", hex: "#FFFFFF", tw: "bg-white border border-gray-200" },
    { key: "blue", label: "Professional Blue", hex: "#1E40AF", tw: "bg-[#1E40AF]" },
    { key: "dark", label: "Dark Gray", hex: "#374151", tw: "bg-gray-700" },
  ];

  /* Post Creator state */
  const [platform, setPlatform] = useState("Facebook");
  const [contentType, setContentType] = useState("Image");
  const [category, setCategory] = useState("University");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [ctaType, setCtaType] = useState("Learn More");
  const [landingLink, setLandingLink] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const ctaOptions = [
    "Learn More",
    "Apply Now",
    "Book Consultation",
    "Call Us",
    "Visit Website",
    "Download Guide",
    "Register for IELTS",
    "Watch Video",
    "Share",
    "Comment",
  ];

  /* AI Generator state */
  const [aiTopic, setAiTopic] = useState("");
  const [aiCountry, setAiCountry] = useState("");
  const [aiPlatform, setAiPlatform] = useState("Facebook");
  const [aiLanguage, setAiLanguage] = useState("English");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiOutput, setAiOutput] = useState({
    caption: "",
    hashtags: "",
    cta: "",
    imagePrompt: "",
    videoScript: "",
  });

  /* Template state */
  const [templateFilter, setTemplateFilter] = useState("All");
  const templateCategories = ["All", ...contentCategories];

  const handleAIGenerate = () => {
    setAiGenerated(true);
    setAiOutput({
      caption: `🎓 Study at ${aiCountry || "Top Universities"} with ALO Education! ${aiTopic ? `Learn about ${aiTopic}` : "Discover world-class programs"} and take the first step toward your international education journey.`,
      hashtags: "#ALOEducation #StudyAbroad #InternationalEducation #Scholarship #IELTS #StudentLife #Bangladesh #EducationConsultant",
      cta: "Book your FREE consultation today! Visit alo.edu.bd or call +8801700000000",
      imagePrompt: `Professional education marketing image featuring students celebrating with graduation caps, university campus background, ALO Education branding in orange (#F97316), modern and inspiring visual suitable for ${aiPlatform}`,
      videoScript: `[0:00] Hook: "Want to study abroad but don't know where to start?"\n[0:03] Introduce ALO Education services\n[0:08] Highlight key benefits and success stories\n[0:12] Show student testimonials\n[0:15] CTA: "Book your free consultation now!"`,
    });
  };

  const charCount = caption.length;
  const maxCharMap: Record<string, number> = {
    Facebook: 5000,
    Instagram: 2200,
    LinkedIn: 3000,
    TikTok: 2200,
    "YouTube Shorts": 5000,
    "WhatsApp Status": 700,
    "Website Blog": 10000,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-7 w-7 text-[#F97316]" />
            Brand Assets & Post Creator
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage ALO Education brand assets, create social media posts, generate AI content, and use saved templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export Brand Kit
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Posts Created", value: "248", icon: FileEdit, color: "text-[#F97316] bg-orange-50" },
          { label: "Approved Templates", value: "37", icon: LayoutGrid, color: "text-green-600 bg-green-50" },
          { label: "Scheduled Posts", value: "12", icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
          { label: "AI Generations", value: "89", icon: Sparkles, color: "text-purple-600 bg-purple-50" },
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
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="assets" className="gap-1.5">
            <Palette className="h-4 w-4" />
            Brand Assets
          </TabsTrigger>
          <TabsTrigger value="creator" className="gap-1.5">
            <FileEdit className="h-4 w-4" />
            Post Creator
          </TabsTrigger>
          <TabsTrigger value="ai-generator" className="gap-1.5">
            <Wand2 className="h-4 w-4" />
            AI Content Generator
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Template Library
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: Brand Assets ===== */}
        <TabsContent value="assets" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImagePlus className="h-5 w-5 text-[#F97316]" />
                  Logo Management
                </CardTitle>
                <CardDescription>Upload and manage ALO Education logos for all platforms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Logo Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="w-24 h-24 rounded-lg bg-white border flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-[#F97316]">ALO</span>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <p className="font-medium text-sm">ALO Education Logo</p>
                    <p className="text-xs text-muted-foreground">Primary logo (Horizontal) • PNG, SVG</p>
                    <p className="text-xs text-muted-foreground">Last updated: Feb 10, 2025</p>
                    <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1 text-xs">
                        <Eye className="h-3 w-3" /> Preview
                      </Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1 text-xs">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-[#F97316] hover:bg-orange-50/30 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop logo files here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, SVG, or JPG up to 5MB</p>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="mt-3 gap-1 text-xs text-[#F97316] border-orange-200">
                    <Upload className="h-3 w-3" /> Choose Files
                  </Button>
                </div>

                {/* Logo Variants */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Logo Variants</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Horizontal", "Vertical/Stacked", "Icon Only"].map((variant) => (
                      <div key={variant} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-white">
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          {variant === "Icon Only" ? (
                            <span className="text-lg font-bold text-[#F97316]">A</span>
                          ) : variant === "Vertical/Stacked" ? (
                            <div className="text-center">
                              <span className="text-xs font-bold text-[#F97316] block">ALO</span>
                              <span className="text-[6px] text-gray-600 block">Education</span>
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold text-[#F97316]">ALO Edu</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{variant}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-5 w-5 text-[#F97316]" />
                  Brand Colors
                </CardTitle>
                <CardDescription>Official ALO Education color palette.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {brandColors.map((color) => (
                    <div
                      key={color.key}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        selectedBrandColor === color.key ? "border-[#F97316] shadow-md" : "border-transparent"
                      }`}
                      onClick={() => setSelectedBrandColor(color.key)}
                    >
                      <div className={`w-full h-12 rounded-md ${color.tw}`} />
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-medium">{color.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Custom Color Picker</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input type="color" defaultValue="#F97316" className="w-12 h-10 p-1 cursor-pointer" />
                    <Input defaultValue="#F97316" className="flex-1 font-mono text-sm" placeholder="#000000" />
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approved Layouts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-5 w-5 text-[#F97316]" />
                  Approved Layouts
                </CardTitle>
                <CardDescription>Pre-approved post layout templates for consistent branding.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: "Full-width Banner", ratio: "1200×628", desc: "Facebook/LinkedIn" },
                    { name: "Square Post", ratio: "1080×1080", desc: "Instagram Feed" },
                    { name: "Story Vertical", ratio: "1080×1920", desc: "IG/TikTok Story" },
                    { name: "Wide Banner", ratio: "1920×1080", desc: "YouTube/Website" },
                    { name: "Portrait", ratio: "1080×1350", desc: "Instagram Portrait" },
                    { name: "Carousel Card", ratio: "1080×1080", desc: "Multi-slide" },
                  ].map((layout) => (
                    <div key={layout.name} className="border rounded-lg p-3 hover:border-[#F97316] hover:bg-orange-50/30 transition-colors cursor-pointer">
                      <div className="w-full aspect-video rounded bg-gradient-to-br from-[#F97316]/20 to-orange-100 flex items-center justify-center mb-2">
                        <Square className="h-6 w-6 text-[#F97316]" />
                      </div>
                      <p className="text-xs font-medium truncate">{layout.name}</p>
                      <p className="text-xs text-muted-foreground">{layout.ratio}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Font Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Type className="h-5 w-5 text-[#F97316]" />
                  Font Settings
                </CardTitle>
                <CardDescription>Typography configuration for brand consistency.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Primary Heading", font: "Inter Bold", size: "24-32px", sample: "Heading Style" },
                    { label: "Subheading", font: "Inter SemiBold", size: "18-24px", sample: "Subheading Style" },
                    { label: "Body Text", font: "Inter Regular", size: "14-16px", sample: "Body text style" },
                    { label: "Caption", font: "Inter Medium", size: "12-14px", sample: "Caption text" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.font} • {item.size}</p>
                      </div>
                      <span className="text-sm text-gray-600">{item.sample}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Logo Watermark on Posts</p>
                    <p className="text-xs text-muted-foreground">Automatically add ALO logo to all generated posts</p>
                  </div>
                  <Switch checked={logoWatermark} onCheckedChange={setLogoWatermark} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAB 2: Post Creator ===== */}
        <TabsContent value="creator" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileEdit className="h-5 w-5 text-[#F97316]" />
                    Post Configuration
                  </CardTitle>
                  <CardDescription>Select platform, content type, and category for your post.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Platform Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Platform</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {Object.entries(platformIcons).map(([name, Icon]) => (
                        <Button
                          key={name}
                          variant={platform === name ? "default" : "outline"}
                          className={`flex-col h-auto py-2.5 gap-1 text-xs ${platform === name ? "bg-[#F97316] hover:bg-[#F97316]/90 text-white" : ""}`}
                          onClick={() => setPlatform(name)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[10px] leading-tight">{name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Content Type</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { value: "Image", icon: ImageIcon, label: "Image" },
                        { value: "Video", icon: Video, label: "Video" },
                        { value: "Carousel", icon: Layers, label: "Carousel" },
                        { value: "Story", icon: Film, label: "Story" },
                        { value: "Text", icon: FileText, label: "Text" },
                      ].map((type) => (
                        <Button
                          key={type.value}
                          variant={contentType === type.value ? "default" : "outline"}
                          className={`flex-col h-auto py-2.5 gap-1 text-xs ${contentType === type.value ? "bg-[#F97316] hover:bg-[#F97316]/90 text-white" : ""}`}
                          onClick={() => setContentType(type.value)}
                        >
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Caption Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Caption / Content</Label>
                      <span className={`text-xs ${charCount > maxCharMap[platform] * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
                        {charCount} / {maxCharMap[platform]}
                      </span>
                    </div>
                    <Textarea
                      placeholder="Write your post content here..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[120px]"
                    />
                    {/* Progress bar for character count */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          charCount > maxCharMap[platform] * 0.9 ? "bg-red-500" : charCount > maxCharMap[platform] * 0.7 ? "bg-amber-500" : "bg-[#F97316]"
                        }`}
                        style={{ width: `${Math.min((charCount / maxCharMap[platform]) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Hashtag Generator */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Hash className="h-4 w-4" /> Hashtags
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add hashtags separated by space..."
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                      />
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="gap-1 text-xs shrink-0 text-[#F97316] border-orange-200">
                        <Sparkles className="h-3.5 w-3.5" /> Generate
                      </Button>
                    </div>
                    {hashtags && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {hashtags.split(" ").filter(Boolean).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MousePointerClick className="h-4 w-4" /> Call to Action
                    </Label>
                    <Select value={ctaType} onValueChange={setCtaType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ctaOptions.map((cta) => (
                          <SelectItem key={cta} value={cta}>{cta}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Landing Link */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Landing Page Link</Label>
                    <Input placeholder="https://alo.edu.bd/..." value={landingLink} onChange={(e) => setLandingLink(e.target.value)} />
                  </div>

                  <Separator />

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" /> Schedule
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Time</Label>
                        <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Media Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Media Upload</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-[#F97316] hover:bg-orange-50/30 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Upload images, videos, or documents</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contentType === "Video" ? "MP4, MOV up to 100MB" : contentType === "Carousel" ? "Multiple images up to 10" : "PNG, JPG, GIF up to 10MB"}
                      </p>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="mt-3 gap-1 text-xs text-[#F97316] border-orange-200">
                        <Upload className="h-3 w-3" /> Choose Files
                      </Button>
                    </div>
                  </div>

                  {/* Logo Watermark */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${logoWatermark ? "bg-[#F97316] text-white" : "bg-muted text-muted-foreground"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">ALO Logo Watermark</p>
                        <p className="text-xs text-muted-foreground">Add ALO Education logo to media</p>
                      </div>
                    </div>
                    <Switch checked={logoWatermark} onCheckedChange={setLogoWatermark} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview Panel */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-5 w-5 text-[#F97316]" />
                    Preview
                  </CardTitle>
                  <CardDescription>Live preview of your post.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platform label */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-[#F97316] border-orange-200">
                      {(() => { const PIcon = platformIcons[platform] || Globe; return <PIcon className="h-3 w-3 mr-1" />; })()}
                      {platform}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">{contentType}</Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600">{category}</Badge>
                  </div>

                  {/* Post preview mockup */}
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="p-3 flex items-center gap-2 border-b">
                      <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold">ALO</div>
                      <div>
                        <p className="text-xs font-semibold">ALO Education</p>
                        <p className="text-[10px] text-muted-foreground">Sponsored • {scheduleDate || "Now"}</p>
                      </div>
                    </div>
                    {contentType !== "Text" && (
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-10 w-10 mx-auto text-[#F97316]/40 mb-1" />
                          <p className="text-xs text-gray-400">Media preview</p>
                        </div>
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <p className="text-xs leading-relaxed line-clamp-4">
                        {caption || "Your post content will appear here..."}
                      </p>
                      {hashtags && (
                        <p className="text-[10px] text-blue-600 line-clamp-2">{hashtags}</p>
                      )}
                      {ctaType && (
                        <div className="bg-gray-100 rounded-md px-3 py-1.5 inline-block">
                          <span className="text-[10px] font-semibold text-[#F97316]">{ctaType}</span>
                        </div>
                      )}
                      {landingLink && (
                        <p className="text-[10px] text-muted-foreground truncate">{landingLink}</p>
                      )}
                    </div>
                    {logoWatermark && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-6 h-6 rounded bg-white border flex items-center justify-center">
                          <span className="text-[6px] font-bold text-[#F97316]">ALO</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#F97316] hover:bg-[#F97316]/90 gap-1.5">
                      <Send className="h-4 w-4" /> Submit for Approval
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1">
                        <Save className="h-3.5 w-3.5" /> Save Draft
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 3: AI Content Generator ===== */}
        <TabsContent value="ai-generator" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: AI Input Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="h-5 w-5 text-purple-500" />
                    AI Content Generator
                  </CardTitle>
                  <CardDescription>
                    Generate captions, hashtags, CTAs, image prompts, and video scripts with AI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Topic Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Topic / Subject</Label>
                    <Textarea
                      placeholder="e.g., Study in the UK for Bangladeshi students, Spring 2025 intake at University of Manchester..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Target Country/Course */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Target Country / Course</Label>
                      <Select value={aiCountry} onValueChange={setAiCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="USA">United States</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="Malaysia">Malaysia</SelectItem>
                          <SelectItem value="New Zealand">New Zealand</SelectItem>
                          <SelectItem value="Ireland">Ireland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Platform */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Platform</Label>
                      <Select value={aiPlatform} onValueChange={setAiPlatform}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(platformIcons).map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Language */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Globe className="h-4 w-4" /> Language
                      </Label>
                      <Select value={aiLanguage} onValueChange={setAiLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bangla">Bangla</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Mixed">Mixed (Benglish)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <MessageSquareText className="h-4 w-4" /> Tone
                      </Label>
                      <Select value={aiTone} onValueChange={setAiTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                          <SelectItem value="Inspirational">Inspirational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600 gap-2 h-11"
                    onClick={handleAIGenerate}
                  >
                    <Sparkles className="h-5 w-5" /> Generate AI Content
                  </Button>
                </CardContent>
              </Card>

              {/* AI Output */}
              {aiGenerated && (
                <div className="space-y-4">
                  {/* Generated Caption */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4 text-purple-500" />
                          Generated Caption
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={aiOutput.caption} onChange={(e) => setAiOutput({ ...aiOutput, caption: e.target.value })} className="min-h-[80px]" />
                    </CardContent>
                  </Card>

                  {/* Generated Hashtags */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Hash className="h-4 w-4 text-purple-500" />
                          Generated Hashtags
                        </CardTitle>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Input value={aiOutput.hashtags} onChange={(e) => setAiOutput({ ...aiOutput, hashtags: e.target.value })} />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {aiOutput.hashtags.split(" ").filter(Boolean).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated CTA */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-purple-500" />
                        Call to Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={aiOutput.cta} onChange={(e) => setAiOutput({ ...aiOutput, cta: e.target.value })} className="min-h-[60px]" />
                    </CardContent>
                  </Card>

                  {/* Generated Image Prompt */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-purple-500" />
                          Image Generation Prompt
                        </CardTitle>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={aiOutput.imagePrompt} onChange={(e) => setAiOutput({ ...aiOutput, imagePrompt: e.target.value })} className="min-h-[60px]" />
                    </CardContent>
                  </Card>

                  {/* Generated Video Script */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Video className="h-4 w-4 text-purple-500" />
                          Video Script
                        </CardTitle>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={aiOutput.videoScript} onChange={(e) => setAiOutput({ ...aiOutput, videoScript: e.target.value })} className="min-h-[100px] font-mono text-xs" />
                    </CardContent>
                  </Card>

                  {/* Submit Approval */}
                  <div className="flex gap-3">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[#F97316] hover:bg-[#F97316]/90 gap-1.5 flex-1">
                      <Send className="h-4 w-4" /> Submit for Approval
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="gap-1.5">
                      <Pencil className="h-4 w-4" /> Edit in Creator
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Tips & Settings */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { tip: "Be specific about the country, university, or course for better results.", icon: Target },
                    { tip: "Include the target audience (undergrad, masters, professionals).", icon: GraduationCap },
                    { tip: "Specify any deadlines or urgent timelines for urgency tone.", icon: Timer },
                    { tip: "Mention scholarship names or intake seasons for accuracy.", icon: Trophy },
                    { tip: "Only include claims you can substantiate. Do not state visa success rates, approval odds, or student outcome figures.", icon: Star },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
                      <item.icon className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-purple-700">{item.tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 4: Template Library ===== */}
        <TabsContent value="templates" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutGrid className="h-5 w-5 text-[#F97316]" />
                    Template Library
                  </CardTitle>
                  <CardDescription>Saved post templates for quick reuse across platforms.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[#F97316] hover:bg-[#F97316]/90 gap-1.5">
                    <Plus className="h-4 w-4" /> New Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTemplates
                  .filter((t) => templateFilter === "All" || t.category === templateFilter)
                  .map((template) => {
                    const PIcon = platformIcons[template.platform] || Globe;
                    return (
                      <div key={template.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                        {/* Template preview card header */}
                        <div className="p-3 border-b bg-gradient-to-r from-orange-50 to-amber-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs bg-white border-orange-200 text-[#F97316]">
                              <PIcon className="h-3 w-3 mr-1" />
                              {template.platform}
                            </Badge>
                            <Badge variant={template.status === "Approved" ? "default" : "secondary"} className="text-xs">
                              {template.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-white">{template.type}</Badge>
                            <Badge variant="outline" className="text-xs bg-white">{template.category}</Badge>
                          </div>
                        </div>

                        {/* Template body */}
                        <div className="p-3 space-y-3">
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {template.lastUsed}
                            </span>
                            {template.likes > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-400" /> {template.likes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Template actions */}
                        <div className="px-3 pb-3 flex items-center gap-2">
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="flex-1 gap-1 text-xs text-[#F97316] border-orange-200 hover:bg-orange-50">
                            <Copy className="h-3 w-3" /> Use
                          </Button>
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1 text-xs">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {mockTemplates.filter((t) => templateFilter === "All" || t.category === templateFilter).length === 0 && (
                <div className="text-center py-12">
                  <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No templates found for this category</p>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="mt-3 gap-1 text-xs text-[#F97316] border-orange-200">
                    <Plus className="h-3 w-3" /> Create Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
