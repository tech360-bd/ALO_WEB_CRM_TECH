'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AloPublicSite from '@/components/alo/portal/AloPublicSite'
import AloLoginModal from '@/components/alo/portal/AloLoginModal'
import { getSession, setSession, workspaceFor } from '@/lib/session'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

// ─── Communication-channel contact widget ─────────────────────────────────────
// 3 floating buttons (WhatsApp AI Agent, Facebook, AI Agent chat) visible on
// the homepage. Clicks are tracked via POST /api/public/contact-buttons (no
// auth needed). Positioned bottom-right so it never overlaps the sticky header
// or the footer's "Book Free Consultation" CTA.

const WHATSAPP_URL = 'https://wa.me/8801805020100'
const FACEBOOK_URL = 'https://facebook.com/aloeducation'

type ContactButtonId = 'whatsapp' | 'facebook' | 'ai_agent'

interface ContactButtonsResponse {
  buttons: Array<{
    id: string
    label: string
    type: string
    href: string
    logoUrl: string | null
    enabled: boolean
    description: string
  }>
  count: number
}

function trackContactClick(button: ContactButtonId) {
  // Fire-and-forget — the route is public (whitelisted in proxy.ts). If the
  // POST handler is missing or errors, we silently ignore; the user's click
  // still opens the target channel.
  try {
    void fetch('/api/public/contact-buttons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ button }),
    }).catch(() => {})
  } catch {
    // ignore
  }
}

function CommunicationContactWidget() {
  const [open, setOpen] = useState(false)
  const [buttons, setButtons] = useState<ContactButtonsResponse['buttons'] | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  // Optionally hydrate logo URLs from the public endpoint — falls back to
  // brand-colored icons if the API is unavailable.
  useEffect(() => {
    let cancelled = false
    fetch('/api/public/contact-buttons')
      .then((r) => (r.ok ? r.json() as Promise<ContactButtonsResponse> : null))
      .then((d) => {
        if (cancelled || !d) return
        setButtons(d.buttons || [])
      })
      .catch(() => {
        // silent — fallback to default icons
      })
    return () => {
      cancelled = true
    }
  }, [])

  const config = (id: ContactButtonId) =>
    buttons?.find((b) => b.id === id || b.id === `${id}_ai_agent`)

  const openChannel = useCallback((id: ContactButtonId) => {
    trackContactClick(id)
    if (id === 'whatsapp') {
      window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')
      return
    }
    if (id === 'facebook') {
      window.open(FACEBOOK_URL, '_blank', 'noopener,noreferrer')
      return
    }
    // ai_agent → toggle the in-page chat panel
    setChatOpen((v) => !v)
  }, [])

  return (
    <>
      {/* Floating widget — bottom-right, mobile-friendly */}
      <div
        className="fixed z-50 right-4 bottom-4 sm:right-6 sm:bottom-6 flex flex-col items-end gap-2"
        aria-label="Communication channels"
      >
        {/* Expanded panel of 3 buttons */}
        {open && (
          <div className="flex flex-col gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => openChannel('whatsapp')}
              className="group flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-full pl-2 pr-4 py-2 hover:shadow-xl hover:border-green-300 transition-all"
              aria-label="Chat on WhatsApp with AI Agent at 01805020100"
            >
              <span
                className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: '#25D366' }}
              >
                <WhatsAppIcon className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight">WhatsApp AI Agent</span>
                <span className="block text-[10px] text-slate-500 leading-tight">01805020100 · 24/7</span>
              </span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => openChannel('facebook')}
              className="group flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-full pl-2 pr-4 py-2 hover:shadow-xl hover:border-blue-300 transition-all"
              aria-label="Open ALO Education on Facebook"
            >
              <span
                className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: '#1877F2' }}
              >
                <FacebookIcon className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight">Facebook</span>
                <span className="block text-[10px] text-slate-500 leading-tight">facebook.com/aloeducation</span>
              </span>
            </button>

            {/* AI Agent chat */}
            <button
              type="button"
              onClick={() => openChannel('ai_agent')}
              className="group flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-full pl-2 pr-4 py-2 hover:shadow-xl hover:border-[#E8501A] transition-all"
              aria-label="Open AI Agent chat"
            >
              <span
                className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
              >
                <SparklesIcon className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight">AI Agent</span>
                <span className="block text-[10px] text-slate-500 leading-tight">Instant answers 24/7</span>
              </span>
            </button>
          </div>
        )}

        {/* Toggle FAB — ALO brand gradient */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
          aria-label={open ? 'Close communication channels' : 'Open communication channels'}
          aria-expanded={open}
        >
          {open ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <ChatIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* AI Agent chat panel */}
      {chatOpen && (
        <AiAgentChatPanel onClose={() => setChatOpen(false)} />
      )}

      {/* Hidden pre-hydration helper — expose config URLs if loaded */}
      <span className="sr-only" aria-hidden="true">
        {config('whatsapp')?.href} {config('facebook')?.href}
      </span>
    </>
  )
}

