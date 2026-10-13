'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Globe,
  GraduationCap,
  DollarSign,
  BookOpen,
  ChevronRight,
  Trash2,
  MessageSquare,
  X,
  Loader2,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  cards?: RecommendationCard[];
}

interface RecommendationCard {
  type: 'country' | 'university' | 'course' | 'scholarship';
  title: string;
  subtitle: string;
  details: string[];
  matchScore?: number;
  flag?: string;
}

interface StudentProfile {
  name: string;
  qualification: string;
  budget: string;
  preferredCountries: string[];
}

interface AIStudyAssistantProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  'United Kingdom': '🇬🇧', 'USA': '🇺🇸', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'New Zealand': '🇳🇿', 'Ireland': '🇮🇪', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Denmark': '🇩🇰', 'Japan': '🇯🇵', 'Malaysia': '🇲🇾', 'UAE': '🇦🇪',
};

const QUICK_QUESTIONS = [
  { icon: GraduationCap, text: 'Which country is best for CS?', color: 'text-[#bf4520]' },
  { icon: Globe, text: 'How to get UK visa?', color: 'text-emerald-600' },
  { icon: DollarSign, text: 'Scholarships for Bangladesh students', color: 'text-amber-600' },
  { icon: Plane, text: 'Compare Australia vs Canada', color: 'text-violet-600' },
];

const ASK_COUNTRIES = [
  'United Kingdom', 'USA', 'Canada', 'Australia', 'Germany',
  'New Zealand', 'Ireland', 'Netherlands', 'Sweden', 'Denmark',
  'Japan', 'Malaysia', 'UAE',
];

// ─── Demo Response Generator ─────────────────────────────────────────────

