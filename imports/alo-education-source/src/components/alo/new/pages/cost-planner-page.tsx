'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Calculator,
  ChevronRight,
  DollarSign,
  Globe,
  GraduationCap,
  MapPin,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  School,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

interface CityData {
  name: string;
  universities: string[];
  tuitionUG: [number, number];
  tuitionPG: [number, number];
  tuitionPhD: [number, number];
  livingRent: number;
  livingFood: number;
  livingTransport: number;
  livingUtilities: number;
  healthInsurance: number;
  currency: string;
  currencyToBDT: number;
}

interface CountryCostData {
  name: string;
  flag: string;
  visaAppFeeBDT: number;
  otherVisaFeesBDT: number;
  depositBDT: number;
  flightCostBDT: number;
  cities: CityData[];
}

interface CostPlannerPageProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Cost Data ────────────────────────────────────────────────────────────

const COST_DATA: Record<string, CountryCostData> = {
  uk: {
    name: 'United Kingdom', flag: '🇬🇧',
    visaAppFeeBDT: 52896, otherVisaFeesBDT: 71440 + 5000 + 3500, depositBDT: 0, flightCostBDT: 80000,
    cities: [
      { name: 'London', universities: ['UCL', 'Imperial College', 'King\'s College', 'LSE', 'Queen Mary'], tuitionUG: [15000, 25000], tuitionPG: [15000, 30000], tuitionPhD: [18000, 28000], livingRent: 1200, livingFood: 350, livingTransport: 150, livingUtilities: 120, healthInsurance: 0, currency: 'GBP', currencyToBDT: 152 },
      { name: 'Manchester', universities: ['University of Manchester', 'MMU', 'Salford'], tuitionUG: [14000, 22000], tuitionPG: [14000, 24000], tuitionPhD: [16000, 24000], livingRent: 650, livingFood: 250, livingTransport: 80, livingUtilities: 100, healthInsurance: 0, currency: 'GBP', currencyToBDT: 152 },
      { name: 'Birmingham', universities: ['University of Birmingham', 'Aston', 'BCU'], tuitionUG: [13000, 21000], tuitionPG: [14000, 23000], tuitionPhD: [15000, 23000], livingRent: 550, livingFood: 230, livingTransport: 70, livingUtilities: 95, healthInsurance: 0, currency: 'GBP', currencyToBDT: 152 },
      { name: 'Glasgow', universities: ['University of Glasgow', 'Strathclyde', 'GCU'], tuitionUG: [12000, 20000], tuitionPG: [13000, 22000], tuitionPhD: [14000, 22000], livingRent: 450, livingFood: 200, livingTransport: 60, livingUtilities: 85, healthInsurance: 0, currency: 'GBP', currencyToBDT: 152 },
      { name: 'Leeds', universities: ['University of Leeds', 'Leeds Beckett'], tuitionUG: [12000, 20000], tuitionPG: [13000, 22000], tuitionPhD: [14000, 21000], livingRent: 480, livingFood: 220, livingTransport: 65, livingUtilities: 90, healthInsurance: 0, currency: 'GBP', currencyToBDT: 152 },
    ],
  },
  usa: {
    name: 'United States', flag: '🇺🇸',
    visaAppFeeBDT: 22200 + 22200, otherVisaFeesBDT: 8000, depositBDT: 0, flightCostBDT: 90000,
    cities: [
      { name: 'New York', universities: ['NYU', 'Columbia', 'CUNY', 'Pace'], tuitionUG: [30000, 55000], tuitionPG: [30000, 60000], tuitionPhD: [25000, 50000], livingRent: 2000, livingFood: 400, livingTransport: 130, livingUtilities: 150, healthInsurance: 200, currency: 'USD', currencyToBDT: 120 },
      { name: 'Boston', universities: ['Harvard', 'MIT', 'BU', 'Northeastern', 'BC'], tuitionUG: [28000, 55000], tuitionPG: [30000, 60000], tuitionPhD: [25000, 50000], livingRent: 1500, livingFood: 350, livingTransport: 100, livingUtilities: 130, healthInsurance: 180, currency: 'USD', currencyToBDT: 120 },
      { name: 'San Francisco', universities: ['Stanford', 'UC Berkeley', 'SFSU'], tuitionUG: [25000, 50000], tuitionPG: [28000, 55000], tuitionPhD: [25000, 50000], livingRent: 1800, livingFood: 380, livingTransport: 120, livingUtilities: 140, healthInsurance: 190, currency: 'USD', currencyToBDT: 120 },
      { name: 'Chicago', universities: ['UChicago', 'Northwestern', 'UIC', 'IIT'], tuitionUG: [25000, 50000], tuitionPG: [28000, 55000], tuitionPhD: [25000, 45000], livingRent: 900, livingFood: 300, livingTransport: 80, livingUtilities: 110, healthInsurance: 170, currency: 'USD', currencyToBDT: 120 },
      { name: 'Texas', universities: ['UT Austin', 'TAMU', 'Rice', 'UT Dallas'], tuitionUG: [20000, 45000], tuitionPG: [22000, 48000], tuitionPhD: [20000, 40000], livingRent: 600, livingFood: 250, livingTransport: 70, livingUtilities: 100, healthInsurance: 150, currency: 'USD', currencyToBDT: 120 },
    ],
  },
  canada: {
    name: 'Canada', flag: '🇨🇦',
    visaAppFeeBDT: 13200 + 7480, otherVisaFeesBDT: 12000, depositBDT: 0, flightCostBDT: 85000,
    cities: [
      { name: 'Toronto', universities: ['University of Toronto', 'York', 'Ryerson'], tuitionUG: [25000, 45000], tuitionPG: [18000, 40000], tuitionPhD: [8000, 20000], livingRent: 1200, livingFood: 350, livingTransport: 140, livingUtilities: 120, healthInsurance: 50, currency: 'CAD', currencyToBDT: 88 },
      { name: 'Vancouver', universities: ['UBC', 'SFU', 'UVic'], tuitionUG: [25000, 42000], tuitionPG: [16000, 35000], tuitionPhD: [8000, 18000], livingRent: 1100, livingFood: 330, livingTransport: 120, livingUtilities: 110, healthInsurance: 50, currency: 'CAD', currencyToBDT: 88 },
      { name: 'Montreal', universities: ['McGill', 'Concordia', 'UdeM'], tuitionUG: [18000, 35000], tuitionPG: [12000, 25000], tuitionPhD: [6000, 15000], livingRent: 700, livingFood: 280, livingTransport: 80, livingUtilities: 90, healthInsurance: 40, currency: 'CAD', currencyToBDT: 88 },
      { name: 'Waterloo', universities: ['University of Waterloo', 'WLU', 'Conestoga'], tuitionUG: [22000, 38000], tuitionPG: [15000, 30000], tuitionPhD: [7000, 18000], livingRent: 800, livingFood: 280, livingTransport: 70, livingUtilities: 95, healthInsurance: 45, currency: 'CAD', currencyToBDT: 88 },
    ],
  },
  australia: {
    name: 'Australia', flag: '🇦🇺',
    visaAppFeeBDT: 50700, otherVisaFeesBDT: 46800 + 10000, depositBDT: 0, flightCostBDT: 75000,
    cities: [
      { name: 'Melbourne', universities: ['University of Melbourne', 'Monash', 'RMIT', 'Deakin'], tuitionUG: [25000, 45000], tuitionPG: [22000, 48000], tuitionPhD: [20000, 42000], livingRent: 1100, livingFood: 320, livingTransport: 120, livingUtilities: 100, healthInsurance: 45, currency: 'AUD', currencyToBDT: 78 },
      { name: 'Sydney', universities: ['USYD', 'UNSW', 'UTS', 'Macquarie'], tuitionUG: [28000, 48000], tuitionPG: [24000, 50000], tuitionPhD: [22000, 45000], livingRent: 1300, livingFood: 350, livingTransport: 130, livingUtilities: 110, healthInsurance: 45, currency: 'AUD', currencyToBDT: 78 },
      { name: 'Brisbane', universities: ['UQ', 'QUT', 'Griffith'], tuitionUG: [22000, 40000], tuitionPG: [20000, 42000], tuitionPhD: [18000, 38000], livingRent: 700, livingFood: 280, livingTransport: 90, livingUtilities: 90, healthInsurance: 40, currency: 'AUD', currencyToBDT: 78 },
      { name: 'Perth', universities: ['UWA', 'Curtin', 'Murdoch'], tuitionUG: [22000, 38000], tuitionPG: [20000, 40000], tuitionPhD: [18000, 36000], livingRent: 650, livingFood: 260, livingTransport: 80, livingUtilities: 85, healthInsurance: 40, currency: 'AUD', currencyToBDT: 78 },
    ],
  },
  germany: {
    name: 'Germany', flag: '🇩🇪',
    visaAppFeeBDT: 9750, otherVisaFeesBDT: 5000 + 25000, depositBDT: 1457040, flightCostBDT: 65000,
    cities: [
      { name: 'Munich', universities: ['TU Munich', 'LMU Munich'], tuitionUG: [0, 500], tuitionPG: [0, 500], tuitionPhD: [0, 500], livingRent: 800, livingFood: 280, livingTransport: 60, livingUtilities: 120, healthInsurance: 110, currency: 'EUR', currencyToBDT: 130 },
      { name: 'Berlin', universities: ['TU Berlin', 'HU Berlin', 'FU Berlin'], tuitionUG: [0, 500], tuitionPG: [0, 500], tuitionPhD: [0, 500], livingRent: 550, livingFood: 250, livingTransport: 80, livingUtilities: 100, healthInsurance: 110, currency: 'EUR', currencyToBDT: 130 },
      { name: 'Aachen', universities: ['RWTH Aachen'], tuitionUG: [0, 500], tuitionPG: [0, 500], tuitionPhD: [0, 500], livingRent: 450, livingFood: 230, livingTransport: 50, livingUtilities: 90, healthInsurance: 110, currency: 'EUR', currencyToBDT: 130 },
      { name: 'Hamburg', universities: ['TU Hamburg', 'UHH'], tuitionUG: [0, 500], tuitionPG: [0, 500], tuitionPhD: [0, 500], livingRent: 600, livingFood: 260, livingTransport: 70, livingUtilities: 105, healthInsurance: 110, currency: 'EUR', currencyToBDT: 130 },
    ],
  },
};

