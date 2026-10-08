"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

type ConversationMessage = {
  id: string;
  body?: string;
  direction?: string;
  receivedAt?: string;
  aiAssisted?: boolean;
};

type Conversation = {
  key: string;
  studentName?: string;
  fromName?: string;
  fromPhone?: string;
  fromEmail?: string;
  channel?: string;
  unread?: number;
  messages?: ConversationMessage[];
};

export function StudentMessages() {
  const { toast } = useToast();
  const { studentId } = useStudentId();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/inbox/unified?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then((d) => {
        const list: Conversation[] = d.conversations || [];
        setConversations(list);
        setSelected((prev) => prev ?? (list.length ? list[0] : null));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: selected.channel || "PORTAL",
          studentId: studentId || "",
          toPhone: selected.fromPhone,
          toEmail: selected.fromEmail,
          body: reply,
          aiAssisted: false,
          humanApproved: true,
        }),
      });
      if (res.ok) {
        toast({ title: "Message sent" });
        setReply("");
        load();
      } else {
        toast({ title: "Failed to send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="Messages"
          subtitle="Your conversations across email, WhatsApp, and SMS"
          icon="MessageSquare"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your messages."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Messages"
        subtitle="Your conversations across email, WhatsApp, and SMS"
        icon="MessageSquare"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="MessageSquare"
          title="No messages yet"
          description="Conversations with your counselor will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Conversation list */}
          <Card className="rounded-2xl border border-[#DCE8F5] bg-white lg:col-span-1">
            <CardContent className="p-0">
              <div className="border-b border-[#DCE8F5] px-4 py-3">
                <h3 className="font-bold text-[#0B2447]">Conversations</h3>
                <p className="text-xs text-[#5A7299]">{conversations.length} total</p>
              </div>
              <div className="max-h-[36rem] divide-y divide-[#DCE8F5] overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setSelected(c)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#EAF3FF]",
                      selected?.key === c.key && "bg-[#EAF3FF]"
                    )}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2563EB]">
                      <Icon name="User" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[#0B2447]">
                          {c.studentName || c.fromName || "Unknown"}
                        </p>
                        {c.unread && c.unread > 0 && (
                          <Badge className="bg-[#F97316] text-white">{c.unread}</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-[#5A7299]">
                        {c.messages?.[c.messages.length - 1]?.body?.slice(0, 50) || "—"}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] text-[#5A7299]">
                        {c.channel}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Thread */}
          <Card className="rounded-2xl border border-[#DCE8F5] bg-white lg:col-span-2">
            <CardContent className="flex h-[36rem] flex-col p-0">
              {selected ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#DCE8F5] px-4 py-3">
                    <div>
                      <p className="font-bold text-[#0B2447]">
                        {selected.studentName || selected.fromName || "Conversation"}
                      </p>
                      <p className="text-xs text-[#5A7299]">
                        {selected.fromPhone || selected.fromEmail || `via ${selected.channel}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[#5A7299]">
                      {selected.channel}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7FAFE] p-4">
                    {(selected.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          m.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                            m.direction === "OUTBOUND"
                              ? "bg-[#2563EB] text-white"
                              : "bg-white text-[#0B2447]"
                          )}
                        >
                          <p>{m.body}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              m.direction === "OUTBOUND" ? "text-blue-100" : "text-[#5A7299]"
                            )}
                          >
                            {m.receivedAt
                              ? new Date(m.receivedAt).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                            {m.aiAssisted && " • AI-assisted"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#DCE8F5] p-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="resize-none border-[#DCE8F5]"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        className="bg-[#2563EB] text-white hover:bg-[#0052a3]"
                      >
                        <Icon name="Send" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-[#5A7299]">
                  Select a conversation
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default StudentMessages;
