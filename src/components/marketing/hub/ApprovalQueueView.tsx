'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CheckSquare, XCircle, Clock, Eye, MessageSquare, User, Calendar,
  ArrowRight, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video,
  Megaphone, Shield,
} from 'lucide-react';

// ============================================================
// RBAC Notes
// ============================================================
// Marketing Manager: can approve/reject all content & campaigns
// Super Admin: can approve/reject all + manage Marketing Manager approvals
// 3 Marketing Staff: can only prepare drafts — NOT approve or reject
// Access control is enforced via marketing.permissions.ts
// ============================================================

// ============================================================
// Types & Constants
// ============================================================

type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type ItemType = 'post' | 'campaign' | 'content';
type ContentType = 'social_post' | 'blog_post' | 'ad_copy' | 'video_script' | 'whatsapp_broadcast' | 'email_template' | 'poster';

interface PendingItem {
  id: string;
  title: string;
  description: string;
  itemType: ItemType;
  contentType: ContentType;
  platform: string;
  submittedBy: string;
  submittedDate: string;
  status: ApprovalStatus;
  previewText: string;
  previewImage?: boolean;
  previewVideo?: boolean;
  comments: string[];
  hasAttachment: boolean;
}

interface ApprovalRecord {
  id: string;
  title: string;
  itemType: ItemType;
  platform: string;
  approvedBy: string;
  approvedDate: string;
  status: ApprovalStatus;
  comments: string;
  submittedBy: string;
}

const STATUS_COLORS: Record<ApprovalStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  social_post: Megaphone,
  blog_post: FileText,
  ad_copy: Megaphone,
  video_script: Video,
  whatsapp_broadcast: MessageSquare,
  email_template: FileText,
  poster: ImageIcon,
};

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  post: 'Social Post',
  campaign: 'Campaign',
  content: 'Content',
};

// ============================================================
// Mock Data — Pending Approval Items
// ============================================================

