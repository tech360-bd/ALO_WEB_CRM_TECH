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
        <div className="text-center text-[#5A7299]">Loading...</div>
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
            <Card className="rounded-2xl border border-[#DCE8F5] bg-white lg:col-span-1">
              <CardContent className="p-0">
                <div className="border-b border-[#DCE8F5] px-4 py-3">
                  <h3 className="font-bold text-[#0B2447]">Conversations</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y divide-[#DCE8F5]">
                  {conversations.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelected(c)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-[#EAF3FF] ${
                        selected?.key === c.key ? "bg-[#EAF3FF]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0B2447]">
                          {c.studentName || c.fromName || "Unknown"}
                        </p>
                        {c.unread > 0 && (
                          <Badge className="bg-[#F37021] text-white">{c.unread}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#5A7299]">{c.fromPhone}</p>
                      <p className="truncate text-xs text-[#5A7299]">
                        {c.messages?.[c.messages.length - 1]?.body?.slice(0, 50)}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#DCE8F5] bg-white lg:col-span-2">
              <CardContent className="flex h-[600px] flex-col p-0">
                {selected ? (
                  <>
                    <div className="border-b border-[#DCE8F5] px-4 py-3">
                      <p className="font-bold text-[#0B2447]">
                        {selected.studentName || selected.fromName || "Unknown"}
                      </p>
                      <p className="text-xs text-[#5A7299]">{selected.fromPhone}</p>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto bg-[#F7FAFE] p-4">
                      {(selected.messages || []).map((m: any) => (
                        <div
                          key={m.id}
                          className={`rounded-2xl px-3 py-2 text-sm ${
                            m.direction === "OUTBOUND"
                              ? "ml-auto max-w-[75%] bg-[#0066CC] text-white"
                              : "max-w-[75%] bg-white text-[#0B2447]"
                          }`}
                        >
                          <p>{m.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              m.direction === "OUTBOUND" ? "text-blue-100" : "text-[#5A7299]"
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
                    <div className="border-t border-[#DCE8F5] p-3">
                      <div className="flex gap-2">
                        <Input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Type SMS..."
                          maxLength={160}
                          className="border-[#DCE8F5]"
                        />
                        <Button
                          onClick={handleSend}
                          disabled={sending || !reply.trim()}
                          className="bg-[#0066CC] text-white hover:bg-[#0052a3]"
                        >
                          <Icon name="Send" className="size-4" />
                        </Button>
                      </div>
                      <p className="mt-1 text-right text-[10px] text-[#5A7299]">
                        {reply.length}/160
                      </p>
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
        </>
      )}
    </div>
  );
}
export default CrmSms;
