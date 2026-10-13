'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Calculator,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';

/**
 * Education Loan Comparison Cards
 *
 * Inspired by Studytra's LoanGuidance component:
 * - Verified bank data (SBI, Credila, ICICI, Avanse, etc.)
 * - Pros/Cons display
 * - Interest rate comparison
 * - Collateral requirements
 * - Country coverage
 * - Expandable details
 */

// ─── Bank Data ───────────────────────────────────────────────────────────────

interface BankLoanData {
  id: string;
  name: string;
  shortName: string;
  loanName: string;
  type: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  interestRate: string;
  maxLoan: string;
  collateral: string;
  collateralNote: string;
  moratorium: string;
  repayment: string;
  processingFee: string;
  taxBenefit: string;
  pros: string[];
  cons: string[];
  applyUrl: string;
  countries: string[];
}

const BANKS: BankLoanData[] = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    loanName: 'Global Ed-Vantage Scheme',
    type: 'Public Sector Bank',
    color: '#1A4BA0',
    badge: 'Lowest Rate',
    badgeColor: '#1A4BA0',
    interestRate: '9.15% – 11.15%',
    maxLoan: '₹1.5 Crore',
    collateral: 'Required above ₹7.5L',
    collateralNote: 'Unsecured up to ₹50L for premier foreign universities',
    moratorium: 'Course + 6 months',
    repayment: 'Up to 15 years',
    processingFee: 'Free up to ₹20L | ₹10K above',
    taxBenefit: 'Section 80E',
    pros: [
      'Lowest interest rate among all lenders',
      'Simple interest during moratorium',
      'Up to 15 years repayment — longest tenure',
      'Pre-visa disbursement available',
    ],
    cons: [
      'Longer processing time (15–20 days)',
      'Strict document requirements',
      'Branch visit usually required',
    ],
    applyUrl: 'https://sbi.co.in',
    countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany'],
  },
  {
    id: 'credila',
    name: 'Credila Financial Services',
    shortName: 'Credila',
    loanName: 'Education Loan for Abroad',
    type: 'NBFC',
    color: '#005A8E',
    badge: 'Most Popular',
    badgeColor: '#005A8E',
    interestRate: '9.75% – 13.0%',
    maxLoan: '₹75L (unsecured)',
    collateral: 'Optional',
    collateralNote: '100% financing available. Unsecured up to ₹75L',
    moratorium: 'Course + 12 months',
    repayment: 'Up to 14 years',
    processingFee: '0.5% – 1.25% + GST',
    taxBenefit: 'Section 80E',
    pros: [
      'Fully digital — paperless process',
      'Approval in 7–12 working days',
      'No prepayment charges',
      'Pre-visa & pre-admission loans available',
    ],
    cons: [
      'Higher interest than public banks',
      'Processing fee not waived',
    ],
    applyUrl: 'https://www.credila.com',
    countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany'],
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    loanName: 'Education Loan',
    type: 'Private Bank',
    color: '#F37321',
    badge: 'Fast Processing',
    badgeColor: '#F37321',
    interestRate: '10.25% – 12.75%',
    maxLoan: '₹1 Crore',
    collateral: 'Required above ₹7.5L',
    collateralNote: 'Unsecured up to ₹40L for select universities',
    moratorium: 'Course + 6 months',
    repayment: 'Up to 10 years',
    processingFee: '1% + GST',
    taxBenefit: 'Section 80E',
    pros: [
      'Fast processing (7–10 days)',
      'Good for existing ICICI customers',
      'Online tracking available',
    ],
    cons: [
      'Higher interest than SBI',
      'Processing fee applies',
      'Shorter repayment tenure',
    ],
    applyUrl: 'https://www.icicibank.com',
    countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany'],
  },
  {
    id: 'avanse',
    name: 'Avanse Financial Services',
    shortName: 'Avanse',
    loanName: 'Education Loan',
    type: 'NBFC',
    color: '#5B2C8E',
    interestRate: '10.5% – 14.0%',
    maxLoan: '₹75L (unsecured)',
    collateral: 'Not Required',
    collateralNote: '100% financing, no collateral for most cases',
    moratorium: 'Course + 12 months',
    repayment: 'Up to 12 years',
    processingFee: '1% – 2% + GST',
    taxBenefit: 'Section 80E',
    pros: [
      'No collateral required in most cases',
      'Covers living expenses fully',
      'Flexible repayment options',
    ],
    cons: [
      'Highest interest rate range',
      'Processing fee is higher',
    ],
    applyUrl: 'https://www.avanse.com',
    countries: ['USA', 'UK', 'Canada', 'Australia'],
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface LoanComparisonCardsProps {
  /** Target country to highlight applicable banks */
  targetCountry?: string;
  /** Max number of cards to show */
  maxShow?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LoanComparisonCards({
  targetCountry,
  maxShow = 4,
}: LoanComparisonCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter banks by target country if specified
  const filteredBanks = targetCountry
    ? BANKS.filter(b => b.countries.includes(targetCountry))
    : BANKS;

  const displayBanks = filteredBanks.slice(0, maxShow);

  return (
    <Card className="border border-alo-gray-medium/60 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-alo-orange" />
          <CardTitle className="text-lg font-bold">Education Loan Comparison</CardTitle>
        </div>
        {targetCountry && (
          <p className="text-sm text-muted-foreground mt-1">
            Showing loans applicable for <span className="font-semibold">{targetCountry}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBanks.map((bank) => {
            const isExpanded = expandedId === bank.id;
            return (
              <motion.div
                key={bank.id}
                className={cn(
                  'rounded-xl border overflow-hidden transition-colors',
                  isExpanded ? 'border-alo-blue/30 bg-alo-blue-light/20' : 'border-alo-gray-medium/40 bg-white hover:border-alo-gray-medium'
                )}
                layout
              >
                {/* Bank Header — always visible */}
                <button
                  type="button"
                  className="w-full text-left p-4"
                  onClick={() => setExpandedId(isExpanded ? null : bank.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">{bank.name}</h4>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-0 bg-gray-100">
                          {bank.type}
                        </Badge>
                        {bank.badge && (
                          <Badge className="text-[10px] font-semibold text-white border-0" style={{ backgroundColor: bank.badgeColor }}>
                            {bank.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{bank.loanName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <p className="text-sm font-bold" style={{ color: bank.color }}>
                          {bank.interestRate}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-alo-gray-medium/30 px-4 pb-4 pt-3 space-y-3"
                  >
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <DetailItem icon={Calculator} label="Max Loan" value={bank.maxLoan} />
                      <DetailItem icon={Shield} label="Collateral" value={bank.collateral} />
                      <DetailItem icon={Clock} label="Moratorium" value={bank.moratorium} />
                      <DetailItem icon={Clock} label="Repayment" value={bank.repayment} />
                      <DetailItem icon={Calculator} label="Processing Fee" value={bank.processingFee} />
                      <DetailItem icon={Award} label="Tax Benefit" value={bank.taxBenefit} />
                    </div>

                    {/* Collateral Note */}
                    <p className="text-xs text-muted-foreground italic">{bank.collateralNote}</p>

                    {/* Pros */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-emerald-700">Advantages</p>
                      {bank.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cons */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-700">Considerations</p>
                      {bank.cons.map((con, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>

                    {/* Countries */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Applicable for:</span>
                      {bank.countries.map(c => (
                        <Badge key={c} variant="outline" className="text-[10px] border-alo-blue/20 text-alo-blue">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    {/* Apply CTA */}
                    <Button
                      asChild
                      className="w-full mt-2"
                      style={{ backgroundColor: bank.color }}
                    >
                      <a href={bank.applyUrl} target="_blank" rel="noopener noreferrer">
                        Apply on {bank.shortName} Website
                        <ExternalLink className="h-3.5 w-3.5 ml-2" />
                      </a>
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredBanks.length > maxShow && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            +{filteredBanks.length - maxShow} more lenders available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-component ──────────────────────────────────────────────────────────

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
      <p className="text-xs font-semibold text-foreground pl-4">{value}</p>
    </div>
  );
}
