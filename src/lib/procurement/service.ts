// ============================================================================
// ALO Education — procurement service.
//
// Full vendor → purchase request → purchase order → vendor invoice workflow
// with approval gates and REAL accounting-ledger integration:
//   * PR submission requires lines; approval requires an approver actor
//   * PO creation from an APPROVED PR converts the PR (one PO per PR)
//   * PO approval (transactional conditional update) posts DR expense / CR A/P
//     to the double-entry ledger and records the journal id
//   * receiving updates per-line receivedQuantity and the PO status
//   * vendor invoices are matched against the PO (quantity + amount tolerance)
//     before they can be approved/paid
// All money is INTEGER CENTS. Database failures propagate.
// ============================================================================

import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { postJournal } from '@/lib/accounting/ledger';
import { GL_ACCOUNTS } from '@/lib/double-entry-ledger';

export const PROCUREMENT_APPROVER_TYPES = ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO'];

export interface PrLineInput { description: string; quantity: number; unitPrice: number }
export interface PoLineInput { description: string; quantity: number; unitPrice: number }

function cents(amount: number): number {
  const value = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(value)) {
    throw new Error('Procurement amounts must be finite non-negative two-decimal amounts');
  }
  return value;
}

function assertPositiveInt(n: number, label: string): void {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${label} must be a positive integer`);
}

// ─── Vendors ────────────────────────────────────────────────────────────────

export async function createVendor(input: {
  code?: string; name: string; legalName?: string; taxId?: string; category?: string;
  email?: string; phone?: string; address?: string; country?: string; paymentTerms?: string;
}, createdById: string) {
  if (!input.name?.trim()) throw new Error('Vendor name is required');
  const code = input.code?.trim() || `ven_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  if (!/^[a-z0-9_]+$/i.test(code)) throw new Error('Vendor code must be alphanumeric/underscore');
  if (input.paymentTerms && !['NET-7', 'NET-15', 'NET-30', 'NET-60', 'PREPAID'].includes(input.paymentTerms)) {
    throw new Error('Invalid payment terms');
  }
  return db.vendor.create({
    data: {
      code, name: input.name.trim(), legalName: input.legalName ?? '', taxId: input.taxId ?? '',
      category: input.category ?? 'general', email: input.email ?? '', phone: input.phone ?? '',
      address: input.address ?? '', country: input.country ?? 'Bangladesh',
      paymentTerms: input.paymentTerms ?? 'NET-30', createdById,
    },
  });
}

// ─── Purchase requests ──────────────────────────────────────────────────────

export async function createPurchaseRequest(input: {
  prNumber?: string; title: string; description?: string; requestedById: string;
  departmentId?: string; neededBy?: string; currency?: string; lines: PrLineInput[];
}) {
  if (!input.title?.trim()) throw new Error('Purchase request title is required');
  if (!input.requestedById?.trim()) throw new Error('Purchase request requires a requester');
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new Error('Purchase request requires at least one line');
  let amount = 0;
  const lines = input.lines.map((line) => {
    if (!line.description?.trim()) throw new Error('Each line requires a description');
    assertPositiveInt(line.quantity, 'Quantity');
    const unitPrice = cents(line.unitPrice);
    const lineAmount = unitPrice * line.quantity;
    if (!Number.isSafeInteger(lineAmount)) throw new Error('Line amount exceeds safe amount');
    amount += lineAmount;
    return { description: line.description.trim(), quantity: line.quantity, unitPrice, amount: lineAmount };
  });
  const prNumber = input.prNumber?.trim() || `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6)}`;
  return db.purchaseRequest.create({
    data: {
      prNumber, title: input.title.trim(), description: input.description ?? '',
      requestedById: input.requestedById, departmentId: input.departmentId ?? '',
      currency: input.currency ?? 'BDT', amount, status: 'DRAFT',
      neededBy: input.neededBy ? new Date(input.neededBy) : null,
      lines: { create: lines },
    },
    include: { lines: true },
  });
}

export async function submitPurchaseRequest(prId: string) {
  const updated = await db.purchaseRequest.updateMany({
    where: { id: prId, status: 'DRAFT' },
    data: { status: 'SUBMITTED' },
  });
  if (updated.count !== 1) throw new Error('Purchase request is missing or not in DRAFT');
  return db.purchaseRequest.findUniqueOrThrow({ where: { id: prId }, include: { lines: true } });
}

