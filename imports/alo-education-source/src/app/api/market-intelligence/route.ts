import { NextResponse } from 'next/server';

// ── Market Intelligence API ────────────────────────────────────────────────
// Based on patterns from:
// - guifav/market-intelligence-radar: Competitor tracking, trend analysis
// - firecrawl/web-agent: Automated web scraping for market data
// - clawnify/OpenProspector: Prospecting intelligence feeds
// - parthasarathy123/n8n-gtm-lead-enrichment: GTM workflow intelligence

interface MarketIntelligenceResponse {
  alerts: IntelAlert[];
  trends: MarketTrend[];
  competitors: Competitor[];
  pricing: PricingData[];
  lastUpdated: string;
}

interface IntelAlert {
  id: string;
  type: 'competitor' | 'trend' | 'pricing' | 'opportunity' | 'regulatory';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  metric?: string;
  change?: number;
}

interface MarketTrend {
  id: string;
  name: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  category: string;
  currentValue: number;
  previousValue: number;
  period: string;
}

interface Competitor {
  name: string;
  website: string;
  threatLevel: 'high' | 'medium' | 'low';
  recentActions: string[];
  estimatedMarketShare: number;
  pricingPosition: 'premium' | 'mid' | 'budget';
  countriesActive: string[];
  lastActivity: string;
}

