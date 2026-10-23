"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "./shared";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What documents do I need for a UK student visa?",
  "How do I prepare for my university interview?",
  "What's my next step after profile completion?",
  "Suggest universities for Computer Science Masters",
];

export function AiChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm ALO AI Assistant — your guide from first inquiry to final visa. Ask me anything about your study abroad journey, documents, applications, interviews, or visa preparation.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history: next.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, I couldn't process that. Please try again." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection issue. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-alo-gradient text-white shadow-lg transition-transform hover:scale-105 alo-shadow",
          open && "rotate-90"
        )}
        aria-label="Open AI Assistant"
      >
        <Icon name={open ? "X" : "Bot"} className="size-6" />
        {!open && <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-[var(--alo-cta)] ring-2 ring-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-[26rem] flex-col overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-alo-gradient px-4 py-3 text-white">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <Icon name="Bot" className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">ALO AI Assistant</p>
              <p className="flex items-center gap-1 text-[11px] text-white/80">
                <span className="size-1.5 rounded-full bg-emerald-300" /> Online · Journey guide
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto alo-scroll bg-[var(--alo-page)] p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user" ? "rounded-br-sm bg-[var(--alo-brand)] text-white" : "rounded-bl-sm bg-white text-foreground shadow-sm ring-1 ring-[var(--alo-brand)]/10"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--alo-brand)]/10">
                  <div className="flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-[var(--alo-brand)]/50 [animation-delay:-0.3s]" />
                    <span className="size-2 animate-bounce rounded-full bg-[var(--alo-brand)]/50 [animation-delay:-0.15s]" />
                    <span className="size-2 animate-bounce rounded-full bg-[var(--alo-brand)]/50" />
                  </div>
                </div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Try asking</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-[var(--alo-brand)]/15 bg-white px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-[var(--alo-brand)]/10 bg-white p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask about your journey..."
              className="h-9 flex-1 border-[var(--alo-brand)]/20 text-sm focus-visible:ring-[var(--alo-brand)]"
            />
            <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon" className="h-9 w-9 shrink-0 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90">
              <Icon name="Send" className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