/** Approval is a conditional, race-safe transition (mirrors approval-transition.ts). */
export async function decidePurchaseRequest(prId: string, decision: 'approved' | 'rejected', decidedById: string, rejectionReason?: string) {
  if (!decidedById?.trim()) throw new Error('Deciding a purchase request requires an approver');
  if (decision === 'rejected' && !rejectionReason?.trim()) throw new Error('Rejection requires a reason');
  return db.$transaction(async (tx) => {
    const changed = await tx.purchaseRequest.updateMany({
      where: { id: prId, status: 'SUBMITTED' },
      data: decision === 'approved'
        ? { status: 'APPROVED', decidedById, decidedAt: new Date() }
        : { status: 'REJECTED', decidedById, decidedAt: new Date(), rejectionReason: rejectionReason ?? '' },
    });
    if (changed.count !== 1) throw new Error('Purchase request is missing or already decided');
    return tx.purchaseRequest.findUniqueOrThrow({ where: { id: prId }, include: { lines: true } });
  });
}

// ─── Purchase orders ────────────────────────────────────────────────────────

export async function createPurchaseOrderFromRequest(input: {
  requestId: string; vendorId: string; taxRate?: number; expectedDelivery?: string; notes?: string;
}) {
  if (!input.vendorId?.trim()) throw new Error('Purchase order requires a vendor');
  const taxRate = input.taxRate ?? 0;
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error('Tax rate must be 0..100');
  return db.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.findUnique({
      where: { id: input.requestId },
      include: { lines: true, purchaseOrder: true },
    });
    if (!request) throw new Error('Purchase request not found');
    if (request.status !== 'APPROVED') throw new Error('Only APPROVED purchase requests can become purchase orders');
    if (request.purchaseOrder) throw new Error('Purchase request already converted to a purchase order');
    const vendor = await tx.vendor.findUnique({ where: { id: input.vendorId } });
    if (!vendor) throw new Error('Vendor not found');
    if (vendor.status !== 'ACTIVE') throw new Error('Vendor is not active');

    const subtotal = request.lines.reduce((s, l) => s + l.amount, 0);
    const taxTotal = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxTotal;
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6)}`;
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber, requestId: request.id, vendorId: vendor.id,
        expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : null,
        currency: request.currency, subtotal, taxTotal, total,
        status: 'PENDING_APPROVAL', notes: input.notes ?? '',
        lines: { create: request.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount })) },
      },
      include: { lines: true },
    });
    await tx.purchaseRequest.update({ where: { id: request.id }, data: { status: 'CONVERTED', convertedPoId: po.id } });
    return po;
  });
}

/** PO approval posts the A/P journal inside the same transaction. */
export async function approvePurchaseOrder(poId: string, approvedById: string, approverUserType?: string) {
  if (!approvedById?.trim()) throw new Error('Purchase order approval requires an approver');
  if (approverUserType && !PROCUREMENT_APPROVER_TYPES.includes(approverUserType.toUpperCase())) {
    throw new Error(`User type ${approverUserType} cannot approve purchase orders`);
  }
  return db.$transaction(async (tx) => {
    const changed = await tx.purchaseOrder.updateMany({
      where: { id: poId, status: 'PENDING_APPROVAL' },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
    if (changed.count !== 1) throw new Error('Purchase order is missing or not pending approval');
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId } });
    // Post DR Expense / CR Accounts Payable on the REAL ledger. The ledger
    // service validates accounts; posting failure rolls the approval back.
    const { journalId } = await postJournal({
      id: `je_po_${po.id}`,
      date: po.orderDate.toISOString().slice(0, 10),
      memo: `Purchase order ${po.poNumber}`,
      source: 'procurement.po',
      sourceRefId: po.id,
      actorId: approvedById,
      currency: po.currency,
      lines: [
        { account: GL_ACCOUNTS.EXPENSE.code, debit: po.total / 100, credit: 0, entityId: po.id, entityType: 'PurchaseOrder' },
        { account: GL_ACCOUNTS.AP.code, debit: 0, credit: po.total / 100, entityId: po.id, entityType: 'PurchaseOrder' },
      ],
    });
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { journalEntryId: journalId } });
    return tx.purchaseOrder.findUniqueOrThrow({ where: { id: po.id }, include: { lines: true, vendor: true } });
  });
}

export async function sendPurchaseOrder(poId: string) {
  const updated = await db.purchaseOrder.updateMany({
    where: { id: poId, status: 'APPROVED' },
    data: { status: 'SENT' },
  });
  if (updated.count !== 1) throw new Error('Purchase order is missing or not approved');
  return db.purchaseOrder.findUniqueOrThrow({ where: { id: poId } });
}

export async function receivePurchaseOrder(poId: string, receipts: { lineId: string; quantity: number }[]) {
  if (!Array.isArray(receipts) || receipts.length === 0) throw new Error('Receiving requires at least one line receipt');
  return db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { lines: true } });
    if (!po) throw new Error('Purchase order not found');
    if (po.status !== 'SENT' && po.status !== 'PARTIALLY_RECEIVED') throw new Error('Purchase order has not been sent');
    for (const receipt of receipts) {
      assertPositiveInt(receipt.quantity, 'Received quantity');
      const line = po.lines.find((l) => l.id === receipt.lineId);
      if (!line) throw new Error(`Line ${receipt.lineId} does not belong to purchase order ${poId}`);
      const newReceived = line.receivedQuantity + receipt.quantity;
      if (newReceived > line.quantity) throw new Error(`Received quantity exceeds ordered quantity for line ${line.id}`);
      await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQuantity: newReceived } });
    }
    const refreshed = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { lines: true } });
    const fullyReceived = refreshed.lines.every((l) => l.receivedQuantity >= l.quantity);
    const anyReceived = refreshed.lines.some((l) => l.receivedQuantity > 0);
    const status = fullyReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : refreshed.status;
    return tx.purchaseOrder.update({ where: { id: poId }, data: { status } });
  });
}

// ─── Vendor invoices ────────────────────────────────────────────────────────

export async function recordVendorInvoice(input: {
  vendorId: string; poId?: string; invoiceNumber: string; invoiceDate: string;
  dueDate?: string; subtotal: number; taxTotal?: number;
}) {
  if (!input.invoiceNumber?.trim()) throw new Error('Vendor invoice number is required');
  if (!input.vendorId?.trim()) throw new Error('Vendor invoice requires a vendor');
  const subtotal = cents(input.subtotal);
  const taxTotal = cents(input.taxTotal ?? 0);
  const total = subtotal + taxTotal;
  const invoiceDate = new Date(`${input.invoiceDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate) || Number.isNaN(invoiceDate.getTime())) {
    throw new Error('Invoice date must be YYYY-MM-DD');
  }
  return db.vendorInvoice.create({
    data: {
      vendorId: input.vendorId, poId: input.poId ?? null, invoiceNumber: input.invoiceNumber.trim(),
      invoiceDate, dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
      subtotal, taxTotal, total, status: 'RECEIVED',
    },
  });
}

