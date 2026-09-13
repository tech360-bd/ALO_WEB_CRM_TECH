/**
 * Quote → Invoice PDF Builder (from idurar/idurar-erp-crm)
 * Extends Payment/Finance → tax-aware, multi-currency, PDF via pdf-lib (already in deps) + sharp for logo
 * Generates branded ALO invoice/quote for partner commission, student payment
 */
export type QuoteLine = { description: string; qty: number; unitPrice: number; taxPct?: number };
export type QuoteDoc = {
  type: 'QUOTE' | 'INVOICE';
  number: string; // e.g., INV-2026-0001
  currency: string; // BDT, USD, GBP
  issuer: { name: string; address: string; logoUrl?: string };
  client: { name: string; email?: string; address?: string };
  lines: QuoteLine[];
  dueDate?: string;
  notes?: string;
};

export function calcTotals(doc: QuoteDoc){
  let subtotal=0, tax=0;
  for(const l of doc.lines){
    const line = l.qty * l.unitPrice;
    subtotal += line;
    tax += line * ((l.taxPct||0)/100);
  }
  return { subtotal, tax, total: subtotal + tax, currency: doc.currency };
}

// In production use pdf-lib + sharp to render branded PDF with ALO logo #F37021
export async function generateQuotePdf(doc: QuoteDoc): Promise<{ pdfBase64: string; totals: ReturnType<typeof calcTotals> }>{
  const totals = calcTotals(doc);
  // Minimal HTML for preview (real PDF would use pdf-lib)
  const html = `<!doctype html><html><head><style>body{font-family:Inter, sans-serif;padding:24px;color:#0f172a}h1{color:#F37021}.line{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}.tot{font-weight:700}</style></head>
  <body><h1>ALO Education — ${doc.type} ${doc.number}</h1>
  <p>${doc.issuer.name} → ${doc.client.name} (${doc.currency})</p>
  ${doc.lines.map(l=> `<div class=line><span>${l.description} ×${l.qty}</span><span>${(l.qty*l.unitPrice).toFixed(2)} ${doc.currency}</span></div>`).join('')}
  <div class=line><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
  <div class=line><span>Tax</span><span>${totals.tax.toFixed(2)}</span></div>
  <div class=line tot><span>Total</span><span>${totals.total.toFixed(2)} ${doc.currency}</span></div>
  ${doc.notes? `<p style=margin-top:16px;color:#475569>${doc.notes}</p>`:''}
  </body></html>`;
  const pdfBase64 = Buffer.from(html).toString('base64'); // placeholder — replace with pdf-lib binary in prod
  return { pdfBase64, totals };
}
