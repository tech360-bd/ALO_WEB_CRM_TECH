'use client';

/**
 * Student task list — /student/tasks (spec §58)
 *
 * Shows the tasks attached to this student's own applications. Data comes from
 * GET /api/student/tasks, which resolves the student from the session and never
 * accepts a student id from the request body.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, CircleDashed, Filter, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  PriorityBadge, StatusBadge, useStudentResource,
} from './portal-section';
import { cn } from '@/lib/utils';

interface StudentTask {
  id: string;
  taskTitle: string;
  taskDescription?: string;
  priority: string;
  status: string;
  dueDate: string | null;
  application: {
    id: string;
    applicationCode: string;
    universityName?: string;
    courseName?: string;
  };
}

interface TasksResponse {
  success: boolean;
  data: StudentTask[];
  total: number;
}

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'PENDING', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
];

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  const diff = due.getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export default function StudentTasks() {
  const [filter, setFilter] = useState('');
  const path = filter ? `/api/student/tasks?status=${filter}` : '/api/student/tasks';
  const { data, state, error, reload } = useStudentResource<TasksResponse>(path);

  const tasks = data?.data ?? [];

  const counts = useMemo(() => {
    const pending = tasks.filter((task) => task.status === 'PENDING').length;
    const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
    const overdue = tasks.filter((task) => {
      if (task.status === 'COMPLETED') return false;
      const days = daysUntil(task.dueDate);
      return days !== null && days < 0;
    }).length;
    return { pending, inProgress, completed, overdue };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="My Tasks"
          description="Everything outstanding across your applications, with deadlines and priority."
          action={
            <Button variant="outline" className=" rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold" onClick={reload}>
              <Filter className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          }
        />

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="To do" value={counts.pending} tone="neutral" />
          <SummaryTile label="In progress" value={counts.inProgress} tone="info" />
          <SummaryTile label="Completed" value={counts.completed} tone="success" />
          <SummaryTile label="Overdue" value={counts.overdue} tone={counts.overdue > 0 ? 'danger' : 'neutral'} />
        </div>

        <PortalCard
          title="Tasks"
          description="Sorted by due date"
          action={
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((option) => (
                <button
                  key={option.id || 'all'}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={filter === option.id}
                  className={cn(
                    'rounded-button border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    filter === option.id
                      ? 'border-[var(--alo-brand)] bg-[var(--alo-brand)] text-white'
                      : 'border-[var(--alo-border)] bg-white text-[var(--alo-body)] hover:bg-[var(--alo-page)]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        >
          {state === 'loading' && <div className="p-5"><PortalLoading label="Loading your tasks…" /></div>}

          {state === 'error' && (
            <div className="p-5">
              <PortalError message={error ?? 'The task list could not be loaded.'} onRetry={reload} />
            </div>
          )}

          {state === 'ready' && tasks.length === 0 && (
            <PortalEmpty
              title={filter ? 'No tasks with this status' : 'No tasks yet'}
              description={
                filter
                  ? 'Try a different filter — your other tasks are still there.'
                  : 'When your counselor adds steps to your application they will appear here with a deadline.'
              }
              action={
                <>
                  <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                    <Link href="/student/applications">View Applications</Link>
                  </Button>
                  <Button asChild className=" rounded-button bg-[var(--alo-cta-hover)] px-4 text-[13px] font-semibold text-white hover:bg-orange-700">
                    <Link href="/student/messages">Message My Counselor</Link>
                  </Button>
                </>
              }
            />
          )}

          {state === 'ready' && tasks.length > 0 && (
            <ul className="divide-y divide-[var(--alo-border)]">
              {tasks.map((task) => {
                const days = daysUntil(task.dueDate);
                const overdue = task.status !== 'COMPLETED' && days !== null && days < 0;
                const Icon = task.status === 'COMPLETED' ? CheckCircle2 : task.status === 'IN_PROGRESS' ? Timer : CircleDashed;
                return (
                  <li key={task.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        task.status === 'COMPLETED' ? 'text-emerald-600' : task.status === 'IN_PROGRESS' ? 'text-[var(--alo-brand)]' : 'text-[var(--alo-text-muted)]',
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--alo-text)]">{task.taskTitle}</p>
                      {task.taskDescription && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{task.taskDescription}</p>
                      )}
                      <p className="mt-1.5 text-[12px] text-[var(--alo-text-muted)]">
                        <Link href={`/student/applications/${task.application.id}`} className="font-medium text-[var(--alo-body)] hover:underline">
                          {task.application.universityName || task.application.applicationCode}
                        </Link>
                        {task.application.courseName ? ` — ${task.application.courseName}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex gap-1.5">
                        <PriorityBadge value={task.priority} />
                        <StatusBadge value={task.status} />
                      </div>
                      {task.dueDate ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[12px] font-medium',
                          overdue ? 'text-red-600' : 'text-[var(--alo-text-muted)]',
                        )}>
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                          {overdue
                            ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) === 1 ? '' : 's'}`
                            : days === 0
                              ? 'Due today'
                              : `Due in ${days} day${days === 1 ? '' : 's'}`}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--alo-text-muted)]">No deadline set</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'info' | 'success' | 'danger' }) {
  const toneClass =
    tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-emerald-600' : tone === 'info' ? 'text-[var(--alo-brand)]' : 'text-[var(--alo-text)]';
  return (
    <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-4 py-3">
      <p className={cn('text-[24px] font-bold leading-none tracking-[-0.02em]', toneClass)}>{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-[var(--alo-text-muted)]">{label}</p>
    </div>
  );
}
