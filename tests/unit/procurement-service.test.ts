// Procurement workflow contracts (src/lib/procurement/service.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    vendor: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    purchaseRequest: { create: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    purchaseOrder: { create: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn() },
    purchaseOrderLine: { update: vi.fn() },
    vendorInvoice: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
// The ledger posts through the real service; mock the module boundary so these
// tests exercise procurement logic, not accounting (covered separately).
vi.mock('@/lib/accounting/ledger', () => ({
  postJournal: vi.fn().mockResolvedValue({ journalId: 'je_test' }),
}));
import { db } from '@/lib/db';
import {
  createVendor,
  createPurchaseRequest,
  submitPurchaseRequest,
  decidePurchaseRequest,
  createPurchaseOrderFromRequest,
  approvePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  recordVendorInvoice,
  matchVendorInvoice,
  payVendorInvoice,
} from '@/lib/procurement/service';

const REQUEST = {
  id: 'pr1', prNumber: 'PR-1', title: 'Laptops', status: 'SUBMITTED', amount: 500000,
  currency: 'BDT', requestedById: 'emp1',
  lines: [
    { id: 'l1', description: 'MacBook', quantity: 2, unitPrice: 125000, amount: 250000 },
    { id: 'l2', description: 'Dock', quantity: 5, unitPrice: 50000, amount: 250000 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('vendors', () => {
  it('creates a vendor with normalized fields', async () => {
    vi.mocked(db.vendor.create).mockResolvedValue({ id: 'v1' } as never);
    await createVendor({ name: 'TechBD', paymentTerms: 'NET-15' }, 'admin');
    expect(db.vendor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'TechBD', paymentTerms: 'NET-15', category: 'general',
        code: expect.stringMatching(/^ven_[a-f0-9]{12}$/),
      }),
    });
  });
  it('rejects invalid payment terms and missing names', async () => {
    await expect(createVendor({ name: 'X', paymentTerms: 'NET-999' }, 'a')).rejects.toThrow(/payment terms/);
    await expect(createVendor({ name: '  ' }, 'a')).rejects.toThrow(/name/);
  });
});

describe('purchase requests', () => {
  it('computes the request amount from lines in cents', async () => {
    vi.mocked(db.purchaseRequest.create).mockResolvedValue({ id: 'pr1' } as never);
    await createPurchaseRequest({
      title: 'Laptops', requestedById: 'emp1',
      lines: [{ description: 'MacBook', quantity: 2, unitPrice: 1250.50 }],
    });
    const arg = vi.mocked(db.purchaseRequest.create).mock.calls[0][0];
    expect(arg.data.amount).toBe(250100); // 2 × 125050 cents
    expect(arg.data.lines.create[0]).toMatchObject({ quantity: 2, unitPrice: 125050, amount: 250100 });
  });

  it('rejects empty lines, bad quantities and invalid amounts', async () => {
    await expect(createPurchaseRequest({ title: 'X', requestedById: 'e', lines: [] })).rejects.toThrow(/at least one line/);
    await expect(createPurchaseRequest({ title: 'X', requestedById: 'e', lines: [{ description: 'd', quantity: 0, unitPrice: 10 }] })).rejects.toThrow(/Quantity/);
    await expect(createPurchaseRequest({ title: 'X', requestedById: 'e', lines: [{ description: 'd', quantity: 1, unitPrice: -5 }] })).rejects.toThrow(/amounts/);
    await expect(createPurchaseRequest({ title: 'X', requestedById: 'e', lines: [{ description: 'd', quantity: 1, unitPrice: NaN }] })).rejects.toThrow();
  });

  it('submission is a conditional DRAFT→SUBMITTED transition', async () => {
    vi.mocked(db.purchaseRequest.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(db.purchaseRequest.findUniqueOrThrow).mockResolvedValue({ id: 'pr1', status: 'SUBMITTED' } as never);
    await submitPurchaseRequest('pr1');
    expect(db.purchaseRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'pr1', status: 'DRAFT' }, data: { status: 'SUBMITTED' },
    });
    vi.mocked(db.purchaseRequest.updateMany).mockResolvedValue({ count: 0 } as never);
    await expect(submitPurchaseRequest('pr1')).rejects.toThrow(/missing or not in DRAFT/);
  });

  it('approval is race-safe and rejection requires a reason', async () => {
    const tx = {
      purchaseRequest: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'pr1', status: 'APPROVED' }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await decidePurchaseRequest('pr1', 'approved', 'mgr');
    expect(tx.purchaseRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'pr1', status: 'SUBMITTED' },
      data: expect.objectContaining({ status: 'APPROVED', decidedById: 'mgr' }),
    });
    await expect(decidePurchaseRequest('pr1', 'rejected', 'mgr')).rejects.toThrow(/reason/);
    tx.purchaseRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(decidePurchaseRequest('pr1', 'approved', 'mgr')).rejects.toThrow(/already decided/);
  });
});

