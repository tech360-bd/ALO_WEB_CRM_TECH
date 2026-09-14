'use client';

import { useState, type ReactNode } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';

// Import all Marketing Hub views — 21-command center
import MarketingDashboardView from './MarketingDashboardView';
import AIMarketingDirectorView from './AIMarketingDirectorView';
import CampaignBuilderCalendarView from './CampaignBuilderCalendarView';
import AIContentStudioView from './AIContentStudioView';
import AIVideoStudioView from './AIVideoStudioView';
import SocialMediaAutomationView from './SocialMediaAutomationView';
import AdvertisingManagerView from './AdvertisingManagerView';
import WhatsAppAutomationView from './WhatsAppAutomationView';
import SMSMarketingView from './SMSMarketingView';
import EmailMarketingView from './EmailMarketingView';
import SEOBlogManagerView from './SEOBlogManagerView';
import LeadGenerationView from './LeadGenerationView';
import LeadNurturingView from './LeadNurturingView';
import AIEmployeeDepartmentView from './AIEmployeeDepartmentView';
import CampaignBuilderCalendarView2 from './CampaignBuilderCalendarView';
import ApprovalQueueView from './ApprovalQueueView';
import MarketingAnalyticsView from './MarketingAnalyticsView';
import MarketingBudgetView from './MarketingBudgetView';
import IntegrationsView from './IntegrationsView';
import MarketingSettingsView from './MarketingSettingsView';
import MarketingAuditAccessView from './MarketingAuditAccessView';
import UnifiedInboxView from './UnifiedInboxView';
import KeywordTriggersView from './KeywordTriggersView';
import AiReplyManagerView from './AiReplyManagerView';
import HumanHandoffView from './HumanHandoffView';
import BrandAssetsPostCreatorView from './BrandAssetsPostCreatorView';
import LeadPipelineView from './LeadPipelineView';
import ConversationAssignmentView from './ConversationAssignmentView';
import N8nWorkflowsView from './N8nWorkflowsView';

// View component map — maps 21 required nav to real views
const viewComponents: Record<MarketingSubView, React.ComponentType> = {
  dashboard: MarketingDashboardView,
  'ai-director': AIMarketingDirectorView,
  'campaign-manager': CampaignBuilderCalendarView,
  'content-studio': AIContentStudioView,
  'video-studio': AIVideoStudioView,
  'social-media': SocialMediaAutomationView,
  'advertising': AdvertisingManagerView,
  'whatsapp-marketing': WhatsAppAutomationView,
  'sms-marketing': SMSMarketingView,
  'email-marketing': EmailMarketingView,
  'seo-blog': SEOBlogManagerView,
  'lead-generation': LeadGenerationView,
  'lead-nurturing': LeadNurturingView,
  'ai-employees': AIEmployeeDepartmentView,
  'marketing-calendar': CampaignBuilderCalendarView2,
  'approval-center': ApprovalQueueView,
  'analytics-reports': MarketingAnalyticsView,
  'marketing-budget': MarketingBudgetView,
  'integrations': IntegrationsView,
  'marketing-settings': MarketingSettingsView,
  'security-audit': MarketingAuditAccessView,
  // legacy aliases for backward compatibility
  'unified-inbox': UnifiedInboxView,
  'whatsapp-automation': WhatsAppAutomationView,
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
  Heart,
  Plug,
  Settings,
  Wallet,
  Globe,
} from 'lucide-react';

// ============================================================
// Marketing Hub Sub-View Types
// ============================================================

export type MarketingSubView =
  | 'dashboard'
  | 'ai-director'
  | 'campaign-manager'
  | 'content-studio'
  | 'video-studio'
  | 'social-media'
  | 'advertising'
  | 'whatsapp-marketing'
  | 'sms-marketing'
  | 'email-marketing'
  | 'seo-blog'
  | 'lead-generation'
  | 'lead-nurturing'
  | 'ai-employees'
  | 'marketing-calendar'
  | 'approval-center'
  | 'analytics-reports'
  | 'marketing-budget'
  | 'integrations'
  | 'marketing-settings'
  | 'security-audit'
  // legacy aliases
  | 'unified-inbox'
  | 'whatsapp-automation'
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
      { icon: LayoutDashboard, label: '1. Marketing Overview', view: 'dashboard' },
      { icon: Bot, label: '2. AI Marketing Command Center', view: 'ai-director', badge: 'AI', badgeColor: 'bg-[#F37021]' },
    ],
  },
  {
    title: 'Campaign & Content',
    items: [
      { icon: Megaphone, label: '3. Campaign Manager', view: 'campaign-manager' },
      { icon: Palette, label: '4. AI Content Studio', view: 'content-studio', badge: 'NEW', badgeColor: 'bg-[#0066CC]' },
      { icon: Image, label: '5. AI Video Studio', view: 'video-studio' },
    ],
  },
  {
    title: 'Channels',
    items: [
      { icon: Share2, label: '6. Social Media Manager', view: 'social-media', badge: '12', badgeColor: 'bg-[#0066CC]' },
      { icon: Target, label: '7. Advertising Manager', view: 'advertising', badge: 'NEW', badgeColor: 'bg-[#F37021]' },
      { icon: MessageCircle, label: '8. WhatsApp Marketing', view: 'whatsapp-marketing', badge: '8', badgeColor: 'bg-emerald-500' },
      { icon: MessageCircle, label: '9. SMS Marketing', view: 'sms-marketing' },
      { icon: MessageCircle, label: '10. Email Marketing', view: 'email-marketing' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { icon: Globe, label: '11. SEO & Blog Manager', view: 'seo-blog' },
      { icon: Target, label: '12. Lead Generation', view: 'lead-generation' },
      { icon: Heart, label: '13. Lead Nurturing', view: 'lead-nurturing' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: Bot, label: '14. AI Employee Department', view: 'ai-employees', badge: '20', badgeColor: 'bg-[#F37021]' },
      { icon: Calendar, label: '15. Marketing Calendar', view: 'marketing-calendar' },
      { icon: CheckSquare, label: '16. Approval Center', view: 'approval-center', badge: '7', badgeColor: 'bg-purple-500' },
    ],
  },
  {
    title: 'Analytics & Control',
    items: [
      { icon: BarChart3, label: '17. Analytics & Reports', view: 'analytics-reports' },
      { icon: Wallet, label: '18. Marketing Budget', view: 'marketing-budget' },
      { icon: Plug, label: '19. Integrations', view: 'integrations' },
      { icon: Settings, label: '20. Marketing Settings', view: 'marketing-settings' },
      { icon: Shield, label: '21. Security & Audit Logs', view: 'security-audit' },
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
              ? 'bg-[#F37021]/10 text-[#F37021] border border-[#F37021]/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
          }`}
        >
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-[#F37021]' : 'text-gray-400'
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
            <ChevronRight className="w-3 h-3 text-[#F37021] shrink-0" />
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F37021] to-[#FFB347] text-white flex items-center justify-center shrink-0">
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
                  ? 'bg-[#F37021] text-white'
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
