"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon, PageHeader } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

export function StudentHelp() {
  const { toast } = useToast();
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState("GENERAL");
  const handleSubmit = () => { if (!subject || !message) { toast({ title: "Subject and message required", variant: "destructive" }); return; } toast({ title: "Support ticket created!", description: "ALO team will respond within 24 hours." }); setSubject(""); setMessage(""); };
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Help Center" subtitle="Get support from ALO Education" icon="HelpCircle" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border border-[#DCE8F5] bg-white"><CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#0B2447]">Submit a Support Ticket</h3>
          <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" className="mt-1" /></div>
          <div><Label>Category</Label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-[#DCE8F5] bg-white px-3"><option value="GENERAL">General</option><option value="TECHNICAL">Technical</option><option value="ADMISSION">Admission</option><option value="VISA">Visa</option><option value="PAYMENT">Payment</option><option value="DOCUMENT">Document</option></select></div>
          <div><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe in detail..." className="mt-1" /></div>
          <Button onClick={handleSubmit} className="bg-[#0066CC] text-white hover:bg-[#0052a3]">Submit Ticket</Button>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="rounded-2xl border border-[#DCE8F5] bg-[#F7FAFE]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#0066CC]"><Icon name="MessageCircle" className="size-5" /></div><div><p className="font-semibold text-[#0B2447]">WhatsApp</p><p className="text-sm text-[#5A7299]">01805020101</p></div></div></CardContent></Card>
          <Card className="rounded-2xl border border-[#DCE8F5] bg-[#F7FAFE]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#FFF3EA] text-[#F37021]"><Icon name="Mail" className="size-5" /></div><div><p className="font-semibold text-[#0B2447]">Email</p><p className="text-sm text-[#5A7299]">info@aloeducation.com</p></div></div></CardContent></Card>
          <Card className="rounded-2xl border border-[#DCE8F5] bg-[#F7FAFE]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Icon name="Bot" className="size-5" /></div><div><p className="font-semibold text-[#0B2447]">AI Assistant</p><p className="text-sm text-[#5A7299]">Ask ALO AI</p></div></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