describe('purchase orders', () => {
  it('creates a PO from an APPROVED request and converts the request', async () => {
    const tx = {
      purchaseRequest: { findUnique: vi.fn().mockResolvedValue({ ...REQUEST, status: 'APPROVED', purchaseOrder: null }), update: vi.fn() },
      vendor: { findUnique: vi.fn().mockResolvedValue({ id: 'v1', status: 'ACTIVE' }) },
      purchaseOrder: { create: vi.fn().mockResolvedValue({ id: 'po1', poNumber: 'PO-1' }) },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    const po = await createPurchaseOrderFromRequest({ requestId: 'pr1', vendorId: 'v1', taxRate: 10 });
    expect(po.id).toBe('po1');
    const arg = tx.purchaseOrder.create.mock.calls[0][0];
    expect(arg.data.subtotal).toBe(500000);
    expect(arg.data.taxTotal).toBe(50000);
    expect(arg.data.total).toBe(550000);
    expect(arg.data.status).toBe('PENDING_APPROVAL');
    expect(tx.purchaseRequest.update).toHaveBeenCalledWith({
      where: { id: 'pr1' }, data: { status: 'CONVERTED', convertedPoId: 'po1' },
    });
  });

  it('refuses to convert non-approved or already-converted requests', async () => {
    const tx = {
      purchaseRequest: { findUnique: vi.fn().mockResolvedValue({ ...REQUEST, status: 'SUBMITTED', purchaseOrder: null }), update: vi.fn() },
      vendor: { findUnique: vi.fn() },
      purchaseOrder: { create: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(createPurchaseOrderFromRequest({ requestId: 'pr1', vendorId: 'v1' })).rejects.toThrow(/Only APPROVED/);
    tx.purchaseRequest.findUnique.mockResolvedValue({ ...REQUEST, status: 'APPROVED', purchaseOrder: { id: 'existing' } });
    await expect(createPurchaseOrderFromRequest({ requestId: 'pr1', vendorId: 'v1' })).rejects.toThrow(/already converted/);
  });

  it('approval posts DR Expense / CR A/P to the real ledger in the transaction', async () => {
    const { postJournal } = await import('@/lib/accounting/ledger');
    const tx = {
      purchaseOrder: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn()
          .mockResolvedValueOnce({ id: 'po1', poNumber: 'PO-1', orderDate: new Date('2026-10-01T00:00:00Z'), total: 550000, currency: 'BDT' })
          .mockResolvedValueOnce({ id: 'po1', status: 'APPROVED' }),
        update: vi.fn(),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await approvePurchaseOrder('po1', 'fin', 'FINANCE');
    expect(postJournal).toHaveBeenCalledWith(expect.objectContaining({
      id: 'je_po_po1',
      source: 'procurement.po',
      sourceRefId: 'po1',
      lines: [
        expect.objectContaining({ account: '5000', debit: 5500 }),
        expect.objectContaining({ account: '2000', credit: 5500 }),
      ],
    }));
    expect(tx.purchaseOrder.update).toHaveBeenCalledWith({ where: { id: 'po1' }, data: { journalEntryId: 'je_test' } });
  });

  it('unauthorized user types cannot approve', async () => {
    await expect(approvePurchaseOrder('po1', 'x', 'STUDENT')).rejects.toThrow(/cannot approve/);
  });

  it('receiving caps at ordered quantity and computes status', async () => {
    const tx = {
      purchaseOrder: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'po1', lines: [{ id: 'l1', quantity: 5, receivedQuantity: 5 }] }),
        update: vi.fn().mockResolvedValue({ id: 'po1', status: 'RECEIVED' }),
      },
      purchaseOrderLine: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    tx.purchaseOrder.findUnique.mockResolvedValueOnce({ id: 'po1', status: 'SENT', lines: [{ id: 'l1', quantity: 5, receivedQuantity: 0 }] });
    await receivePurchaseOrder('po1', [{ lineId: 'l1', quantity: 5 }]);
    expect(tx.purchaseOrder.update).toHaveBeenCalledWith({ where: { id: 'po1' }, data: { status: 'RECEIVED' } });
    // Over-receipt is rejected before any line update.
    tx.purchaseOrder.findUnique.mockResolvedValueOnce({ id: 'po1', status: 'SENT', lines: [{ id: 'l1', quantity: 5, receivedQuantity: 0 }] });
    await expect(receivePurchaseOrder('po1', [{ lineId: 'l1', quantity: 6 }])).rejects.toThrow(/exceeds ordered/);
    expect(tx.purchaseOrderLine.update).toHaveBeenCalledTimes(1);
  });
});

describe('vendor invoices', () => {
  it('records an invoice with cents totals', async () => {
    vi.mocked(db.vendorInvoice.create).mockResolvedValue({ id: 'vi1' } as never);
    await recordVendorInvoice({ vendorId: 'v1', invoiceNumber: 'INV-9', invoiceDate: '2026-10-01', subtotal: 1000.25, taxTotal: 100.03 });
    expect(db.vendorInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ subtotal: 100025, taxTotal: 10003, total: 110028, status: 'RECEIVED' }),
    });
  });

  it('3-way match enforces amount and receipt completeness', async () => {
    vi.mocked(db.vendorInvoice.findUnique).mockResolvedValue({
      id: 'vi1', status: 'RECEIVED', total: 550000, poId: 'po1',
      po: { id: 'po1', total: 550000, lines: [{ id: 'l1', quantity: 5, receivedQuantity: 5 }] },
    } as never);
    vi.mocked(db.vendorInvoice.update).mockResolvedValue({ id: 'vi1', status: 'MATCHED' } as never);
    await matchVendorInvoice('vi1', 'fin');
    expect(db.vendorInvoice.update).toHaveBeenCalledWith({
      where: { id: 'vi1' }, data: expect.objectContaining({ status: 'MATCHED', matchedById: 'fin' }),
    });
    // not fully received
    vi.mocked(db.vendorInvoice.findUnique).mockResolvedValue({
      id: 'vi1', status: 'RECEIVED', total: 550000, poId: 'po1',
      po: { id: 'po1', total: 550000, lines: [{ id: 'l1', quantity: 5, receivedQuantity: 3 }] },
    } as never);
    await expect(matchVendorInvoice('vi1', 'fin')).rejects.toThrow(/not fully received/);
    // amount out of tolerance (>1%)
    vi.mocked(db.vendorInvoice.findUnique).mockResolvedValue({
      id: 'vi1', status: 'RECEIVED', total: 560000, poId: 'po1',
      po: { id: 'po1', total: 550000, lines: [{ id: 'l1', quantity: 5, receivedQuantity: 5 }] },
    } as never);
    await expect(matchVendorInvoice('vi1', 'fin')).rejects.toThrow(/does not match/);
  });

  it('payment cannot exceed the invoice total', async () => {
    const tx = {
      vendorInvoice: {
        findUnique: vi.fn().mockResolvedValue({ id: 'vi1', status: 'MATCHED', total: 110028, amountPaid: 0 }),
        update: vi.fn().mockResolvedValue({ id: 'vi1', status: 'PAID' }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await payVendorInvoice('vi1', 1100.28, 'fin');
    expect(tx.vendorInvoice.update).toHaveBeenCalledWith({
      where: { id: 'vi1' }, data: { amountPaid: 110028, status: 'PAID' },
    });
    await expect(payVendorInvoice('vi1', 9999, 'fin')).rejects.toThrow(/exceeds invoice total/);
  });
});
