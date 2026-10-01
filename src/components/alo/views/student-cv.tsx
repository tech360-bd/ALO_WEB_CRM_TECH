"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

type CvDraft = {
  id: string;
  title?: string;
  template?: string;
  cvType?: string;
  content?: string;
  status?: string;
  updatedAt?: string;
};

export function StudentCv() {
  const { toast } = useToast();
  const { studentId } = useStudentId();

  const [drafts, setDrafts] = React.useState<CvDraft[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [cvType, setCvType] = React.useState("ACADEMIC");
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/student/cv?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setDrafts(d.drafts || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const handleSave = async () => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    if (!title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/student/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId || "", title, content, cvType }),
      });
      if (res.ok) {
        const d = await res.json();
        setDrafts([d.draft, ...drafts]);
        setTitle("");
        setContent("");
        toast({ title: "CV draft saved!" });
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId || "",
          template: cvType,
          personalInfo: title || "Student CV",
          education: "BSc Computer Science",
          workExperience: "2 years relevant experience",
          skills: "Python, Java, TypeScript",
        }),
      });
      const data = await res.json();
      if (data.content || data.cv) {
        setContent(data.content || data.cv);
        toast({ title: "AI CV generated!" });
      } else {
        toast({ title: "AI generation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "AI generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader title="CV Builder" subtitle="Create professional CVs with AI assistance" icon="FileUser" />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to build and manage your CV drafts."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="CV Builder" subtitle="Create professional CVs with AI assistance" icon="FileUser" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#0B2447]">Create New CV</h3>
            <div>
              <Label htmlFor="cvtitle">CV Title</Label>
              <Input
                id="cvtitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Academic CV"
                className="mt-1"
              />
            </div>
            <div>
              <Label>CV Type</Label>
              <select
                value={cvType}
                onChange={(e) => setCvType(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-[#DCE8F5] bg-white px-3 text-sm"
              >
                <option value="ACADEMIC">Academic</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="UNIVERSITY">University</option>
                <option value="SCHOLARSHIP">Scholarship</option>
              </select>
            </div>
            <div>
              <Label htmlFor="cvcontent">Content</Label>
              <Textarea
                id="cvcontent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#0B5ED7] text-white hover:bg-[#0052a3]"
              >
                Save Draft
              </Button>
              <Button
                onClick={handleAiGenerate}
                disabled={generating}
                variant="outline"
                className="border-[#F97316] text-[#F97316] hover:bg-[#FFF3EA]"
              >
                <Icon name="Sparkles" className="mr-1.5 size-4" />
                AI Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#0B2447]">My CV Drafts</h3>
            {loading ? (
              <p className="mt-4 text-[#5A7299]">Loading...</p>
            ) : drafts.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon="FileText" title="No CVs yet" description="Create your first CV draft." />
              </div>
            ) : (
              <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-[#0B2447]">
                        {d.title || d.template || "Untitled CV"}
                      </h4>
                      <Badge variant="secondary">{d.cvType || d.template || "STANDARD"}</Badge>
                    </div>
                    {d.content && (
                      <p className="mt-2 line-clamp-2 text-sm text-[#5A7299]">
                        {d.content.slice(0, 120)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentCv;
