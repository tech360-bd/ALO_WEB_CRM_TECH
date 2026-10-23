"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

export function CrmSms() {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/inbox/unified?channel=SMS")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.conversations || []).filter(
          (c: any) => c.channel === "SMS" && c.fromPhone
        );
        setConversations(list);
        if (list.length && !selected) setSelected(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selected]);

  React.useEffect(() => {
    load();
  }, []);

  const handleSend = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "SMS",
          toPhone: selected.fromPhone,
          body: reply,
          humanApproved: true,
        }),
      });
      if (res.ok) {
        toast({ title: "SMS sent" });
        setReply("");
        load();
      }
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="SMS Center"
        subtitle="Send and receive SMS messages with leads and students"
        icon="MessageCircle"
      />

      {loading ? (
        <div className="text-center text-[var(--alo-text-muted)]">Loading...</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="MessageCircle"
          title="No SMS conversations"
          description="SMS threads will appear here when configured."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Threads"
              value={conversations.length}
              icon="MessageCircle"
              accent="blue"
            />
            <StatCard
              label="Unread"
              value={conversations.reduce((s, c) => s + (c.unread || 0), 0)}
              icon="Bell"
              accent="orange"
            />
            <StatCard
              label="Awaiting Reply"
              value={conversations.filter((c) => c.unread > 0).length}
              icon="Clock"
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white lg:col-span-1">
              <CardContent className="p-0">
                <div className="border-b border-[var(--alo-brand-border)] px-4 py-3">
                  <h3 className="font-bold text-[var(--alo-text)]">Conversations</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y divide-[var(--alo-brand-border)]">
                  {conversations.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelected(c)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-[var(--alo-brand-light)] ${
                        selected?.key === c.key ? "bg-[var(--alo-brand-light)]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--alo-text)]">
                          {c.studentName || c.fromName || "Unknown"}
                        </p>
                        {c.unread > 0 && (
                          <Badge className="bg-[var(--alo-cta)] text-white">{c.unread}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--alo-text-muted)]">{c.fromPhone}</p>
                      <p className="truncate text-xs text-[var(--alo-text-muted)]">
                        {c.messages?.[c.messages.length - 1]?.body?.slice(0, 50)}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white lg:col-span-2">
              <CardContent className="flex h-[600px] flex-col p-0">
                {selected ? (
                  <>
                    <div className="border-b border-[var(--alo-brand-border)] px-4 py-3">
                      <p className="font-bold text-[var(--alo-text)]">
                        {selected.studentName || selected.fromName || "Unknown"}
                      </p>
                      <p className="text-xs text-[var(--alo-text-muted)]">{selected.fromPhone}</p>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto bg-[var(--alo-page)] p-4">
                      {(selected.messages || []).map((m: any) => (
                        <div
                          key={m.id}
                          className={`rounded-2xl px-3 py-2 text-sm ${
                            m.direction === "OUTBOUND"
                              ? "ml-auto max-w-[75%] bg-[var(--alo-brand)] text-white"
                              : "max-w-[75%] bg-white text-[var(--alo-text)]"
                          }`}
                        >
                          <p>{m.body}</p>
                          <p
                            className={`mt-1 text-[11px] ${
                              m.direction === "OUTBOUND" ? "text-blue-100" : "text-[var(--alo-text-muted)]"
                            }`}
                          >
                            {new Date(m.receivedAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[var(--alo-brand-border)] p-3">
                      <div className="flex gap-2">
                        <Input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Type SMS..."
                          maxLength={160}
                          className="border-[var(--alo-brand-border)]"
                        />
                        <Button
                          onClick={handleSend}
                          disabled={sending || !reply.trim()}
                          className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
                        >
                          <Icon name="Send" className="size-4" />
                        </Button>
                      </div>
                      <p className="mt-1 text-right text-[11px] text-[var(--alo-text-muted)]">
                        {reply.length}/160
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--alo-text-muted)]">
                    Select a conversation
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
export default CrmSms;
