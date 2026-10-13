import { NextRequest, NextResponse } from 'next/server';

// ── Lead Enrichment API ─────────────────────────────────────────────────────
// Based on patterns from:
// - ioi-labs/molx: AI lead enrichment with scoring
// - firecrawl/firecrawl: Web scraping for company/social data
// - brightdata/open-enrich: Email verification, phone validation
// - parthasarathy123/n8n-gtm-lead-enrichment: GTM automation pipeline

interface EnrichmentResult {
  leadId: string;
  status: 'enriching' | 'complete';
  message: string;
  enrichmentSteps: EnrichmentStep[];
  enrichedData?: Record<string, unknown>;
  score?: LeadScore;
}

interface EnrichmentStep {
  name: string;
  status: 'done' | 'running' | 'pending' | 'error';
  duration?: number;
  result?: string;
}

interface LeadScore {
  total: number;
  tier: 'HOT' | 'WARM' | 'COLD';
  factors: {
    name: string;
    weight: number;
    score: number;
  }[];
}

// Simulated enrichment pipeline steps (mirrors real tools)
const ENRICHMENT_PIPELINE: { name: string; avgDuration: number }[] = [
  { name: 'Email Verification', avgDuration: 1.2 },
  { name: 'Phone Validation', avgDuration: 0.8 },
  { name: 'Company Lookup', avgDuration: 2.1 },
  { name: 'Social Profile Scan', avgDuration: 3.5 },
  { name: 'Budget Estimation', avgDuration: 1.0 },
  { name: 'Qualification Scoring', avgDuration: 0.5 },
  { name: 'Competitive Intelligence', avgDuration: 1.8 },
];

function computeLeadScore(leadId: string): LeadScore {
  const seed = leadId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (offset: number) => ((seed * 9301 + offset * 49297 + 233) % 100);

  const factors = [
    { name: 'Source Quality', weight: 20, score: 50 + (rand(1) % 50) },
    { name: 'Engagement Level', weight: 25, score: 40 + (rand(2) % 55) },
    { name: 'Budget Fit', weight: 15, score: 45 + (rand(3) % 50) },
    { name: 'Timeline Readiness', weight: 15, score: 40 + (rand(4) % 55) },
    { name: 'Qualification Match', weight: 15, score: 55 + (rand(5) % 40) },
    { name: 'Profile Completeness', weight: 10, score: 30 + (rand(6) % 65) },
  ];

  const total = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0)
  );

  const tier: 'HOT' | 'WARM' | 'COLD' = total >= 75 ? 'HOT' : total >= 50 ? 'WARM' : 'COLD';

  return { total, tier, factors };
}

function generateEnrichedData(leadId: string): Record<string, unknown> {
  const seed = leadId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail'];
  const companySizes = ['1-10', '10-50', '50-200', '200-500', '500-1000'];
  const countries = ['Bangladesh', 'India', 'Pakistan', 'Sri Lanka', 'Nepal'];
  const cities = ['Dhaka', 'Mumbai', 'Karachi', 'Delhi', 'Chittagong'];

  return {
    emailVerified: seed % 3 !== 0,
    phoneValid: seed % 2 === 0,
    company: `Company_${seed % 100}`,
    companySize: companySizes[seed % companySizes.length],
    industry: industries[seed % industries.length],
    location: `${cities[seed % cities.length]}, ${countries[seed % countries.length]}`,
    linkedin: seed % 3 === 0 ? `linkedin.com/in/profile_${seed}` : null,
    website: seed % 4 === 0 ? `company${seed}.com` : null,
    estimatedBudget: `$${(20 + (seed % 30))},000-$${(40 + (seed % 20))},000`,
    timeline: seed % 2 === 0 ? 'Fall 2025' : 'Spring 2026',
    socialProfiles: (seed % 3 === 0)
      ? [{ platform: 'LinkedIn', verified: true, followers: 100 + (seed % 900) }]
      : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    // Simulate enrichment pipeline execution
    const steps: EnrichmentStep[] = ENRICHMENT_PIPELINE.map((step, i) => ({
      name: step.name,
      status: i < 3 ? 'done' as const : i === 3 ? 'running' as const : 'pending' as const,
      duration: i < 3 ? +(step.avgDuration + Math.random() * 0.5).toFixed(1) : undefined,
      result: i < 3 ? 'Completed successfully' : undefined,
    }));

    const isComplete = leadId === 'bulk' || leadId.startsWith('el');
    const score = computeLeadScore(leadId);
    const enrichedData = generateEnrichedData(leadId);

    const result: EnrichmentResult = {
      leadId,
      status: isComplete ? 'complete' : 'enriching',
      message: isComplete
        ? `Lead ${leadId} enrichment completed. Score: ${score.total} (${score.tier})`
        : `Lead ${leadId} enrichment started. ${steps.filter(s => s.status === 'done').length}/${steps.length} steps complete.`,
      enrichmentSteps: isComplete
        ? ENRICHMENT_PIPELINE.map(step => ({
            name: step.name,
            status: 'done' as const,
            duration: +(step.avgDuration + Math.random() * 0.3).toFixed(1),
            result: 'Completed successfully',
          }))
        : steps,
      enrichedData: isComplete ? enrichedData : undefined,
      score: isComplete ? score : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process enrichment request', details: String(error) },
      { status: 500 }
    );
  }
}