const COUNTRY_KEYS = Object.keys(COST_DATA);
const COURSE_LEVELS = ['UG', 'PG', 'PhD'] as const;
type CourseLevel = typeof COURSE_LEVELS[number];

// ─── Helper ───────────────────────────────────────────────────────────────

function formatBDT(amount: number): string {
  return '৳' + Math.round(amount).toLocaleString('en-IN');
}

function getTuition(city: CityData, level: CourseLevel): [number, number] {
  switch (level) {
    case 'UG': return city.tuitionUG;
    case 'PG': return city.tuitionPG;
    case 'PhD': return city.tuitionPhD;
  }
}

interface CostBreakdown {
  tuitionPerYearBDT: number;
  totalTuitionBDT: number;
  livingPerMonthBDT: number;
  totalLivingBDT: number;
  totalVisaFeesBDT: number;
  totalHealthInsuranceBDT: number;
  totalOneTimeBDT: number;
  totalBDT: number;
}

function calculateCosts(
  country: CountryCostData,
  city: CityData,
  level: CourseLevel,
  years: number
): CostBreakdown {
  const tuitionRange = getTuition(city, level);
  const tuitionPerYearBDT = Math.round(((tuitionRange[0] + tuitionRange[1]) / 2) * city.currencyToBDT);
  const totalTuitionBDT = tuitionPerYearBDT * years;
  const livingPerMonthBDT = Math.round((city.livingRent + city.livingFood + city.livingTransport + city.livingUtilities) * city.currencyToBDT);
  const totalLivingBDT = livingPerMonthBDT * 12 * years;
  const totalVisaFeesBDT = country.visaAppFeeBDT + country.otherVisaFeesBDT;
  const totalHealthInsuranceBDT = Math.round(city.healthInsurance * city.currencyToBDT * 12 * years);
  const totalOneTimeBDT = country.depositBDT + country.flightCostBDT;
  const totalBDT = totalTuitionBDT + totalLivingBDT + totalVisaFeesBDT + totalHealthInsuranceBDT + totalOneTimeBDT;

  return { tuitionPerYearBDT, totalTuitionBDT, livingPerMonthBDT, totalLivingBDT, totalVisaFeesBDT, totalHealthInsuranceBDT, totalOneTimeBDT, totalBDT };
}