function generateDemoResponse(message: string): { content: string; cards?: RecommendationCard[] } {
  const lower = message.toLowerCase();

  if (lower.includes('computer science') || lower.includes('cs') || lower.includes('which country')) {
    return {
      content: `Great question! For Computer Science, here are the top destinations for Bangladeshi students:\n\n🇺🇸 **USA** — World's best CS programs (MIT, Stanford, CMU). Higher tuition but excellent ROI with OPT/CPT work opportunities.\n\n🇬🇧 **UK** — Strong CS programs with 2-year post-study work visa. More affordable than USA.\n\n🇨🇦 **Canada** — Growing tech hub with easy PR pathway. University of Toronto, UBC are top choices.\n\n🇦🇺 **Australia** — Good programs with 2-4 year post-study work rights. University of Melbourne leads.\n\n🇩🇪 **Germany** — **Tuition-free** at public universities! DAAD scholarships available. Excellent for research.\n\nMy recommendation: If budget allows, **USA** for prestige. If affordability matters, **Germany** for zero tuition. **Canada** for best immigration pathway.`,
      cards: [
        { type: 'country', title: 'USA', subtitle: 'Top CS Programs', details: ['Avg tuition: $30,000-50,000/yr', 'OPT: 3 years for STEM', 'Top: MIT, Stanford, CMU'], matchScore: 92, flag: '🇺🇸' },
        { type: 'country', title: 'UK', subtitle: 'Strong CS + PSW Visa', details: ['Avg tuition: £15,000-25,000/yr', 'PSW: 2 years', 'Top: Oxford, Imperial, UCL'], matchScore: 88, flag: '🇬🇧' },
        { type: 'country', title: 'Germany', subtitle: 'Tuition-Free!', details: ['Public uni: €0-500/semester', '18-month job seeker visa', 'Top: TU Munich, RWTH Aachen'], matchScore: 90, flag: '🇩🇪' },
        { type: 'country', title: 'Canada', subtitle: 'Best PR Pathway', details: ['Avg tuition: CAD 20,000-40,000/yr', 'PGWP: up to 3 years', 'Top: UofT, UBC, Waterloo'], matchScore: 87, flag: '🇨🇦' },
      ],
    };
  }

  if (lower.includes('uk visa') || lower.includes('tier 4') || lower.includes('student visa uk')) {
    return {
      content: `Here's the complete UK Student Visa (formerly Tier 4) guide:\n\n**📋 Step-by-Step Process:**\n1. Get CAS (Confirmation of Acceptance for Studies) from university\n2. Pay IHS (Immigration Health Surcharge) — £470/year\n3. Complete online visa application — £348 fee\n4. Book biometrics appointment at VFS Global, Dhaka\n5. Upload all supporting documents\n6. Attend biometrics appointment\n7. Wait for decision (standard: 3 weeks, priority: 5 days)\n\n**📄 Key Documents:**\n- CAS letter, passport, financial evidence (28-day maintenance), TB certificate, academic documents, English test results\n\n**💰 Total Visa Costs (approx):**\n- Application fee: £348 (≈ ৳52,948)\n- IHS: £470/year (≈ ৳71,440/year)\n- VFS service: ~৳5,000\n- **Total: ≈ ৳1,30,000 for 1-year program**\n\nWould you like me to help with any specific step?`,
    };
  }

  if (lower.includes('scholarship') || lower.includes('fund') || lower.includes('financial aid')) {
    return {
      content: `Here are major scholarships available for Bangladeshi students:\n\n🏆 **Government Scholarships:**\n- **Chevening (UK)** — Full tuition + living, 1-year Master's\n- **Commonwealth (UK)** — Full funding for developing countries\n- **Fulbright (USA)** — Full funding for Master's/PhD\n- **DAAD (Germany)** — €934/month + tuition waiver\n\n🎓 **University Scholarships:**\n- **Gates Cambridge (UK)** — Full costs at Cambridge\n- **Clarendon (UK)** — Full costs at Oxford\n- **Melbourne Scholarship (Australia)** — AUD $30,000/yr\n- **UBC International Leader (Canada)** — CAD $10,000-20,000\n\n💡 **ALO Tips:**\n- Apply 8-12 months before intake\n- Most require IELTS 6.5+ and strong academics\n- Commonwealth deadline is usually December\n- ALO can help with scholarship application essays!`,
      cards: [
        { type: 'scholarship', title: 'Chevening Scholarship', subtitle: 'UK Government', details: ['Full tuition + living', '1-year Master\'s', 'Deadline: November'], matchScore: 95 },
        { type: 'scholarship', title: 'Commonwealth Scholarship', subtitle: 'UK Government', details: ['Full funding', 'Master\'s & PhD', 'Deadline: December'], matchScore: 93 },
        { type: 'scholarship', title: 'DAAD Scholarship', subtitle: 'Germany', details: ['€934/month', 'Master\'s & PhD', 'Deadline: Varies'], matchScore: 90 },
      ],
    };
  }

  if (lower.includes('compare') || lower.includes('australia') && lower.includes('canada')) {
    return {
      content: `**Australia vs Canada — Comparison for Bangladeshi Students:**\n\n| Factor | 🇦🇺 Australia | 🇨🇦 Canada |\n|--------|--------------|-----------|\n| Tuition (PG) | AUD 20,000-45,000 | CAD 15,000-35,000 |\n| Living Cost | AUD 21,041/yr req | CAD 10,000/yr req |\n| Post-Study Work | 2-4 years | Up to 3 years |\n| PR Pathway | Points-based | Express Entry (faster) |\n| Weather | Warm/temperate | Cold winters |\n| Part-time Work | 48 hrs/fortnight | 20 hrs/week |\n| IELTS Req | 6.0-6.5 | 6.0-6.5 |\n\n**✅ Choose Australia if:** You prefer warm climate, higher wages, and strong tech sector\n\n**✅ Choose Canada if:** PR is your priority, you don't mind cold weather, more affordable overall`,
    };
  }

  return {
    content: `Thank you for your question! Based on my knowledge of international education for Bangladeshi students, here are some thoughts:\n\nAs an ALO Education AI assistant, I can help you with:\n- 🌍 **Country selection** based on your profile and budget\n- 🎓 **University & course recommendations**\n- 📋 **Visa process guidance** for any country\n- 💰 **Scholarship information** and application tips\n- 💲 **Cost planning** including tuition, living, and visa costs\n- 📝 **SOP/CV writing** tips\n\nCould you tell me more about your background? For example:\n- Your current qualification\n- Budget range\n- Preferred study destination\n- Course of interest\n\nThis will help me give you more personalized advice!`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────

export function AIStudyAssistant({ onBack, onNavigate, onLeadOpen }: AIStudyAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: '', qualification: '', budget: '', preferredCountries: [],
  });
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alo-ai-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setStudentProfile(parsed.profile || { name: '', qualification: '', budget: '', preferredCountries: [] });
      }
    } catch {}
  }, []);

  // Save to localStorage whenever messages or profile change
  useEffect(() => {
    try {
      localStorage.setItem('alo-ai-chat-history', JSON.stringify({ messages, profile: studentProfile }));
    } catch {}
  }, [messages, studentProfile]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/study-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          studentProfile,
          conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: data.response || data.content || 'I apologize, but I could not generate a response. Please try again.',
          timestamp: Date.now(),
          cards: data.cards,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback to demo mode
      const demo = generateDemoResponse(text.trim());
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-demo`,
        role: 'assistant',
        content: demo.content,
        timestamp: Date.now(),
        cards: demo.cards,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, studentProfile]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('alo-ai-chat-history');
  }, []);

  const formatContent = (content: string) => {
    // Simple markdown-like rendering
    return content.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (rendered.startsWith('|') || rendered.trim() === '') {
        return <div key={i} className="text-sm text-[#2d3142]/70" dangerouslySetInnerHTML={{ __html: rendered }} />;
      }

      return (
        <div key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#2d3142]/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#bf4520] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[#2d3142]">ALO AI Study Assistant</h1>
                <p className="text-xs text-[#2d3142]/50">Your personal study abroad advisor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileSetup(!showProfileSetup)}
              className="text-xs px-3 py-1.5 rounded-md border border-[#2d3142]/10 text-[#2d3142]/60 hover:bg-[#f5f5f5] transition-colors"
            >
              {studentProfile.name ? '✏️ Profile' : '👤 Setup Profile'}
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs px-3 py-1.5 rounded-md border border-[#2d3142]/10 text-[#2d3142]/60 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Setup Banner */}
      {showProfileSetup && (
        <div className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium text-[#2d3142]/60 mb-2">Student Profile (helps me give better recommendations)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Your name"
                value={studentProfile.name}
                onChange={e => setStudentProfile(p => ({ ...p, name: e.target.value }))}
                className="text-sm h-8"
              />
              <Input
                placeholder="Qualification (e.g., HSC, BSc)"
                value={studentProfile.qualification}
                onChange={e => setStudentProfile(p => ({ ...p, qualification: e.target.value }))}
                className="text-sm h-8"
              />
              <Input
                placeholder="Budget (e.g., 20-30 lakh BDT)"
                value={studentProfile.budget}
                onChange={e => setStudentProfile(p => ({ ...p, budget: e.target.value }))}
                className="text-sm h-8"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6 py-8">
              {/* Welcome */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#bf4520] flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-[#2d3142]">Welcome to ALO AI Assistant</h2>
                <p className="text-sm text-[#2d3142]/60 max-w-md mx-auto">
                  I&apos;m your personal study abroad advisor. Ask me about countries, universities, visas, scholarships, or anything about studying overseas.
                </p>
              </div>

              {/* Quick Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#2d3142]/5 hover:border-[#bf4520]/30 text-left transition-all group"
                  >
                    <q.icon className={`w-5 h-5 ${q.color} shrink-0`} />
                    <span className="text-sm text-[#2d3142] group-hover:text-[#bf4520] transition-colors">{q.text}</span>
                    <ChevronRight className="w-4 h-4 text-[#2d3142]/30 ml-auto shrink-0" />
                  </button>
                ))}
              </div>

              {/* Country Flags Row */}
              <div className="text-center">
                <p className="text-xs text-[#2d3142]/40 mb-2">Ask about any country</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {ASK_COUNTRIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => sendMessage(`Tell me about studying in ${c}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#2d3142]/5 hover:border-[#bf4520]/30 text-xs text-[#2d3142]/70 hover:text-[#bf4520] transition-all"
                    >
                      <span>{COUNTRY_FLAGS[c]}</span>
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#bf4520] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-[#bf4520] text-white'
                  : 'bg-white border border-[#2d3142]/5 text-[#2d3142]'
              )}>
                {formatContent(msg.content)}

                {/* Recommendation Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.cards.map((card, ci) => (
                      <div
                        key={ci}
                        className="p-3 rounded-lg bg-[#f5f5f5] border border-[#2d3142]/5 cursor-pointer hover:border-[#bf4520]/30 transition-all"
                        onClick={() => {
                          if (card.type === 'country') onNavigate('country', card.title.toLowerCase().replace(/\s/g, '-'));
                          if (card.type === 'scholarship') onNavigate('scholarships');
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {card.flag && <span className="text-base">{card.flag}</span>}
                            <span className="text-sm font-semibold text-[#2d3142]">{card.title}</span>
                          </div>
                          {card.matchScore && (
                            <Badge variant="secondary" className="text-[10px] bg-[#bf4520]/10 text-[#bf4520] border-0">
                              {card.matchScore}% match
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#2d3142]/60 mb-1">{card.subtitle}</p>
                        {card.details.map((d, di) => (
                          <p key={di} className="text-[11px] text-[#2d3142]/50">• {d}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[#2d3142] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-[#bf4520] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-[#2d3142]/5 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#bf4520]" />
                  <span className="text-sm text-[#2d3142]/60">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {ASK_COUNTRIES.slice(0, 7).map((c) => (
                <button
                  key={c}
                  onClick={() => sendMessage(`Tell me about studying in ${c}`)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f5f5f5] border border-[#2d3142]/5 hover:border-[#bf4520]/30 text-xs text-[#2d3142]/60 hover:text-[#bf4520] transition-all whitespace-nowrap shrink-0"
                >
                  <span>{COUNTRY_FLAGS[c]}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about countries, universities, visas, scholarships..."
              disabled={isLoading}
              className="flex-1 h-10 text-sm border-[#2d3142]/10 focus:border-[#bf4520] focus:ring-[#bf4520]/20"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 bg-[#bf4520] hover:bg-[#a33d1c] text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-[#2d3142]/30 mt-1 text-center">
            ALO AI may occasionally provide inaccurate information. Always verify with your counselor.
          </p>
        </div>
      </div>
    </div>
  );
}