// ─── AI Agent chat panel (lightweight, calls /api/public/chat) ────────────────
function AiAgentChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm the ALO Education AI Agent. Ask me about courses, visas, scholarships, or book a free consultation.",
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || 'AI Agent is unavailable right now')
      }
      const reply =
        payload.response ||
        payload.output ||
        payload.message ||
        (typeof payload === 'string' ? payload : "I'm here to help — could you rephrase that?")
      setMessages((m) => [...m, { role: 'assistant', content: String(reply) }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Something went wrong. Please try WhatsApp instead.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed z-50 right-4 bottom-24 sm:right-6 sm:bottom-24 w-[min(92vw,360px)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
      <div
        className="px-4 py-3 flex items-center justify-between text-white"
        style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4" />
          <span className="text-sm font-bold">AI Agent</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">online</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white"
          aria-label="Close AI Agent chat"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 bg-slate-50/50 max-h-72 overflow-y-auto space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'bg-[#0057B8] text-white rounded-lg rounded-br-none px-3 py-2 ml-auto max-w-[80%] w-fit'
                : 'bg-white border border-slate-200 text-slate-900 rounded-lg rounded-bl-none px-3 py-2 mr-auto max-w-[80%] w-fit'
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="bg-white border border-slate-200 text-slate-400 rounded-lg px-3 py-2 mr-auto max-w-[80%] w-fit text-xs">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
            </span>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-slate-200 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Type a message…"
          className="flex-1 h-9 px-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:border-[#0057B8]"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !input.trim()}
          className="h-9 px-3 rounded-md text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ─── Inline SVG icons (avoid extra dependencies) ─────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2zm0 18.13c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.18.83.85-3.1-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.95 5.95L20 9.9l-5.05 3.1L17 19l-5-3.6L7 19l1.05-6L3 9.9l6.05-1.95L12 2zM5.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1L2.7 16.8l2.1-.7.7-2.1zm13 0l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  // Auto-redirect if already logged in
  useEffect(() => {
    const s = getSession()
    if (s) {
      const ws = workspaceFor(s)
      if (ws) {
        setRedirecting(true)
        router.replace(`/${ws}/dashboard`)
      }
    }
  }, [router])

  const handleLogin = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setSession({
      token: res.token,
      user: {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        phone: res.user.phone ?? null,
        profilePhoto: res.user.profilePhoto ?? null,
        userType: res.user.userType as 'student' | 'partner' | 'employee',
        referenceId: res.user.referenceId ?? null,
        forcePasswordChange: res.user.forcePasswordChange ?? false,
        status: res.user.status,
      },
      roles: res.roles,
      permissions: res.permissions,
    })
    const ws = workspaceFor({
      token: res.token,
      user: {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        phone: res.user.phone ?? null,
        profilePhoto: res.user.profilePhoto ?? null,
        userType: res.user.userType as 'student' | 'partner' | 'employee',
        referenceId: res.user.referenceId ?? null,
        forcePasswordChange: res.user.forcePasswordChange ?? false,
        status: res.user.status,
      },
      roles: res.roles,
      permissions: res.permissions,
    })
    toast.success(`Welcome back, ${res.user.name}!`)
    setLoginOpen(false)
    if (ws) {
      router.push(`/${ws}/dashboard`)
    } else {
      router.push('/')
    }
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 rounded-full border-4 border-[#0057B8] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <AloPublicSite onLogin={() => setLoginOpen(true)} />
      <CommunicationContactWidget />
      <AloLoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLogin={handleLogin}
      />
    </>
  )
}
