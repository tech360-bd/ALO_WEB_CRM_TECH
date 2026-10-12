/**
 * In-memory stand-in for the Prisma delegates used by catalogue review/apply.
 * It is NOT MySQL: it models only equality / `in` filters, createdAt ordering
 * and all-or-nothing `$transaction` (snapshot + commit/discard). It exists so
 * transaction, stale and idempotency logic can be exercised without a
 * database. MySQL behaviour (isolation, locking) is not proven by it.
 */
type Row = Record<string, any>;
export type Tables = {
  universityUpdateRequest: Row[];
  portalAuditLog: Row[];
  crmUniversity: Row[];
  crmCourse: Row[];
  crmCourseIntakeFee: Row[];
  crmCourseRequirement: Row[];
};
export type Hook = (op: { table: keyof Tables; method: string; args: any; inTx: boolean }) => void;

function matches(row: Row, where: Record<string, any> = {}): boolean {
  return Object.entries(where).every(([k, cond]) => {
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && 'in' in cond) return (cond.in as unknown[]).includes(row[k]);
    return row[k] === cond;
  });
}

let seq = 0;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function createFakeCatalogDb(initial: Partial<Tables> = {}) {
  let state: Tables = {
    universityUpdateRequest: [], portalAuditLog: [], crmUniversity: [], crmCourse: [], crmCourseIntakeFee: [], crmCourseRequirement: [],
    ...clone(initial),
  };
  const hooks: Hook[] = [];
  let txCount = 0;

  function delegates(get: () => Tables, inTx: boolean) {
    const make = (table: keyof Tables) => ({
      async findMany(args: any = {}) {
        hooks.forEach((h) => h({ table, method: 'findMany', args, inTx }));
        let rows = get()[table].filter((r) => matches(r, args.where));
        if (args.orderBy?.createdAt === 'desc') rows = [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
        if (args.take) rows = rows.slice(0, args.take);
        return clone(rows);
      },
      async findUnique(args: any) {
        hooks.forEach((h) => h({ table, method: 'findUnique', args, inTx }));
        const r = get()[table].find((x) => matches(x, args.where));
        return r ? clone(r) : null;
      },
      async updateMany(args: any) {
        hooks.forEach((h) => h({ table, method: 'updateMany', args, inTx }));
        let count = 0;
        for (const r of get()[table]) if (matches(r, args.where)) { Object.assign(r, clone(args.data), { updatedAt: new Date().toISOString() }); count++; }
        return { count };
      },
      async create(args: any) {
        hooks.forEach((h) => h({ table, method: 'create', args, inTx }));
        const row = { id: `${table}-${++seq}`, createdAt: new Date(Date.now() + seq).toISOString(), ...clone(args.data) };
        get()[table].push(row);
        return clone(row);
      },
    });
    return {
      universityUpdateRequest: make('universityUpdateRequest'),
      portalAuditLog: make('portalAuditLog'),
      crmUniversity: make('crmUniversity'),
      crmCourse: make('crmCourse'),
      crmCourseIntakeFee: make('crmCourseIntakeFee'),
      crmCourseRequirement: make('crmCourseRequirement'),
    };
  }

  const client: any = {
    ...delegates(() => state, false),
    async $transaction(fn: (tx: any) => Promise<unknown>) {
      txCount++;
      const draft = clone(state);
      const result = await fn(delegates(() => draft, true));
      state = draft; // commit only if fn resolved
      return result;
    },
  };

  return {
    client,
    get state() { return state; },
    set(next: Partial<Tables>) { state = { ...state, ...clone(next) }; },
    onOperation(h: Hook) { hooks.push(h); },
    get transactions() { return txCount; },
  };
}