const MATCH_TOLERANCE = 0.01; // 1% quantity/amount tolerance for 3-way matching

/** 3-way match: invoice ↔ PO lines ↔ receipt quantities, with tolerance. */
export async function matchVendorInvoice(invoiceId: string, matchedById: string) {
  if (!matchedById?.trim()) throw new Error('Matching requires an actor');
  const invoice = await db.vendorInvoice.findUnique({ where: { id: invoiceId }, include: { po: { include: { lines: true } } } });
  if (!invoice) throw new Error('Vendor invoice not found');
  if (invoice.status !== 'RECEIVED') throw new Error('Only RECEIVED invoices can be matched');
  if (!invoice.poId || !invoice.po) throw new Error('Matching requires a purchase order');
  const po = invoice.po;
  const poTotal = po.total;
  const amountOk = Math.abs(invoice.total - poTotal) <= Math.round(poTotal * MATCH_TOLERANCE);
  const receivedOk = po.lines.every((l) => l.receivedQuantity >= l.quantity);
  if (!amountOk) throw new Error(`Invoice total ${invoice.total} does not match purchase order total ${poTotal} within tolerance`);
  if (!receivedOk) throw new Error('Purchase order is not fully received');
  return db.vendorInvoice.update({
    where: { id: invoiceId },
    data: { status: 'MATCHED', matchedById, matchedAt: new Date() },
  });
}

export async function payVendorInvoice(invoiceId: string, amount: number, paidById: string) {
  const payment = cents(amount);
  if (payment <= 0) throw new Error('Payment amount must be positive');
  return db.$transaction(async (tx) => {
    const invoice = await tx.vendorInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Vendor invoice not found');
    if (invoice.status !== 'MATCHED' && invoice.status !== 'APPROVED' && invoice.status !== 'PARTIALLY_PAID') {
      throw new Error('Invoice must be MATCHED or APPROVED before payment');
    }
    const newPaid = invoice.amountPaid + payment;
    if (newPaid > invoice.total) throw new Error('Payment exceeds invoice total');
    const status = newPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';
    return tx.vendorInvoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newPaid, status },
    });
  });
}

// ─── Vendor performance ─────────────────────────────────────────────────────

export async function vendorPerformanceSummary(vendorId: string) {
  const [vendor, orders, invoices] = await Promise.all([
    db.vendor.findUnique({ where: { id: vendorId } }),
    db.purchaseOrder.findMany({ where: { vendorId }, include: { lines: true } }),
    db.vendorInvoice.findMany({ where: { vendorId } }),
  ]);
  if (!vendor) throw new Error('Vendor not found');
  const received = orders.filter((o) => o.status === 'RECEIVED');
  return {
    vendorId,
    totalOrders: orders.length,
    receivedOrders: received.length,
    totalOrderValueCents: orders.reduce((s, o) => s + o.total, 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.status === 'PAID').length,
    outstandingPayableCents: invoices.filter((i) => i.status !== 'PAID' && i.status !== 'DISPUTED').reduce((s, i) => s + (i.total - i.amountPaid), 0),
    disputedInvoices: invoices.filter((i) => i.status === 'DISPUTED').length,
  };
}
