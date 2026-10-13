'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calculator,
  ChevronRight,
  DollarSign,
  GraduationCap,
  TrendingUp,
  ExternalLink,
  Banknote,
  Scale,
  Star,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

interface BankLoan {
  bank: string;
  logo: string;
  interestRate: number; // % per year
  maxAmount: number; // in BDT
  maxTenure: number; // years
  processingFee: number; // % of loan
  collateral: string;
  specialFeatures: string[];
  minGPA?: number;
  url: string;
  color: string;
}

interface LoanComparisonPageProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Bank Data ────────────────────────────────────────────────────────────

const BANK_LOANS: BankLoan[] = [
  {
    bank: 'Dutch-Bangla Bank (DBBL)',
    logo: '🏦',
    interestRate: 9.5,
    maxAmount: 20000000,
    maxTenure: 10,
    processingFee: 0.5,
    collateral: 'Property mortgage or FDR',
    specialFeatures: ['Lowest interest rate', 'Quick disbursement', 'No hidden charges', 'Online tracking'],
    url: 'https://www.dbbl.com.bd',
    color: '#1a5276',
  },
  {
    bank: 'BRAC Bank',
    logo: '🏦',
    interestRate: 10.0,
    maxAmount: 15000000,
    maxTenure: 8,
    processingFee: 1.0,
    collateral: 'Property mortgage or guarantor',
    specialFeatures: ['Fast approval (7-14 days)', 'Flexible repayment', 'Student-friendly terms', 'Branch network'],
    url: 'https://www.bracbank.com',
    color: '#7d3c98',
  },
  {
    bank: 'City Bank',
    logo: '🏦',
    interestRate: 10.5,
    maxAmount: 15000000,
    maxTenure: 7,
    processingFee: 1.0,
    collateral: 'Property mortgage',
    specialFeatures: ['American Express partnership', 'Competitive rates', 'Good for USA-bound students', 'Online banking'],
    url: 'https://www.thecitybank.com',
    color: '#c0392b',
  },
  {
    bank: 'Prime Bank',
    logo: '🏦',
    interestRate: 10.0,
    maxAmount: 10000000,
    maxTenure: 7,
    processingFee: 0.75,
    collateral: 'FDR or property mortgage',
    specialFeatures: ['Stable interest rates', 'Partial early repayment allowed', 'Good for UK/Germany', 'Dedicated education desk'],
    url: 'https://www.primebank.com.bd',
    color: '#27ae60',
  },
  {
    bank: 'Eastern Bank (EBL)',
    logo: '🏦',
    interestRate: 10.5,
    maxAmount: 12000000,
    maxTenure: 8,
    processingFee: 1.0,
    collateral: 'Property or FDR guarantee',
    specialFeatures: ['Premium banking service', 'Quick processing', 'Multiple disbursement option', 'Insurance coverage'],
    url: 'https://www.ebl.com.bd',
    color: '#e67e22',
  },
  {
    bank: 'Mutual Trust Bank (MTB)',
    logo: '🏦',
    interestRate: 11.0,
    maxAmount: 10000000,
    maxTenure: 7,
    processingFee: 1.0,
    collateral: 'Property mortgage or guarantor',
    specialFeatures: ['Flexible collateral options', 'Women entrepreneur friendly', 'Grace period available', 'SME education loan'],
    url: 'https://www.mutualtrustbank.com',
    color: '#2980b9',
  },
];

const TENURE_OPTIONS = [3, 5, 7, 8, 10];

// ─── EMI Calculator ───────────────────────────────────────────────────────

function calculateEMI(principal: number, annualRate: number, tenureYears: number) {
  const monthlyRate = annualRate / 12 / 100;
  const months = tenureYears * 12;

  if (monthlyRate === 0) {
    const emi = principal / months;
    return { emi, totalPayment: principal, totalInterest: 0 };
  }

  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return { emi, totalPayment, totalInterest };
}

