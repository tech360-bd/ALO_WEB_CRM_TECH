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
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="My Tasks"
          description="Everything outstanding across your applications, with deadlines and priority."
          action={
            <Button variant="outline" className="h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold" onClick={reload}>
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
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
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
                  <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 px-4 text-[13px] font-semibold">
                    <Link href="/student/applications">View Applications</Link>
                  </Button>
                  <Button asChild className="h-9 rounded-button bg-orange-600 px-4 text-[13px] font-semibold text-white hover:bg-orange-700">
                    <Link href="/student/messages">Message My Counselor</Link>
                  </Button>
                </>
              }
            />
          )}

          {state === 'ready' && tasks.length > 0 && (
            <ul className="divide-y divide-slate-200">
              {tasks.map((task) => {
                const days = daysUntil(task.dueDate);
                const overdue = task.status !== 'COMPLETED' && days !== null && days < 0;
                const Icon = task.status === 'COMPLETED' ? CheckCircle2 : task.status === 'IN_PROGRESS' ? Timer : CircleDashed;
                return (
                  <li key={task.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        task.status === 'COMPLETED' ? 'text-emerald-600' : task.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-slate-400',
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-slate-900">{task.taskTitle}</p>
                      {task.taskDescription && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{task.taskDescription}</p>
                      )}
                      <p className="mt-1.5 text-[12px] text-slate-500">
                        <Link href={`/student/applications/${task.application.id}`} className="font-medium text-slate-700 hover:underline">
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
                          overdue ? 'text-red-600' : 'text-slate-500',
                        )}>
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                          {overdue
                            ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) === 1 ? '' : 's'}`
                            : days === 0
                              ? 'Due today'
                              : `Due in ${days} day${days === 1 ? '' : 's'}`}
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-400">No deadline set</span>
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
    tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-emerald-600' : tone === 'info' ? 'text-blue-600' : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className={cn('text-[24px] font-bold leading-none tracking-[-0.02em]', toneClass)}>{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
