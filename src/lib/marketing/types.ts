// Marketing Dashboard Types

export type UserRole = 'super_admin' | 'marketing_manager' | 'marketing_staff' | 'counselor' | 'partner' | 'student';

export type CampaignGoal =
  | 'increase_leads' | 'promote_course' | 'drive_events' | 'collect_feedback'
  | 'visa_success' | 'deadline_reminder' | 'reengage_leads' | 'boost_referral'
  | 'promote_test' | 'promote_ielts_pte' | 'promote_country'
  | 'scholarship' | 'university_partner' | 'b2b_partner';

export type CampaignStatus = 'draft' | 'generating' | 'review' | 'approved' | 'active' | 'paused' | 'completed' | 'archived';

export type Platform = 'facebook' | 'instagram' | 'messenger' | 'whatsapp' | 'youtube' | 'linkedin' | 'tiktok' | 'telegram' | 'website';

export type ContentStatus = 'draft' | 'generating' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'failed';

export type ContentType = 'blog_post' | 'social_post' | 'newsletter' | 'whatsapp_sms' | 'email' | 'messenger_reply' | 'reels_script' | 'short_video_script' | 'poster_copy' | 'landing_page' | 'faq' | 'ad_copy' | 'follow_up' | 'event_invitation' | 'success_story';

export type ContentLanguage = 'bangla' | 'english' | 'mixed';

export type SocialIntent =
  | 'interested' | 'price_asking' | 'course_asking' | 'country_asking'
  | 'scholarship_asking' | 'visa_asking' | 'ielts_asking' | 'pte_asking'
  | 'office_location' | 'event_asking' | 'complaint' | 'spam'
  | 'existing_student' | 'partner_enquiry' | 'university_enquiry' | 'urgent' | 'document_shared';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'assigned' | 'converted' | 'lost';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export type AgentType =
  | 'campaign_planner' | 'audience_research' | 'content_idea' | 'bangla_copywriter'
  | 'english_copywriter' | 'mixed_copywriter' | 'facebook_caption' | 'instagram_caption'
  | 'whatsapp_broadcast' | 'blog_draft' | 'seo_topic' | 'poster_prompt'
  | 'video_script' | 'voice_script' | 'thumbnail' | 'hashtag' | 'comment_reply'
  | 'dm_qualification' | 'lead_scoring' | 'campaign_report' | 'brand_compliance'
  | 'meta_policy_check' | 'self_improvement' | 'audit';

export type KPIKey =
  | 'todayLeads' | 'hotLeads' | 'newDmLeads' | 'commentLeads'
  | 'whatsappReplies' | 'websiteChatLeads' | 'campaignsRunning' | 'pendingApproval'
  | 'pendingComments' | 'scheduledPosts' | 'failedPosts' | 'costPerLead'
  | 'leadConversionRate' | 'counselorAssigned' | 'followUpOverdue'
  | 'socialAccountsConnected' | 'aiJobsRunning';

export interface KPIData {
  key: KPIKey;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: string;
  color: string;
}

export interface DashboardKPIs {
  todayLeads: number;
  hotLeads: number;
  newDmLeads: number;
  commentLeads: number;
  whatsappReplies: number;
  websiteChatLeads: number;
  campaignsRunning: number;
  pendingApproval: number;
  pendingComments: number;
  scheduledPosts: number;
  failedPosts: number;
  costPerLead: number;
  leadConversionRate: number;
  counselorAssigned: number;
  followUpOverdue: number;
  socialAccountsConnected: number;
  aiJobsRunning: number;
}

export interface CampaignFilters {
  dateRange: 'today' | '7days' | '30days' | 'custom';
  platform?: Platform;
  status?: CampaignStatus;
  search?: string;
}

export interface ContentGenerationRequest {
  contentType: ContentType;
  topic: string;
  keywords: string[];
  language: ContentLanguage;
  platforms: Platform[];
  tone: string;
  cta: string;
  includeImage: boolean;
  includeVideo: boolean;
  variations: number;
  approvalRequired: boolean;
  targetCountry: string;
  targetCourse: string;
  targetStudentType: string;
  campaignId?: string;
}

export interface SocialMessage {
  id: string;
  platform: Platform;
  channel: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  intent: SocialIntent;
  isResolved: boolean;
  suggestedReply: string;
  replySent: string;
  convertedToLead: boolean;
  leadId?: string;
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedByName: string;
  createdAt: string;
}

export interface AgentJob {
  id: string;
  agentName: string;
  agentType: AgentType;
  status: AgentStatus;
  input: Record<string, unknown>;
  output: string;
  error: string;
  duration: number;
  ragEnabled: boolean;
  memoryUsed: boolean;
  protectedMode: boolean;
  permissionRequired: boolean;
  createdAt: string;
}

export interface MarketingSidebarItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  children?: MarketingSidebarItem[];
}

export type MarketingTab =
  | 'dashboard' | 'campaigns' | 'campaign-builder' | 'content-ideas'
  | 'generate-content' | 'video-generator' | 'content-library'
  | 'calendar' | 'social-inbox' | 'comment-to-lead' | 'dm-to-lead'
  | 'whatsapp' | 'n8n-monitor' | 'seo-manager' | 'programmatic-seo'
  | 'agentos' | 'approvals';

// Dashboard recent data types
export interface RecentCampaign {
  id: string;
  name: string;
  platform: Platform;
  leads: number;
  status: CampaignStatus;
  createdAt: string;
}

export interface RecentLead {
  id: string;
  name: string;
  source: Platform | string;
  status: LeadStatus;
  assignedCounselor: string;
  createdAt: string;
}

// Campaign data table types
export interface Campaign {
  id: string;
  name: string;
  goal: CampaignGoal;
  platform: Platform;
  leadsGenerated: number;
  hotLeads: number;
  conversionRate: number;
  costPerLead: number;
  roi: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardResponse {
  kpis: DashboardKPIs;
  recentCampaigns: RecentCampaign[];
  recentLeads: RecentLead[];
  recentApprovals: ApprovalItem[];
}

export const CAMPAIGN_GOAL_LABELS: Record<CampaignGoal, string> = {
  increase_leads: 'Increase Leads',
  promote_course: 'Promote Course',
  drive_events: 'Drive Events',
  collect_feedback: 'Collect Feedback',
  visa_success: 'Visa Success Stories',
  deadline_reminder: 'Deadline Reminder',
  reengage_leads: 'Re-engage Leads',
  boost_referral: 'Boost Referral',
  promote_test: 'Promote Test Prep',
  promote_ielts_pte: 'Promote IELTS/PTE',
  promote_country: 'Promote Destination',
  scholarship: 'Scholarship Promo',
  university_partner: 'University Partnership',
  b2b_partner: 'B2B Partnership',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  website: 'Website',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  assigned: 'Assigned',
  converted: 'Converted',
  lost: 'Lost',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  review: 'In Review',
  approved: 'Approved',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};