const MOCK_PENDING_ITEMS: PendingItem[] = [
  {
    id: 'p-001',
    title: 'UK Fall 2025 — Facebook Lead Gen Campaign',
    description: 'New lead generation campaign targeting Bangladeshi students for UK Fall 2025 intake via Facebook Ads.',
    itemType: 'campaign',
    contentType: 'ad_copy',
    platform: 'Facebook',
    submittedBy: 'Rahim Uddin',
    submittedDate: '2025-01-14',
    status: 'pending',
    previewText: '🎓 Study in the UK this Fall 2025!\n\n✅ 50+ Top Universities\n✅ Scholarship up to 50%\n✅ IELTS Waiver Available\n✅ Free Application Support\n\n📞 Call us: +880 1XXXX-XXXX\n📍 Visit: ALO Education, Dhaka\n\n#StudyInUK #ALOEducation #UKFall2025 #Scholarship',
    previewImage: true,
    comments: [],
    hasAttachment: true,
  },
  {
    id: 'p-002',
    title: 'Instagram Reel: Nursing in Australia',
    description: 'Short-form video script and caption for Instagram Reels promoting nursing programs in Australia.',
    itemType: 'content',
    contentType: 'video_script',
    platform: 'Instagram',
    submittedBy: 'Nusrat Jahan',
    submittedDate: '2025-01-13',
    status: 'pending',
    previewText: '[Hook: Cinematic campus footage]\n"Why I chose Nursing in Australia… 🏥🇦🇺"\n\n[Sustainable nursing labs]\n"World-class facilities, PR pathway, and starting salary ৳6L+"/month"',
    previewVideo: true,
    comments: [],
    hasAttachment: false,
  },
  {
    id: 'p-003',
    title: 'WhatsApp Broadcast: January Scholarship List',
    description: 'Monthly scholarship broadcast message for WhatsApp groups covering UK, Canada, and Australia.',
    itemType: 'content',
    contentType: 'whatsapp_broadcast',
    platform: 'WhatsApp',
    submittedBy: 'Kamal Hossain',
    submittedDate: '2025-01-12',
    status: 'pending',
    previewText: '*📢 January 2025 Scholarship Alert!*\n\n🇬🇧 *UK Scholarships:*\n• Manchester — 40% tuition waiver\n• Birmingham — £3,000 merit award\n• Leeds — £5,000 international scholarship\n\n🇨🇦 *Canada Scholarships:*\n• Toronto — CAD $5,000 entrance award\n• BCIT — Full tuition for nursing\n\n🇦🇺 *Australia Scholarships:*\n• Monash — 25% merit scholarship\n• Deakin — 20% for Bangladeshi students\n\n*Deadline: Jan 31, 2025*\n*Apply now at ALO Education!* 🎓',
    comments: [],
    hasAttachment: false,
  },
  {
    id: 'p-004',
    title: 'LinkedIn Post: Canada MBA Partnership',
    description: 'Professional LinkedIn post announcing new partnership with Toronto Metropolitan University for MBA program.',
    itemType: 'post',
    contentType: 'social_post',
    platform: 'LinkedIn',
    submittedBy: 'Fatima Akter',
    submittedDate: '2025-01-11',
    status: 'pending',
    previewText: '🤝 Excited to announce our new partnership with Toronto Metropolitan University!\n\nALO Education is now the official recruitment partner for TMU\'s MBA program in Bangladesh.\n\n💼 Highlights:\n• Co-op work opportunities\n• PR-eligible program\n• Scholarships up to CAD $10,000\n• IELTS 6.5 minimum\n\nJoin our upcoming info session on Jan 20.',
    previewImage: true,
    comments: [],
    hasAttachment: true,
  },
  {
    id: 'p-005',
    title: 'Blog Post: Germany Free Tuition Guide 2025',
    description: 'Comprehensive blog post covering tuition-free universities in Germany, application process, and visa requirements for Bangladeshi students.',
    itemType: 'content',
    contentType: 'blog_post',
    platform: 'Website',
    submittedBy: 'Rahim Uddin',
    submittedDate: '2025-01-10',
    status: 'pending',
    previewText: 'Complete Guide: Study in Germany for Free in 2025\n\nGermany offers tuition-free education at public universities for international students, including those from Bangladesh...',
    comments: [],
    hasAttachment: false,
  },
  {
    id: 'p-006',
    title: 'YouTube Pre-roll: USA MS Programs',
    description: '15-second YouTube pre-roll ad script for promoting USA master\'s programs through ALO Education.',
    itemType: 'content',
    contentType: 'video_script',
    platform: 'YouTube',
    submittedBy: 'Nusrat Jahan',
    submittedDate: '2025-01-09',
    status: 'pending',
    previewText: '[0-3s] "Want to pursue your MS in the USA?"\n[3-8s] "ALO Education helps you get into top US universities with full support."\n[8-12s] "Scholarships, visa guidance, and counseling — all under one roof."\n[12-15s] "Visit aloeducation.com — Your gateway to global education."',
    previewVideo: true,
    comments: [],
    hasAttachment: true,
  },
  {
    id: 'p-007',
    title: 'Education Fair Poster Design — Dhaka',
    description: 'Print and digital poster for the upcoming Dhaka Education Fair event on January 25, 2025.',
    itemType: 'content',
    contentType: 'poster',
    platform: 'Website',
    submittedBy: 'Kamal Hossain',
    submittedDate: '2025-01-08',
    status: 'pending',
    previewText: 'ALO Education Fair 2025\nDhaka — January 25, 2025\n50+ Universities from UK, Canada, Australia, USA, Germany\nFree Entry • On-spot Assessment • Scholarship Offers',
    previewImage: true,
    comments: [],
    hasAttachment: true,
  },
];

// ============================================================
// Mock Data — Approval History
// ============================================================

