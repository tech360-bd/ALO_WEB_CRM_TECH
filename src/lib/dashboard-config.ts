// Typed KPI contract — each card driven by real DB/table query, RBAC checked in service
// sourceEntity points to actual Prisma model/table, calculation describes logic, drillDown routes to existing pages

export type KPIFilter = { key: string; label: string; options: string[] };

export type DashboardKpiConfig = {
  id: string;
  label: string;
  sourceEntity: string; // e.g., Lead, StudentApplication, Task, Payment, UniversityCourse
  calculation: string; // prisma aggregation description for auditing (not a generic string)
  filters: string[]; // branchId, assignedToId, dateRange, stage, priority
  timezone: 'Asia/Dhaka';
  refresh: 'realtime' | '5m' | 'hourly' | 'daily';
  drillDown: { view: string; href?: string; queryKey: string } | null;
  permission: string[]; // roles/scopes required; server must re-check
  format: 'number' | 'currency' | 'percent';
};

export const dashboardConfigs: Record<string, DashboardKpiConfig[]> = {
  counselor: [
    { id:'leads-assigned', label:'Assigned Leads', sourceEntity:'Lead', calculation:'count Lead where assignedToId=currentUser AND createdAt within filter range', filters:['branchId','dateRange'], timezone:'Asia/Dhaka', refresh:'realtime', drillDown:{ view:'employee-leads', queryKey:'assignedToId' }, permission:['COUNSELOR','SENIOR_COUNSELOR'], format:'number'},
    { id:'followups-due-today', label:'Follow-ups Due Today', sourceEntity:'Task', calculation:'count Task where assignedToId=currentUser AND dueAt between todayDhaka(00:00,23:59) AND status!=DONE', filters:['dueAt','status'], timezone:'Asia/Dhaka', refresh:'5m', drillDown:{ view:'employee-tasks', queryKey:'dueAt' }, permission:['COUNSELOR'], format:'number'},
    { id:'apps-in-progress', label:'Applications In Progress', sourceEntity:'StudentApplication', calculation:'count StudentApplication where counselorId=currentUser AND status in [DRAFT,SUBMITTED,UNDER_REVIEW]', filters:['status','branchId'], timezone:'Asia/Dhaka', refresh:'realtime', drillDown:{ view:'employee-applications', queryKey:'counselorId' }, permission:['COUNSELOR'], format:'number'},
    { id:'conversion-rate', label:'Conversion %', sourceEntity:'Lead', calculation:'enrolled / totalAssigned *100', filters:['dateRange','branchId'], timezone:'Asia/Dhaka', refresh:'daily', drillDown: null, permission:['COUNSELOR','SENIOR_COUNSELOR'], format:'percent'},
  ],
  // minimal representative for each portal — extend similarly
};

export const portalFilters: Record<string, KPIFilter[]> = {
  default: [
    { key:'branchId', label:'Branch', options:['ALL']},
    { key:'dateRange', label:'Date Range', options:['Today','This Week','This Month','Custom']},
    { key:'status', label:'Status', options:['ALL']},
    { key:'assignedTo', label:'Assigned To', options:['ALL']},
  ]
};
