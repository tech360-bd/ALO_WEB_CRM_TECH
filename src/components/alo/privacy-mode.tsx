"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "./shared";

// Privacy mode context — when ON, sensitive fields are blurred and require PIN to reveal
const PrivacyContext = React.createContext<{ privacyOn: boolean; toggle: () => void; reveal: (id: string) => boolean; isRevealed: (id: string) => boolean; rehide: () => void } | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyOn, setPrivacyOn] = React.useState(true); // ON by default for HR/financial cards
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [lastActivity, setLastActivity] = React.useState(Date.now());

  // Auto-hide after 60 seconds of inactivity
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 60000 && revealed.size > 0) {
        setRevealed(new Set());
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastActivity, revealed]);

  const toggle = () => setPrivacyOn((p) => !p);
  const reveal = (id: string) => {
    setRevealed((prev) => new Set(prev).add(id));
    setLastActivity(Date.now());
    return true;
  };
  const isRevealed = (id: string) => revealed.has(id);
  const rehide = () => { setRevealed(new Set()); setLastActivity(Date.now()); };

  return (
    <PrivacyContext.Provider value={{ privacyOn, toggle, reveal, isRevealed, rehide }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = React.useContext(PrivacyContext);
  if (!ctx) return { privacyOn: false, toggle: () => {}, reveal: () => false, isRevealed: () => false, rehide: () => {} };
  return ctx;
}

// Toggle button for the header
export function PrivacyToggle() {
  const { privacyOn, toggle } = usePrivacy();
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
        privacyOn ? "border-[#0B5ED7] bg-[#e8f0fb] text-[#0B5ED7]" : "border-[#F97316] bg-[#fdece4] text-[#F97316]"
      )}
      title={privacyOn ? "Privacy mode ON — sensitive data blurred. Click to turn off." : "Privacy mode OFF. Click to turn on."}
    >
      <Icon name={privacyOn ? "EyeOff" : "Eye"} className="size-3.5" />
      <span className="hidden sm:inline">{privacyOn ? "Privacy On" : "Privacy Off"}</span>
    </button>
  );
}

// Sensitive field wrapper — blurs content unless revealed (with PIN/OTP simulation)
export function SensitiveField({ id, label, value, type = "text", mono }: { id: string; label: string; value: React.ReactNode; type?: "text" | "currency"; mono?: boolean }) {
  const { privacyOn, isRevealed, reveal, rehide } = usePrivacy();
  const [showPinPrompt, setShowPinPrompt] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const revealed = isRevealed(id);

  if (!privacyOn || revealed) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-right text-sm font-semibold text-foreground", mono && "font-mono", type === "currency" && "tabular-nums")}>{value}</span>
          {privacyOn && revealed && (
            <button onClick={rehide} className="text-muted-foreground hover:text-[#0B5ED7]" title="Hide again">
              <Icon name="EyeOff" className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="select-none rounded bg-muted px-3 py-0.5 text-sm font-mono text-muted-foreground/60 blur-sm transition-all">{String(value)}</span>
        <button
          onClick={() => setShowPinPrompt(true)}
          className="flex items-center gap-1 rounded border border-[#0B5ED7]/30 px-2 py-0.5 text-[10px] font-semibold text-[#0B5ED7] hover:bg-[#e8f0fb]"
          title="Click to reveal (requires PIN)"
        >
          <Icon name="Lock" className="size-3" />
          Reveal
        </button>
      </div>
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowPinPrompt(false); setPin(""); }}>
          <div className="w-full max-w-xs rounded-2xl border-2 border-[#0B5ED7]/20 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#0B5ED7]">
                <Icon name="ShieldCheck" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B5ED7]">Reveal sensitive data</p>
                <p className="text-xs text-muted-foreground">Enter your PIN to view {label.toLowerCase()}</p>
              </div>
            </div>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length >= 4) {
                  reveal(id);
                  setShowPinPrompt(false);
                  setPin("");
                }
              }}
              placeholder="Enter PIN (any 4+ digits)"
              className="mt-3 h-10 text-center font-mono tracking-widest"
              autoFocus
            />
            <p className="mt-2 text-[10px] text-muted-foreground">This action will be audit-logged as <code className="font-mono">sensitive_data_revealed</code>.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1 h-9" onClick={() => { setShowPinPrompt(false); setPin(""); }}>Cancel</Button>
              <Button
                className="flex-1 h-9 bg-[#0B5ED7] text-white hover:bg-[#0B5ED7]/90"
                disabled={pin.length < 4}
                onClick={() => { reveal(id); setShowPinPrompt(false); setPin(""); }}
              >
                Reveal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
