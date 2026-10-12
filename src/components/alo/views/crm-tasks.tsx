"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-[#EAF3FF] text-[#0066CC]",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: "Follow-up",
  DOCUMENT_REQUEST: "Document Request",
  CALL: "Call",
  MEETING: "Meeting",
  SOP_REVIEW: "SOP Review",
  VISA_CHECK: "Visa Check",
  OTHER: "Other",
};

export function CrmTasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<string>("ALL");
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    priority: "NORMAL",
    type: "FOLLOW_UP",
    dueDate: "",
    assigneeId: "",
    studentId: "",
  });

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/counselor/tasks")
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/counselor/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          priority: form.priority,
          type: form.type,
          dueDate: form.dueDate || undefined,
          assigneeId: form.assigneeId || undefined,
          studentId: form.studentId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        setForm({
          title: "",
          description: "",
          priority: "NORMAL",
          type: "FOLLOW_UP",
          dueDate: "",
          assigneeId: "",
          studentId: "",
        });
        setOpen(false);
        toast({ title: "Task created" });
      }
    } catch {
      toast({ title: "Failed to create", variant: "destructive" });
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/counselor/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === "COMPLETED" ? new Date().toISOString() : null,
                }
              : t
          )
        );
      }
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED"
  ).length;
  const completedToday = tasks.filter(
    (t) =>
      t.status === "COMPLETED" &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Task Management"
        subtitle="Create, assign, and track tasks across the team"
        icon="CheckSquare"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0066CC] text-white hover:bg-[#0052a3]">
                <Icon name="Plus" className="mr-1.5 size-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Follow up with Tasnim about IELTS"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm({ ...form, type: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => setForm({ ...form, priority: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Assignee ID (optional)</Label>
                    <Input
                      value={form.assigneeId}
                      onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                      placeholder="User ID"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-[#0066CC] text-white hover:bg-[#0052a3]"
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Total Tasks" value={tasks.length} icon="CheckSquare" accent="blue" />
            <StatCard
              label="Overdue"
              value={overdue}
              icon="AlertTriangle"
              accent="rose"
            />
            <StatCard
              label="Completed Today"
              value={completedToday}
              icon="CheckCircle2"
              accent="emerald"
            />
            <StatCard
              label="Pending"
              value={tasks.filter((t) => t.status === "PENDING").length}
              icon="Clock"
              accent="amber"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className={
                  filter === f
                    ? "bg-[#0066CC] text-white"
                    : "border-[#DCE8F5] text-[#5A7299]"
                }
                onClick={() => setFilter(f)}
              >
                {f.replace(/_/g, " ")}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="CheckSquare"
              title="No tasks found"
              description="Create a task or change the filter to see results."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const isOverdue =
                  t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED";
                return (
                  <Card
                    key={t.id}
                    className={`rounded-2xl border bg-white ${
                      isOverdue ? "border-rose-200" : "border-[#DCE8F5]"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#0B2447]">{t.title}</h3>
                        <Badge className={PRIORITY_COLORS[t.priority] || "bg-slate-100"}>
                          {t.priority}
                        </Badge>
                      </div>
                      {t.description && (
                        <p className="mt-2 text-sm text-[#5A7299]">{t.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5A7299]">
                        <Badge variant="outline">{TYPE_LABELS[t.type] || t.type}</Badge>
                        {t.student && (
                          <Badge variant="outline" className="text-[#0066CC]">
                            <Icon name="User" className="mr-1 size-3" />
                            {t.student.fullName}
                          </Badge>
                        )}
                        {t.dueDate && (
                          <span className={isOverdue ? "font-semibold text-rose-600" : ""}>
                            <Icon name="CalendarClock" className="mr-1 inline size-3" />
                            {new Date(t.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge className={STATUS_COLORS[t.status] || "bg-slate-100"}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                        {t.status !== "COMPLETED" && (
                          <div className="flex gap-1">
                            {t.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 border-[#DCE8F5] text-xs"
                                onClick={() => handleStatus(t.id, "IN_PROGRESS")}
                              >
                                Start
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700"
                              onClick={() => handleStatus(t.id, "COMPLETED")}
                            >
                              <Icon name="Check" className="size-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