function generateAmortization(principal: number, annualRate: number, tenureYears: number) {
  const { emi } = calculateEMI(principal, annualRate, tenureYears);
  const monthlyRate = annualRate / 12 / 100;
  const months = tenureYears * 12;
  let balance = principal;
  const schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[] = [];

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principalPart = emi - interest;
    balance -= principalPart;
    schedule.push({ month: m, emi, principal: principalPart, interest, balance: Math.max(0, balance) });
  }

  return schedule;
}

function formatBDT(amount: number): string {
  return '৳' + Math.round(amount).toLocaleString('en-IN');
}

function formatLakh(amount: number): string {
  const lakh = amount / 100000;
  if (lakh >= 100) return `৳${(lakh / 100).toFixed(1)} Cr`;
  return `৳${lakh.toFixed(1)} L`;
}

// ─── Component ────────────────────────────────────────────────────────────

export function LoanComparisonPage({ onBack, onNavigate, onLeadOpen }: LoanComparisonPageProps) {
  const [loanAmount, setLoanAmount] = useState('3000000');
  const [selectedTenure, setSelectedTenure] = useState(7);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);

  const principal = parseInt(loanAmount.replace(/[^\d]/g, '')) || 0;

  // Calculate EMI for all banks
  const bankEMIs = useMemo(() => {
    return BANK_LOANS.map(loan => {
      const effectiveRate = loan.interestRate;
      const effectiveTenure = Math.min(selectedTenure, loan.maxTenure);
      const emiResult = calculateEMI(principal, effectiveRate, effectiveTenure);
      const processingFee = principal * loan.processingFee / 100;
      const eligible = principal <= loan.maxAmount;
      return { ...loan, ...emiResult, effectiveTenure, processingFee, eligible };
    });
  }, [principal, selectedTenure]);

  // Sort by EMI (lowest first) for best match
  const sortedBanks = useMemo(() => {
    return [...bankEMIs].filter(b => b.eligible).sort((a, b) => a.emi - b.emi);
  }, [bankEMIs]);

  const bestMatch = sortedBanks[0];
  const selectedBankData = selectedBank ? bankEMIs.find(b => b.bank === selectedBank) : bestMatch;

  const amortization = useMemo(() => {
    if (!selectedBankData) return [];
    return generateAmortization(principal, selectedBankData.interestRate, selectedBankData.effectiveTenure);
  }, [principal, selectedBankData]);

  // Amortization summary by year
  const yearlySummary = useMemo(() => {
    if (!amortization.length) return [];
    const years: { year: number; principal: number; interest: number; balance: number }[] = [];
    for (let y = 0; y < Math.ceil(amortization.length / 12); y++) {
      const yearEntries = amortization.slice(y * 12, (y + 1) * 12);
      years.push({
        year: y + 1,
        principal: yearEntries.reduce((s, e) => s + e.principal, 0),
        interest: yearEntries.reduce((s, e) => s + e.interest, 0),
        balance: yearEntries[yearEntries.length - 1]?.balance || 0,
      });
    }
    return years;
  }, [amortization]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#2d3142]/60">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[#2d3142]">Education Loan Comparison</h1>
            <p className="text-xs text-[#2d3142]/50">EMI Calculator & Bangladeshi Bank Loans</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* EMI Calculator Input */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">EMI Calculator</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Loan Amount (BDT)</label>
              <Input
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder="e.g., 3000000"
                className="h-10 text-sm"
              />
              <p className="text-xs text-[#2d3142]/40 mt-1">
                {principal > 0 ? formatLakh(principal) : 'Enter amount'}
              </p>
              <div className="flex gap-2 mt-2">
                {[1000000, 2000000, 3000000, 5000000, 10000000].map(a => (
                  <button
                    key={a}
                    onClick={() => setLoanAmount(String(a))}
                    className={cn(
                      'px-2 py-1 rounded text-xs border transition-all',
                      principal === a ? 'bg-[#bf4520] text-white border-[#bf4520]' : 'bg-[#f5f5f5] text-[#2d3142]/60 border-[#2d3142]/5'
                    )}
                  >
                    {formatLakh(a)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Loan Tenure</label>
              <Select value={String(selectedTenure)} onValueChange={v => setSelectedTenure(Number(v))}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TENURE_OPTIONS.map(t => (
                    <SelectItem key={t} value={String(t)}>{t} years</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* EMI Result (Best Match) */}
        {bestMatch && principal > 0 && (
          <div className="bg-white rounded-lg p-4 border border-[#bf4520]/20">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-[#bf4520]" />
              <h3 className="text-base font-semibold text-[#2d3142]">Best Match for You</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-md bg-[#bf4520]/5">
                <p className="text-xs text-[#2d3142]/50">Bank</p>
                <p className="text-sm font-semibold text-[#2d3142] mt-1">{bestMatch.bank.split('(')[0].trim()}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-emerald-50">
                <p className="text-xs text-[#2d3142]/50">Monthly EMI</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{formatBDT(bestMatch.emi)}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-amber-50">
                <p className="text-xs text-[#2d3142]/50">Total Interest</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{formatBDT(bestMatch.totalInterest)}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-blue-50">
                <p className="text-xs text-[#2d3142]/50">Total Payment</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{formatBDT(bestMatch.totalPayment)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bank Comparison Table */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Compare All Banks</h3>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d3142]/10">
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#2d3142]/50">Bank</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-[#2d3142]/50">Interest Rate</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-[#2d3142]/50">Max Amount</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-[#2d3142]/50">Max Tenure</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-[#2d3142]/50">Processing Fee</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#2d3142]/50">Collateral</th>
                  {principal > 0 && <th className="text-right py-2 px-2 text-xs font-medium text-[#2d3142]/50">Monthly EMI</th>}
                  <th className="text-center py-2 px-2 text-xs font-medium text-[#2d3142]/50">Eligible</th>
                </tr>
              </thead>
              <tbody>
                {bankEMIs.map((b) => (
                  <tr
                    key={b.bank}
                    onClick={() => setSelectedBank(b.bank === selectedBank ? null : b.bank)}
                    className={cn(
                      'border-b border-[#2d3142]/5 cursor-pointer hover:bg-[#f5f5f5] transition-colors',
                      selectedBank === b.bank && 'bg-[#bf4520]/5'
                    )}
                  >
                    <td className="py-2 px-2 font-medium text-[#2d3142]">{b.bank.split('(')[0].trim()}</td>
                    <td className="py-2 px-2 text-right text-[#2d3142]">{b.interestRate}%</td>
                    <td className="py-2 px-2 text-right text-[#2d3142]">{formatLakh(b.maxAmount)}</td>
                    <td className="py-2 px-2 text-right text-[#2d3142]">{b.maxTenure} yrs</td>
                    <td className="py-2 px-2 text-right text-[#2d3142]">{b.processingFee}%</td>
                    <td className="py-2 px-2 text-[#2d3142]/70 text-xs">{b.collateral}</td>
                    {principal > 0 && (
                      <td className="py-2 px-2 text-right font-medium text-[#2d3142]">
                        {b.eligible ? formatBDT(b.emi) : '—'}
                      </td>
                    )}
                    <td className="py-2 px-2 text-center">
                      {b.eligible ? (
                        <span className="text-emerald-500">✓</span>
                      ) : (
                        <span className="text-[#2d3142]/30">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {bankEMIs.map((b) => (
              <div
                key={b.bank}
                onClick={() => setSelectedBank(b.bank === selectedBank ? null : b.bank)}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-all',
                  selectedBank === b.bank ? 'border-[#bf4520] bg-[#bf4520]/5' : 'border-[#2d3142]/5'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#2d3142]">{b.bank}</span>
                  {b.eligible ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Eligible</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Over limit</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#2d3142]/50">Rate:</span> <span className="text-[#2d3142]">{b.interestRate}%</span></div>
                  <div><span className="text-[#2d3142]/50">Max:</span> <span className="text-[#2d3142]">{formatLakh(b.maxAmount)}</span></div>
                  <div><span className="text-[#2d3142]/50">Tenure:</span> <span className="text-[#2d3142]">{b.maxTenure} yrs</span></div>
                  <div><span className="text-[#2d3142]/50">Fee:</span> <span className="text-[#2d3142]">{b.processingFee}%</span></div>
                  {b.eligible && principal > 0 && (
                    <div className="col-span-2"><span className="text-[#2d3142]/50">EMI:</span> <span className="font-medium text-[#bf4520]">{formatBDT(b.emi)}/mo</span></div>
                  )}
                </div>
                <p className="text-xs text-[#2d3142]/50 mt-1">Collateral: {b.collateral}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Bank Details */}
        {selectedBankData && principal > 0 && (
          <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#bf4520]" />
                <h3 className="text-base font-semibold text-[#2d3142]">{selectedBankData.bank}</h3>
              </div>
              <Button variant="outline" size="sm" className="text-xs border-[#bf4520]/30 text-[#bf4520]" asChild>
                <a href={selectedBankData.url} target="_blank" rel="noopener noreferrer">
                  Apply for Loan <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>

            {/* EMI Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-md bg-[#f5f5f5]">
                <p className="text-xs text-[#2d3142]/50">Monthly EMI</p>
                <p className="text-lg font-bold text-[#bf4520]">{formatBDT(selectedBankData.emi)}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-[#f5f5f5]">
                <p className="text-xs text-[#2d3142]/50">Total Interest</p>
                <p className="text-lg font-bold text-amber-600">{formatBDT(selectedBankData.totalInterest)}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-[#f5f5f5]">
                <p className="text-xs text-[#2d3142]/50">Total Payment</p>
                <p className="text-lg font-bold text-[#2d3142]">{formatBDT(selectedBankData.totalPayment)}</p>
              </div>
            </div>

            {/* Special Features */}
            <div className="mb-4">
              <p className="text-xs font-medium text-[#2d3142]/50 mb-2">Special Features</p>
              <div className="flex flex-wrap gap-2">
                {selectedBankData.specialFeatures.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-[#f5f5f5] text-[#2d3142]/70 border-0">{f}</Badge>
                ))}
              </div>
            </div>

            {/* Processing Fee */}
            <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 mb-4">
              <span className="text-sm text-amber-800">Processing Fee ({selectedBankData.processingFee}%)</span>
              <span className="text-sm font-medium text-amber-800">{formatBDT(selectedBankData.processingFee)}</span>
            </div>

            {/* Amortization Toggle */}
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="text-xs text-[#bf4520] hover:underline"
            >
              {showAmortization ? 'Hide' : 'Show'} Amortization Schedule
            </button>

            {showAmortization && yearlySummary.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2d3142]/10">
                      <th className="text-left py-1.5 px-2 text-[#2d3142]/50">Year</th>
                      <th className="text-right py-1.5 px-2 text-[#2d3142]/50">Principal</th>
                      <th className="text-right py-1.5 px-2 text-[#2d3142]/50">Interest</th>
                      <th className="text-right py-1.5 px-2 text-[#2d3142]/50">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlySummary.map(y => (
                      <tr key={y.year} className="border-b border-[#2d3142]/5">
                        <td className="py-1.5 px-2 text-[#2d3142]">{y.year}</td>
                        <td className="py-1.5 px-2 text-right text-emerald-600">{formatBDT(y.principal)}</td>
                        <td className="py-1.5 px-2 text-right text-amber-600">{formatBDT(y.interest)}</td>
                        <td className="py-1.5 px-2 text-right text-[#2d3142]">{formatBDT(y.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#bf4520] rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">Need Help with Education Loans?</h3>
          <p className="text-sm opacity-90 mb-4">ALO Education partners with banks to get you the best rates. We handle the paperwork too.</p>
          <Button onClick={onLeadOpen} className="bg-white text-[#bf4520] hover:bg-white/90">
            Get Loan Assistance
          </Button>
        </div>
      </div>
    </div>
  );
}