// ─── CostCard (hoisted outside render) ──────────────────────────────────

function CostCard({ title, costs: c, countryData, cityData, accent, duration }: {
  title: string;
  costs: CostBreakdown;
  countryData: CountryCostData;
  cityData: CityData;
  accent?: boolean;
  duration: number;
}) {
  return (
    <div className={cn('space-y-4', accent && 'border-l-4 border-l-[#bf4520] pl-3')}>
      <h4 className="text-sm font-semibold text-[#2d3142]">{title}</h4>

      {/* Tuition */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-[#2d3142]/50 uppercase tracking-wide">Tuition</p>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Per year (avg)</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.tuitionPerYearBDT)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Total ({duration} yrs)</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.totalTuitionBDT)}</span>
        </div>
      </div>

      {/* Living */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-[#2d3142]/50 uppercase tracking-wide">Living Costs ({cityData.name})</p>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Per month</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.livingPerMonthBDT)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Rent</span>
          <span className="text-[#2d3142]/60">{formatBDT(Math.round(cityData.livingRent * cityData.currencyToBDT))}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Food</span>
          <span className="text-[#2d3142]/60">{formatBDT(Math.round(cityData.livingFood * cityData.currencyToBDT))}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Transport</span>
          <span className="text-[#2d3142]/60">{formatBDT(Math.round(cityData.livingTransport * cityData.currencyToBDT))}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Total ({duration} yrs)</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.totalLivingBDT)}</span>
        </div>
      </div>

      {/* Visa & Insurance */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-[#2d3142]/50 uppercase tracking-wide">Visa & Insurance</p>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Visa fees</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.totalVisaFeesBDT)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Health insurance</span>
          <span className="font-medium text-[#2d3142]">{formatBDT(c.totalHealthInsuranceBDT)}</span>
        </div>
      </div>

      {/* One-time */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-[#2d3142]/50 uppercase tracking-wide">One-time Costs</p>
        {countryData.depositBDT > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#2d3142]/70">Blocked account/deposit</span>
            <span className="text-[#2d3142]/60">{formatBDT(countryData.depositBDT)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[#2d3142]/70">Flight</span>
          <span className="text-[#2d3142]/60">{formatBDT(countryData.flightCostBDT)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-[#2d3142]/10">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-[#2d3142]">Total Estimated Cost</span>
          <span className="text-xl font-bold text-[#bf4520]">{formatBDT(c.totalBDT)}</span>
        </div>
        <p className="text-xs text-[#2d3142]/40 mt-1">All amounts in BDT. Tuition shown is average of range.</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function CostPlannerPage({ onBack, onNavigate, onLeadOpen }: CostPlannerPageProps) {
  const [selectedCountry, setSelectedCountry] = useState('uk');
  const [selectedCity, setSelectedCity] = useState(0);
  const [courseLevel, setCourseLevel] = useState<CourseLevel>('PG');
  const [duration, setDuration] = useState(2);
  const [budget, setBudget] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareCountry, setCompareCountry] = useState('canada');
  const [compareCity, setCompareCity] = useState(0);

  const country = COST_DATA[selectedCountry];
  const city = country.cities[selectedCity] || country.cities[0];
  const costs = useMemo(() => calculateCosts(country, city, courseLevel, duration), [country, city, courseLevel, duration]);

  const compareCountryData = COST_DATA[compareCountry];
  const compareCityData = compareCountryData?.cities[compareCity] || compareCountryData?.cities[0];
  const compareCosts = useMemo(() => {
    if (!compareMode || !compareCountryData || !compareCityData) return null;
    return calculateCosts(compareCountryData, compareCityData, courseLevel, duration);
  }, [compareMode, compareCountryData, compareCityData, courseLevel, duration]);

  const budgetNum = parseInt(budget.replace(/[^\d]/g, '')) || 0;
  const budgetRatio = budgetNum > 0 ? Math.min((budgetNum / costs.totalBDT) * 100, 100) : 0;
  const withinBudget = budgetNum > 0 && budgetNum >= costs.totalBDT;
  const budgetGap = budgetNum > 0 ? costs.totalBDT - budgetNum : 0;

  const handleCountryChange = useCallback((key: string) => {
    setSelectedCountry(key);
    setSelectedCity(0);
  }, []);

  const handleCompareCountryChange = useCallback((key: string) => {
    setCompareCountry(key);
    setCompareCity(0);
  }, []);

  const scholarshipSuggestions = useMemo(() => {
    if (budgetGap <= 0) return [];
    const suggestions: { name: string; amount: string; source: string }[] = [];
    if (budgetGap > 1000000) {
      suggestions.push({ name: 'Chevening Scholarship', amount: 'Full funding', source: 'UK Government' });
      suggestions.push({ name: 'Commonwealth Scholarship', amount: 'Full funding', source: 'UK Government' });
    }
    if (budgetGap > 500000) {
      suggestions.push({ name: 'DAAD Scholarship', amount: '€934/month', source: 'Germany' });
      suggestions.push({ name: 'Fulbright Scholarship', amount: 'Full funding', source: 'USA' });
    }
    if (budgetGap > 200000) {
      suggestions.push({ name: 'Australia Awards', amount: 'Full funding', source: 'Australia' });
      suggestions.push({ name: 'University-specific scholarship', amount: 'Partial (25-50%)', source: 'Universities' });
    }
    suggestions.push({ name: 'ALO Education Bursary', amount: 'Up to ৳2,00,000', source: 'ALO Education' });
    return suggestions;
  }, [budgetGap]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#2d3142]/60">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#2d3142]">Cost Planner</h1>
              <p className="text-xs text-[#2d3142]/50">City-level cost breakdown in BDT</p>
            </div>
          </div>
          <Button onClick={() => setCompareMode(!compareMode)} variant="outline" className="text-xs h-8 border-[#bf4520]/30 text-[#bf4520]">
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5 space-y-4">
          {/* Row 1: Country + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Country</label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_KEYS.map(k => (
                    <SelectItem key={k} value={k}>
                      {COST_DATA[k].flag} {COST_DATA[k].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">City</label>
              <Select value={String(selectedCity)} onValueChange={v => setSelectedCity(Number(v))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {country.cities.map((c, i) => (
                    <SelectItem key={i} value={String(i)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Level + Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Course Level</label>
              <div className="flex gap-2">
                {COURSE_LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setCourseLevel(l)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-all',
                      courseLevel === l ? 'bg-[#bf4520] text-white border-[#bf4520]' : 'bg-[#f5f5f5] text-[#2d3142] border-[#2d3142]/5 hover:border-[#bf4520]/30'
                    )}
                  >
                    {l === 'UG' ? 'Undergrad' : l === 'PG' ? 'Postgrad' : 'PhD'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Duration: {duration} year{duration > 1 ? 's' : ''}</label>
              <Slider
                value={[duration]}
                onValueChange={v => setDuration(v[0])}
                min={1}
                max={5}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-[#2d3142]/30 mt-1">
                <span>1 yr</span><span>2</span><span>3</span><span>4</span><span>5 yrs</span>
              </div>
            </div>
          </div>

          {/* Row 3: Budget */}
          <div>
            <label className="text-xs font-medium text-[#2d3142]/60 mb-1 block">Your Budget (BDT, optional)</label>
            <Input
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g., 3000000 (30 lakh)"
              className="h-9 text-sm max-w-xs"
            />
          </div>
        </div>

        {/* University list for selected city */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-3">
            <School className="w-4 h-4 text-[#bf4520]" />
            <h3 className="text-sm font-semibold text-[#2d3142]">Universities in {city.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {city.universities.map((u, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-[#f5f5f5] text-[#2d3142]/70 border-0">{u}</Badge>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 gap-6" style={compareMode ? { gridTemplateColumns: '1fr 1fr' } : undefined}>
          <div className="bg-white rounded-lg p-5 border border-[#2d3142]/5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-[#bf4520]" />
              <h3 className="text-base font-semibold text-[#2d3142]">
                {country.flag} {country.name} — {city.name}
              </h3>
            </div>
            <CostCard title="" costs={costs} countryData={country} cityData={city} duration={duration} />
          </div>

          {compareMode && compareCountryData && compareCityData && compareCosts && (
            <div className="bg-white rounded-lg p-5 border border-[#2d3142]/5">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-[#bf4520]" />
                <h3 className="text-base font-semibold text-[#2d3142]">
                  {compareCountryData.flag} {compareCountryData.name} — {compareCityData.name}
                </h3>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <Select value={compareCountry} onValueChange={handleCompareCountryChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_KEYS.map(k => (
                      <SelectItem key={k} value={k}>
                        {COST_DATA[k].flag} {COST_DATA[k].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(compareCity)} onValueChange={v => setCompareCity(Number(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {compareCountryData.cities.map((c, i) => (
                      <SelectItem key={i} value={String(i)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CostCard title="" costs={compareCosts} countryData={compareCountryData} cityData={compareCityData} accent duration={duration} />
              <div className="mt-4 p-3 rounded-md bg-[#f5f5f5] text-center">
                <p className="text-xs text-[#2d3142]/50">Difference</p>
                <p className={cn('text-lg font-bold', costs.totalBDT > compareCosts.totalBDT ? 'text-emerald-600' : 'text-[#bf4520]')}>
                  {costs.totalBDT > compareCosts.totalBDT ? `${compareCityData.name} saves ` : `${compareCityData.name} costs more `}
                  {formatBDT(Math.abs(costs.totalBDT - compareCosts.totalBDT))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Budget Assessment */}
        {budgetNum > 0 && (
          <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-[#bf4520]" />
              <h3 className="text-base font-semibold text-[#2d3142]">Can I Afford This?</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2d3142]/70">Your Budget: {formatBDT(budgetNum)}</span>
                <span className="text-sm text-[#2d3142]/70">Total Cost: {formatBDT(costs.totalBDT)}</span>
              </div>
              <div className="w-full bg-[#f5f5f5] rounded-full h-4 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', withinBudget ? 'bg-emerald-500' : 'bg-[#bf4520]')}
                  style={{ width: `${budgetRatio}%` }}
                />
              </div>
              {withinBudget ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Yes! You have {formatBDT(budgetNum - costs.totalBDT)} remaining in your budget.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#bf4520]">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">You need {formatBDT(budgetGap)} more to cover the total cost.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scholarship Suggestions */}
        {scholarshipSuggestions.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-[#bf4520]" />
              <h3 className="text-base font-semibold text-[#2d3142]">Scholarship Suggestions</h3>
            </div>
            <p className="text-xs text-[#2d3142]/50 mb-3">Based on your budget gap of {formatBDT(budgetGap)}</p>
            <div className="space-y-2">
              {scholarshipSuggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-[#f5f5f5]">
                  <div>
                    <p className="text-sm font-medium text-[#2d3142]">{s.name}</p>
                    <p className="text-xs text-[#2d3142]/50">{s.source}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-600">{s.amount}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#bf4520] rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">Get a Personalized Cost Report</h3>
          <p className="text-sm opacity-90 mb-4">Our counselors can create a detailed budget plan tailored to your exact situation.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onLeadOpen} className="bg-white text-[#bf4520] hover:bg-white/90">
              Free Consultation
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