interface PricingData {
  service: string;
  ourPrice: number;
  marketAvg: number;
  competitorMin: number;
  competitorMax: number;
  trend: 'up' | 'down' | 'stable';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const ALERTS: IntelAlert[] = [
  {
    id: 'ia1', type: 'competitor',
    title: 'IDP Education launched UK scholarship matching portal',
    description: 'IDP released a dedicated UK scholarship matching tool with 200+ programs. Directly competes with our course finder.',
    severity: 'high', timestamp: new Date(Date.now() - 7200000).toISOString(), source: 'Web Scraping',
    metric: 'UK Lead Share', change: -5,
  },
  {
    id: 'ia2', type: 'pricing',
    title: 'Australian university application fees increased 8%',
    description: 'Group of Eight universities raised application processing fees from AUD$100 to AUD$108 average.',
    severity: 'medium', timestamp: new Date(Date.now() - 18000000).toISOString(), source: 'Price Monitor',
    metric: 'Avg App Fee (AU)', change: 8,
  },
  {
    id: 'ia3', type: 'trend',
    title: 'German tuition-free programs gaining 23% more interest',
    description: 'Search volume for "study in Germany free" from South Asia increased 23% YoY.',
    severity: 'high', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'Google Trends',
    metric: 'Search Interest', change: 23,
  },
  {
    id: 'ia4', type: 'opportunity',
    title: 'Canada expanded Student Direct Stream for Bangladesh',
    description: 'IRCC expanded SDS to include Bangladesh. Faster visa processing expected to boost conversion rates.',
    severity: 'high', timestamp: new Date(Date.now() - 172800000).toISOString(), source: 'IRCC Updates',
    metric: 'Visa Approval Rate', change: 15,
  },
  {
    id: 'ia5', type: 'competitor',
    title: 'AECC Global running 50% off consultation promo',
    description: 'Competitor offering half-price consultations for next 2 weeks.',
    severity: 'medium', timestamp: new Date(Date.now() - 259200000).toISOString(), source: 'Social Monitor',
    metric: 'Lead Inflow', change: -8,
  },
  {
    id: 'ia6', type: 'regulatory',
    title: 'UK Home Office updated student visa financial requirements',
    description: 'Maintenance funds requirement increased by 4% for London and 3% for outside London.',
    severity: 'medium', timestamp: new Date(Date.now() - 345600000).toISOString(), source: 'UK Gov',
    metric: 'Maintenance Requirement', change: 4,
  },
  {
    id: 'ia7', type: 'trend',
    title: 'IELTS One Skill Retake adoption at 67% of test centers',
    description: 'Most IELTS centers now offer one-skill retake option.',
    severity: 'low', timestamp: new Date(Date.now() - 432000000).toISOString(), source: 'IELTS',
    metric: 'Test Retake Rate', change: 12,
  },
  {
    id: 'ia8', type: 'opportunity',
    title: 'New Zealand announces post-study work visa extension',
    description: 'NZ extended post-study work rights from 2 to 3 years for degree holders.',
    severity: 'medium', timestamp: new Date(Date.now() - 518400000).toISOString(), source: 'INZ Updates',
    metric: 'NZ Interest', change: 18,
  },
];

const TRENDS: MarketTrend[] = [
  { id: 'mt1', name: 'UK Student Visa Apps (BD)', direction: 'up', changePercent: 12, category: 'Visa', currentValue: 410, previousValue: 366, period: 'Q1 2025' },
  { id: 'mt2', name: 'Canada Study Permits (BD)', direction: 'up', changePercent: 18, category: 'Visa', currentValue: 390, previousValue: 330, period: 'Q1 2025' },
  { id: 'mt3', name: 'AU Int\'l Enrolments (SA)', direction: 'down', changePercent: -6, category: 'Enrolment', currentValue: 420, previousValue: 447, period: 'Q1 2025' },
  { id: 'mt4', name: 'IELTS Test Volume (BD)', direction: 'up', changePercent: 8, category: 'Testing', currentValue: 560, previousValue: 519, period: 'Q1 2025' },
  { id: 'mt5', name: 'Avg Consultation Fee', direction: 'stable', changePercent: 1, category: 'Pricing', currentValue: 152, previousValue: 150, period: 'Q1 2025' },
  { id: 'mt6', name: 'Germany Program Interest', direction: 'up', changePercent: 23, category: 'Interest', currentValue: 220, previousValue: 179, period: 'Q1 2025' },
  { id: 'mt7', name: 'USA F1 Visa Approval (BD)', direction: 'down', changePercent: -3, category: 'Visa', currentValue: 65, previousValue: 67, period: 'Q1 2025' },
  { id: 'mt8', name: 'NZ Application Volume', direction: 'up', changePercent: 15, category: 'Interest', currentValue: 138, previousValue: 120, period: 'Q1 2025' },
];

const COMPETITORS: Competitor[] = [
  {
    name: 'IDP Education', website: 'idp.com', threatLevel: 'high',
    recentActions: ['Launched UK scholarship portal', 'Expanded to 5 new BD cities', 'Partnered with 50+ UK universities'],
    estimatedMarketShare: 28, pricingPosition: 'mid', countriesActive: ['UK', 'Australia', 'Canada', 'NZ'],
    lastActivity: '2 hours ago',
  },
  {
    name: 'AECC Global', website: 'aecc.com', threatLevel: 'medium',
    recentActions: ['50% off consultation promo', 'New Melbourne office', 'Social media campaign'],
    estimatedMarketShare: 15, pricingPosition: 'budget', countriesActive: ['Australia', 'UK', 'Canada'],
    lastActivity: '3 days ago',
  },
  {
    name: 'SI-UK', website: 'studyinternational.com', threatLevel: 'medium',
    recentActions: ['Updated university database', 'Added visa tracker tool'],
    estimatedMarketShare: 12, pricingPosition: 'mid', countriesActive: ['UK'],
    lastActivity: '1 week ago',
  },
  {
    name: 'The Chopras', website: 'thechopras.com', threatLevel: 'low',
    recentActions: ['Reduced ad spend', 'Staff reductions reported'],
    estimatedMarketShare: 8, pricingPosition: 'premium', countriesActive: ['UK', 'Ireland'],
    lastActivity: '2 weeks ago',
  },
  {
    name: 'Study Group', website: 'studygroup.com', threatLevel: 'medium',
    recentActions: ['New pathway programs', 'Digital transformation initiative'],
    estimatedMarketShare: 10, pricingPosition: 'premium', countriesActive: ['UK', 'Australia', 'NZ'],
    lastActivity: '5 days ago',
  },
];

const PRICING: PricingData[] = [
  { service: 'Initial Consultation', ourPrice: 150, marketAvg: 155, competitorMin: 75, competitorMax: 250, trend: 'stable' },
  { service: 'Application Processing', ourPrice: 500, marketAvg: 520, competitorMin: 350, competitorMax: 800, trend: 'up' },
  { service: 'Visa Assistance', ourPrice: 300, marketAvg: 280, competitorMin: 150, competitorMax: 500, trend: 'stable' },
  { service: 'IELTS Preparation', ourPrice: 200, marketAvg: 220, competitorMin: 100, competitorMax: 400, trend: 'down' },
  { service: 'Pre-departure Briefing', ourPrice: 50, marketAvg: 75, competitorMin: 0, competitorMax: 150, trend: 'stable' },
  { service: 'Accommodation Assistance', ourPrice: 100, marketAvg: 120, competitorMin: 50, competitorMax: 200, trend: 'up' },
];

export async function GET() {
  const response: MarketIntelligenceResponse = {
    alerts: ALERTS,
    trends: TRENDS,
    competitors: COMPETITORS,
    pricing: PRICING,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
