import { z } from 'zod';

const paymentSchema = z.object({
  id: z.string().min(1), description: z.string(), amount: z.number().finite(),
  currency: z.string().regex(/^[A-Z]{3}$/), status: z.string().min(1),
  createdAt: z.string().datetime(), paidAt: z.string().datetime().nullable(),
});
const pageSchema = z.object({
  success: z.literal(true), data: z.array(paymentSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), totalPages: z.number().int().nonnegative(),
});
export type StudentPayment = z.infer<typeof paymentSchema>;
export async function loadPaymentHistory(token: string | null, page: number, signal?: AbortSignal) {
  const response = await fetch(`/api/student-portal/payments?page=${page}&limit=20`, {
    credentials: 'same-origin', headers: token ? { Authorization: `Bearer ${token}` } : {}, signal,
  });
  if (!response.ok) throw new Error('Payment history is unavailable. Please try again.');
  const parsed = pageSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('Payment history could not be read. Please try again.');
  return parsed.data;
}
export function paymentAmount(payment: Pick<StudentPayment, 'amount' | 'currency'>) {
  // Explicit currency: never display a GBP or USD amount as BDT.
  return `${payment.currency} ${payment.amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
}
