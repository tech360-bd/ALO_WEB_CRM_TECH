'use client';

import { useState, type ReactNode } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';

// Import all Marketing Hub views
import MarketingDashboardView from './MarketingDashboardView';
import UnifiedInboxView from './UnifiedInboxView';
import WhatsAppAutomationView from './WhatsAppAutomationView';
import SocialMediaAutomationView from './SocialMediaAutomationView';
import KeywordTriggersView from './KeywordTriggersView';
import AiReplyManagerView from './AiReplyManagerView';
import HumanHandoffView from './HumanHandoffView';
import BrandAssetsPostCreatorView from './BrandAssetsPostCreatorView';
import CampaignBuilderCalendarView from './CampaignBuilderCalendarView';
import ApprovalQueueView from './ApprovalQueueView';
import LeadPipelineView from './LeadPipelineView';
import ConversationAssignmentView from './ConversationAssignmentView';
import N8nWorkflowsView from './N8nWorkflowsView';
import MarketingAnalyticsView from './MarketingAnalyticsView';
import MarketingAuditAccessView from './MarketingAuditAccessView';

// View component map
const viewComponents: Record<MarketingSubView, React.ComponentType> = {
  dashboard: MarketingDashboardView,
  'unified-inbox': UnifiedInboxView,
  'whatsapp-automation': WhatsAppAutomationView,
  'social-media': SocialMediaAutomationView,
  'comment-to-lead': SocialMediaAutomationView,
  'keyword-triggers': KeywordTriggersView,
  'ai-reply-manager': AiReplyManagerView,
  'human-handoff': HumanHandoffView,
  'brand-assets': BrandAssetsPostCreatorView,
  'post-creator': BrandAssetsPostCreatorView,
  'campaign-builder': CampaignBuilderCalendarView,
  'campaign-calendar': CampaignBuilderCalendarView,
  'approval-queue': ApprovalQueueView,
  'lead-pipeline': LeadPipelineView,
  'conversation-assignment': ConversationAssignmentView,
  'follow-up-automation': HumanHandoffView,
  'n8n-workflows': N8nWorkflowsView,
  analytics: MarketingAnalyticsView,
  'audit-logs': MarketingAuditAccessView,
  'access-control': MarketingAuditAccessView,
};
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  MessageCircle,
  Share2,
  Bot,
  Palette,
  Megaphone,
  Calendar,
  CheckSquare,
  Target,
  GitBranch,
  BarChart3,
  ScrollText,
  Shield,
  Users,
  Clock,
  FileUp,
  Image,
  Zap,
  ArrowLeft,
  Bell,
  ChevronRight,
} from 'lucide-react';

// ============================================================
// Marketing Hub Sub-View Types
// ============================================================

export type MarketingSubView =
  | 'dashboard'
  | 'unified-inbox'
  | 'whatsapp-automation'
  | 'social-media'
  | 'comment-to-lead'
  | 'keyword-triggers'
  | 'ai-reply-manager'
  | 'human-handoff'
  | 'brand-assets'
  | 'post-creator'
  | 'campaign-builder'
  | 'campaign-calendar'
  | 'approval-queue'
  | 'lead-pipeline'
  | 'conversation-assignment'
  | 'follow-up-automation'
  | 'n8n-workflows'
  | 'analytics'
  | 'audit-logs'
  | 'access-control';

// ============================================================
// Navigation Configuration
// ============================================================

interface SubNavItem {
  icon: React.ElementType;
  label: string;
  view: MarketingSubView;
  badge?: string;
  badgeColor?: string;
}

interface SubNavGroup {
  title: string;
  items: SubNavItem[];
}

