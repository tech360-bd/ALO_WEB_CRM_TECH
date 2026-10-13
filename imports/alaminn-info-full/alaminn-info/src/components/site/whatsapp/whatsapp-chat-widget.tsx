/**
 * WhatsAppChatWidget — floating AI chat preview
 * ============================================
 * A floating button that opens a chat panel where users can talk to
 * Alaminn AI directly on the website. The AI previews helps users
 * before they switch to WhatsApp.
 *
 * Features:
 *   - Floating button (bottom-right)
 *   - Chat panel with message history
 *   - "Continue on WhatsApp" button in the header
 *   - AI identifies itself as "Alaminn AI"
 *   - Rate-limited via the /api/v1/whatsapp/chat endpoint
 *   - Loading states, error handling
 *   - Mobile-responsive
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ArrowRight, Bot, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm Alaminn AI. I can help you explore study-abroad options — universities, courses, scholarships, PhDs, supervisors, and next steps. What would you like to know?",
  timestamp: new Date().toISOString(),
};

const SUGGESTED = [
  "Find MSc Computer Science in UK",
  "What scholarships are available?",
  "Find PhD opportunities",
  "Which countries are affordable?",
];

export function WhatsAppChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/whatsapp/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("You're sending messages too fast. Please wait a moment.");
        } else {
          setError(data?.message || "Something went wrong. Please try again.");
        }
        return;
      }

      const reply: ChatMessage = {
        role: "assistant",
        content: data?.data?.reply || "I'm sorry, I couldn't process that.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);

      if (data?.data?.continueOnWhatsappUrl) {
        setHandoffUrl(data.data.continueOnWhatsappUrl);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Open WhatsApp AI chat"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-[#25D366] text-white shadow-lg hover:bg-[#1da851]",
          "transition-all duration-300 hover:scale-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
          open && "rotate-180"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Alaminn AI chat"
          className={cn(
            "fixed bottom-24 right-6 z-50 flex flex-col",
            "w-[calc(100vw-3rem)] max-w-md h-[60vh] max-h-[600px]",
            "rounded-2xl border border-border bg-background shadow-2xl",
            "animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-[#075E54] px-4 py-3 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Alaminn AI</p>
                <p className="text-xs text-green-100">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-300 mr-1" />
                  Online · AI Assistant
                </p>
              </div>
            </div>
            {handoffUrl && (
              <a
                href={handoffUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition-colors"
                aria-label="Continue conversation on WhatsApp"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                    msg.role === "user"
                      ? "bg-[#25D366] text-white rounded-tr-sm"
                      : "bg-background border border-border rounded-tl-sm"
                  )}
                >
                  {msg.content}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="mr-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mr-auto flex max-w-[85%] items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggested messages (only on first load) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-background rounded-b-2xl">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                aria-label="Message Alaminn AI"
                className="min-h-[44px] max-h-32 resize-none text-sm"
                rows={1}
              />
              <Button
                onClick={send}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-11 w-11 flex-shrink-0 bg-[#25D366] hover:bg-[#1da851]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground text-center">
              AI assistant · Never shares your data without consent ·
              <a
                href="/legal/privacy"
                className="underline hover:text-foreground ml-1"
              >
                Privacy
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
