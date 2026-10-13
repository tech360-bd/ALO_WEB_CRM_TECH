import { NextRequest, NextResponse } from 'next/server';

// Loan data for Bangladeshi banks
const BANK_LOANS = [
  {
    bank: 'Dutch-Bangla Bank (DBBL)',
    interestRate: 9.5,
    maxAmount: 20000000,
    maxTenure: 10,
    processingFee: 0.5,
    collateral: 'Property mortgage or FDR',
    specialFeatures: ['Lowest interest rate', 'Quick disbursement', 'No hidden charges', 'Online tracking'],
  },
  {
    bank: 'BRAC Bank',
    interestRate: 10.0,
    maxAmount: 15000000,
    maxTenure: 8,
    processingFee: 1.0,
    collateral: 'Property mortgage or guarantor',
    specialFeatures: ['Fast approval (7-14 days)', 'Flexible repayment', 'Student-friendly terms', 'Branch network'],
  },
  {
    bank: 'City Bank',
    interestRate: 10.5,
    maxAmount: 15000000,
    maxTenure: 7,
    processingFee: 1.0,
    collateral: 'Property mortgage',
    specialFeatures: ['American Express partnership', 'Competitive rates', 'Good for USA-bound students', 'Online banking'],
  },
  {
    bank: 'Prime Bank',
    interestRate: 10.0,
    maxAmount: 10000000,
    maxTenure: 7,
    processingFee: 0.75,
    collateral: 'FDR or property mortgage',
    specialFeatures: ['Stable interest rates', 'Partial early repayment allowed', 'Good for UK/Germany', 'Dedicated education desk'],
  },
  {
    bank: 'Eastern Bank (EBL)',
    interestRate: 10.5,
    maxAmount: 12000000,
    maxTenure: 8,
    processingFee: 1.0,
    collateral: 'Property or FDR guarantee',
    specialFeatures: ['Premium banking service', 'Quick processing', 'Multiple disbursement option', 'Insurance coverage'],
  },
  {
    bank: 'Mutual Trust Bank (MTB)',
    interestRate: 11.0,
    maxAmount: 10000000,
    maxTenure: 7,
    processingFee: 1.0,
    collateral: 'Property mortgage or guarantor',
    specialFeatures: ['Flexible collateral options', 'Women entrepreneur friendly', 'Grace period available', 'SME education loan'],
  },
];

// EMI calculation
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

// GET — Returns all bank loan data
export async function GET() {
  return NextResponse.json({
    success: true,
    banks: BANK_LOANS,
  });
}

// POST — Calculate EMI for a specific loan scenario
export async function POST(req: NextRequest) {
  try {
    const { principal, tenure } = await req.json();

    if (!principal || principal <= 0) {
      return NextResponse.json({ success: false, error: 'Valid principal amount required' }, { status: 400 });
    }

    if (!tenure || tenure <= 0) {
      return NextResponse.json({ success: false, error: 'Valid tenure required' }, { status: 400 });
    }

    // Calculate EMI for each bank
    const results = BANK_LOANS.map(loan => {
      const effectiveTenure = Math.min(tenure, loan.maxTenure);
      const eligible = principal <= loan.maxAmount;
      const emiResult = eligible ? calculateEMI(principal, loan.interestRate, effectiveTenure) : null;
      const processingFee = principal * loan.processingFee / 100;

      return {
        ...loan,
        effectiveTenure,
        eligible,
        emi: emiResult?.emi || 0,
        totalPayment: emiResult?.totalPayment || 0,
        totalInterest: emiResult?.totalInterest || 0,
        processingFeeAmount: processingFee,
      };
    });

    // Sort eligible banks by EMI (lowest first)
    const bestMatch = results
      .filter(r => r.eligible)
      .sort((a, b) => a.emi - b.emi)[0] || null;

    return NextResponse.json({
      success: true,
      principal,
      tenure,
      results,
      bestMatch,
    });
  } catch (error: any) {
    console.error('Loan comparison error:', error);
    return NextResponse.json({ success: false, error: 'Calculation failed' }, { status: 500 });
  }
}