const MOCK_APPROVAL_HISTORY: ApprovalRecord[] = [
  { id: 'h-001', title: 'UK Spring 2025 Campaign — FB', itemType: 'campaign', platform: 'Facebook', approvedBy: 'Marketing Manager', approvedDate: '2025-01-07', status: 'approved', comments: 'Good targeting. Budget approved.', submittedBy: 'Rahim Uddin' },
  { id: 'h-002', title: 'Instagram Reel: Australia Nursing', itemType: 'content', platform: 'Instagram', approvedBy: 'Super Admin', approvedDate: '2025-01-06', status: 'approved', comments: 'Engaging script. Add hashtag suggestions.', submittedBy: 'Nusrat Jahan' },
  { id: 'h-003', title: 'LinkedIn Article: Why Canada?', itemType: 'post', platform: 'LinkedIn', approvedBy: 'Marketing Manager', approvedDate: '2025-01-05', status: 'rejected', comments: 'Too generic. Add specific partner universities and stats.', submittedBy: 'Fatima Akter' },
  { id: 'h-004', title: 'WhatsApp Broadcast: Dec Scholarships', itemType: 'content', platform: 'WhatsApp', approvedBy: 'Marketing Manager', approvedDate: '2025-01-04', status: 'approved', comments: 'Looks good. Sent to 12 groups.', submittedBy: 'Kamal Hossain' },
  { id: 'h-005', title: 'Blog: Top 10 UK Universities 2025', itemType: 'content', platform: 'Website', approvedBy: 'Marketing Manager', approvedDate: '2025-01-03', status: 'approved', comments: 'Excellent SEO content. Publish immediately.', submittedBy: 'Rahim Uddin' },
  { id: 'h-006', title: 'TikTok: Germany Free Tuition Video', itemType: 'content', platform: 'TikTok', approvedBy: 'Super Admin', approvedDate: '2025-01-02', status: 'rejected', comments: 'Reupload with correct university names. Some listed are not tuition-free.', submittedBy: 'Nusrat Jahan' },
  { id: 'h-007', title: 'Email Template: Lead Follow-up Batch', itemType: 'content', platform: 'Website', approvedBy: 'Marketing Manager', approvedDate: '2024-12-30', status: 'approved', comments: 'Professional tone. Good CTA placement.', submittedBy: 'Kamal Hossain' },
  { id: 'h-008', title: 'Facebook Carousel: Canada Winter', itemType: 'post', platform: 'Facebook', approvedBy: 'Marketing Manager', approvedDate: '2024-12-28', status: 'approved', comments: 'Use updated university logos.', submittedBy: 'Fatima Akter' },
  { id: 'h-009', title: 'YouTube Thumbnail: USA MS Series', itemType: 'content', platform: 'YouTube', approvedBy: 'Super Admin', approvedDate: '2024-12-26', status: 'approved', comments: 'High-quality design. Approved for production.', submittedBy: 'Rahim Uddin' },
  { id: 'h-010', title: 'Poster: IELTS Promo — January', itemType: 'content', platform: 'Website', approvedBy: 'Marketing Manager', approvedDate: '2024-12-24', status: 'rejected', comments: 'Discount amount is incorrect. Re-check with finance team.', submittedBy: 'Kamal Hossain' },
];

// ============================================================
// Sub-component: Pending Item Card
// ============================================================