const subNavGroups: SubNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Marketing Dashboard', view: 'dashboard' },
    ],
  },
  {
    title: 'Inbox & Channels',
    items: [
      { icon: MessageCircle, label: 'Unified Inbox', view: 'unified-inbox', badge: '24', badgeColor: 'bg-green-500' },
      { icon: MessageCircle, label: 'WhatsApp Automation', view: 'whatsapp-automation', badge: '8', badgeColor: 'bg-emerald-500' },
      { icon: Share2, label: 'Social Media', view: 'social-media', badge: '12', badgeColor: 'bg-blue-500' },
      { icon: FileUp, label: 'Document Upload', view: 'whatsapp-automation' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { icon: Bot, label: 'AI Reply Manager', view: 'ai-reply-manager' },
      { icon: Zap, label: 'Comment to Lead', view: 'comment-to-lead', badge: '5', badgeColor: 'bg-orange-500' },
      { icon: Clock, label: 'Keyword Triggers', view: 'keyword-triggers' },
      { icon: Users, label: 'Human Handoff', view: 'human-handoff', badge: '3', badgeColor: 'bg-red-500' },
      { icon: GitBranch, label: 'Follow-up Automation', view: 'follow-up-automation' },
    ],
  },
  {
    title: 'Content & Brand',
    items: [
      { icon: Palette, label: 'Brand Assets', view: 'brand-assets' },
      { icon: Image, label: 'Post Creator', view: 'post-creator' },
      { icon: Megaphone, label: 'Campaign Builder', view: 'campaign-builder' },
      { icon: Calendar, label: 'Campaign Calendar', view: 'campaign-calendar' },
      { icon: CheckSquare, label: 'Approval Queue', view: 'approval-queue', badge: '7', badgeColor: 'bg-purple-500' },
    ],
  },
  {
    title: 'Lead & Outreach',
    items: [
      { icon: Target, label: 'Lead Pipeline', view: 'lead-pipeline' },
      { icon: Users, label: 'Conversation Assignment', view: 'conversation-assignment' },
      { icon: GitBranch, label: 'n8n Workflows', view: 'n8n-workflows' },
    ],
  },
  {
    title: 'Reports & Settings',
    items: [
      { icon: BarChart3, label: 'Analytics', view: 'analytics' },
      { icon: ScrollText, label: 'Audit Logs', view: 'audit-logs' },
      { icon: Shield, label: 'Access Control', view: 'access-control' },
    ],
  },
];

// ============================================================
// Sidebar Nav Item
// ============================================================

function SubSidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: SubNavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
            isActive
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
          }`}
        >
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-orange-600' : 'text-gray-400'
            }`}
          />
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && !isActive && (
            <span
              className={`text-[10px] leading-none font-medium px-1.5 py-0.5 rounded-full text-white shrink-0 ${item.badgeColor || 'bg-gray-400'}`}
            >
              {item.badge}
            </span>
          )}
          {isActive && (
            <ChevronRight className="w-3 h-3 text-orange-500 shrink-0" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================
// Sidebar Content
// ============================================================

function SubSidebarContent({
  activeView,
  setActiveView,
}: {
  activeView: MarketingSubView;
  setActiveView: (v: MarketingSubView) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shrink-0">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">Marketing Hub</p>
          <p className="text-[10px] text-gray-500">ALO Education</p>
        </div>
      </div>
      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-3">
          {subNavGroups.map((group) => (
            <div key={group.title}>
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SubSidebarNavItem
                    key={item.view}
                    item={item}
                    isActive={activeView === item.view}
                    onClick={() => setActiveView(item.view)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Main Shell Component
// ============================================================

interface MarketingHubShellProps {
  children?: (activeView: MarketingSubView, setActiveView: (v: MarketingSubView) => void) => ReactNode;
}

export default function MarketingHubShell({ children }: MarketingHubShellProps) {
  const { user, setView } = usePortalStore();
  const [activeView, setActiveView] = useState<MarketingSubView>('dashboard');

  return (
    <div className="flex h-full gap-0">
      {/* Marketing Sub-Sidebar - hidden on mobile, shown on desktop */}
      <aside className="hidden lg:flex w-56 flex-col bg-white border-l border-gray-100 shrink-0">
        <SubSidebarContent activeView={activeView} setActiveView={setActiveView} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with back button and mobile navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 h-8"
              onClick={() => setView('crm-dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              CRM
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-semibold text-gray-700">
              {subNavGroups
                .flatMap((g) => g.items)
                .find((i) => i.view === activeView)?.label || 'Marketing Hub'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
              <Megaphone className="w-3 h-3 mr-1" />
              Marketing Manager
            </Badge>
          </div>
        </div>

        {/* Mobile: Tab navigation bar */}
        <div className="lg:hidden flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto">
          {subNavGroups.flatMap((g) => g.items).map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                activeView === item.view
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-5">
            {children ? (
              children(activeView, setActiveView)
            ) : (
              (() => {
                const ViewComponent = viewComponents[activeView];
                return ViewComponent ? <ViewComponent /> : <MarketingDashboardView />;
              })()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export { subNavGroups };
export type { SubNavItem, SubNavGroup };