function PendingApprovalCard({
  item,
  onApprove,
  onReject,
  selectedId,
  onSelect,
}: {
  item: PendingItem;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [expanded, setExpanded] = useState(false);
  const ContentIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
  const isSelected = selectedId === item.id;

  return (
    <Card className={`border shadow-sm transition-all ${isSelected ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-100'}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
              <ContentIcon className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 ${STATUS_COLORS[item.status]?.bg} ${STATUS_COLORS[item.status]?.text} ${STATUS_COLORS[item.status]?.border}`}>
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Megaphone className="w-3 h-3" />
            <span className="font-medium text-gray-600">{item.platform}</span>
          </div>
          <Separator orientation="vertical" className="h-3" />
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{item.submittedBy}</span>
          </div>
          <Separator orientation="vertical" className="h-3" />
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{item.submittedDate}</span>
          </div>
          <Separator orientation="vertical" className="h-3" />
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-gray-500 border-gray-200">
            {ITEM_TYPE_LABELS[item.itemType]}
          </Badge>
          {item.hasAttachment && (
            <>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-amber-500 font-medium">📎 Attachment</span>
            </>
          )}
        </div>

        {/* Content Preview Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer mb-3"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-600">
              {expanded ? 'Hide' : 'Show'} Content Preview
            </span>
          </div>
          {expanded ? (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {expanded && (
          <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            {item.previewImage && (
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-2">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
            {item.previewVideo && (
              <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-2">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-normal leading-relaxed bg-white rounded-md p-3 border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
              {item.previewText}
            </pre>
          </div>
        )}

        {/* Approval Comment + Actions */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add approval comment (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] text-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => { onReject(item.id, comment); setComment(''); }}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              className="h-8 text-[11px] bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { onApprove(item.id, comment); setComment(''); }}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Sub-component: Approved / Rejected Card (compact)
// ============================================================

function StatusItemCard({
  item,
  status,
}: {
  item: PendingItem;
  status: 'approved' | 'rejected';
}) {
  const ContentIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText;

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            status === 'approved' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <ContentIcon className={`w-4 h-4 ${status === 'approved' ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">{item.platform}</span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] text-gray-400">{item.submittedBy}</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${
            STATUS_COLORS[status]?.bg
          } ${STATUS_COLORS[status]?.text} ${STATUS_COLORS[status]?.border}`}>
            {status === 'approved' ? (
              <>
                <CheckSquare className="w-3 h-3 mr-1" />
                Approved
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Rejected
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Sub-component: Approval History Table
// ============================================================

function ApprovalHistoryTable() {
  const [dateFilter, setDateFilter] = useState('');
  const [approverFilter, setApproverFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  const uniqueApprovers = [...new Set(MOCK_APPROVAL_HISTORY.map((h) => h.approvedBy))];

  const filtered = MOCK_APPROVAL_HISTORY.filter((h) => {
    if (platformFilter !== 'all' && h.platform !== platformFilter) return false;
    if (approverFilter && h.approvedBy !== approverFilter) return false;
    if (dateFilter && !h.approvedDate.includes(dateFilter)) return false;
    return true;
  });

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-gray-800">
            Approval History ({filtered.length} records)
          </CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by date..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 px-2 text-[11px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
            <select
              value={approverFilter}
              onChange={(e) => setApproverFilter(e.target.value)}
              className="h-8 px-2 text-[11px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
            >
              <option value="">All Approvers</option>
              {uniqueApprovers.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-8 px-2 text-[11px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
            >
              <option value="all">All Platforms</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-gray-500"
              onClick={() => { setDateFilter(''); setApproverFilter(''); setPlatformFilter('all'); }}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Item</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Platform</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Submitted By</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Approved By</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((h) => (
              <TableRow key={h.id} className="hover:bg-orange-50/30 transition-colors">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ContentIcon = FileText;
                      return (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          h.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <ContentIcon className={`w-3.5 h-3.5 ${
                            h.status === 'approved' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                      );
                    })()}
                    <span className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{h.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-500">{ITEM_TYPE_LABELS[h.itemType]}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-600 font-medium">{h.platform}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-500">{h.submittedBy}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] text-gray-600">{h.approvedBy}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-400">{h.approvedDate}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${
                    STATUS_COLORS[h.status]?.bg
                  } ${STATUS_COLORS[h.status]?.text} ${STATUS_COLORS[h.status]?.border}`}
                  >
                    {h.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-500 max-w-[200px] truncate block">{h.comments}</span>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-xs text-gray-400">No approval records found matching your filters.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Exported Component
// ============================================================

export default function ApprovalQueueView() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>(MOCK_PENDING_ITEMS);
  const [approvedItems, setApprovedItems] = useState<PendingItem[]>([]);
  const [rejectedItems, setRejectedItems] = useState<PendingItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const pendingCount = pendingItems.length;

  function handleApprove(id: string, comment: string) {
    const item = pendingItems.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, status: 'approved' as ApprovalStatus, comments: comment ? [...item.comments, comment] : item.comments };
    setPendingItems((prev) => prev.filter((i) => i.id !== id));
    setApprovedItems((prev) => [...prev, updated]);
    bulkSelected.delete(id);
    setBulkSelected(new Set(bulkSelected));
  }

  function handleReject(id: string, comment: string) {
    const item = pendingItems.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, status: 'rejected' as ApprovalStatus, comments: comment ? [...item.comments, comment] : item.comments };
    setPendingItems((prev) => prev.filter((i) => i.id !== id));
    setRejectedItems((prev) => [...prev, updated]);
    bulkSelected.delete(id);
    setBulkSelected(new Set(bulkSelected));
  }

  function handleBulkApprove() {
    bulkSelected.forEach((id) => handleApprove(id, 'Bulk approved by Marketing Manager'));
  }

  function toggleBulkSelect(id: string) {
    const next = new Set(bulkSelected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBulkSelected(next);
  }

  function toggleSelectAll() {
    if (bulkSelected.size === pendingItems.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(pendingItems.map((i) => i.id)));
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-crm-page text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-orange-500" />
            Approval Queue
          </h1>
          <p className="text-body-sm text-gray-500 mt-1">
            Review and approve marketing content, campaigns, and posts before publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {bulkSelected.size > 0 && (
            <Button
              size="sm"
              className="h-8 text-[11px] bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBulkApprove}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1" />
              Bulk Approve ({bulkSelected.size})
            </Button>
          )}
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {/* RBAC Notice */}
      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-orange-700">Access Control</p>
            <p className="text-[10px] text-orange-600 leading-relaxed mt-0.5">
              <strong>Marketing Manager &amp; Super Admin</strong> can approve/reject all content.
              <strong>Marketing Staff (3 members)</strong> can only prepare and submit drafts for approval — they cannot approve or reject items.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-gray-100 p-0.5 h-9">
          <TabsTrigger value="pending" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending Approval
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            Approved
            {approvedItems.length > 0 && (
              <span className="ml-1.5 bg-green-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {approvedItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            Rejected
            {rejectedItems.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {rejectedItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-medium h-8 px-3 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Approval History
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Approval Tab ── */}
        <TabsContent value="pending" className="space-y-4">
          {/* Select All */}
          {pendingItems.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[11px] font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  bulkSelected.size === pendingItems.length
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-300 bg-white'
                }`}>
                  {bulkSelected.size === pendingItems.length && <span className="text-[10px]">✓</span>}
                </div>
                Select All ({pendingItems.length})
              </button>
              <Separator orientation="vertical" className="h-4" />
              <p className="text-[10px] text-gray-400">
                {bulkSelected.size > 0 ? `${bulkSelected.size} item(s) selected for bulk approval` : 'Select items to bulk approve'}
              </p>
            </div>
          )}

          {/* Pending Cards */}
          {pendingItems.length === 0 ? (
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="py-16 text-center">
                <CheckSquare className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No items pending approval right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Bulk select checkbox */}
                  <button
                    onClick={() => toggleBulkSelect(item.id)}
                    className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      bulkSelected.has(item.id)
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-300 bg-white hover:border-orange-300'
                    }`}
                  >
                    {bulkSelected.has(item.id) && <span className="text-[10px]">✓</span>}
                  </button>
                  <div className="pl-6">
                    <PendingApprovalCard
                      item={item}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Approved Tab ── */}
        <TabsContent value="approved" className="space-y-3">
          {approvedItems.length === 0 ? (
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="py-12 text-center">
                <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No approved items in this session.</p>
                <p className="text-[10px] text-gray-300 mt-1">Check Approval History for past records.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {approvedItems.map((item) => (
                <StatusItemCard key={item.id} item={item} status="approved" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Rejected Tab ── */}
        <TabsContent value="rejected" className="space-y-3">
          {rejectedItems.length === 0 ? (
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="py-12 text-center">
                <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No rejected items in this session.</p>
                <p className="text-[10px] text-gray-300 mt-1">Check Approval History for past records.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {rejectedItems.map((item) => (
                <StatusItemCard key={item.id} item={item} status="rejected" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Approval History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          <ApprovalHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}


