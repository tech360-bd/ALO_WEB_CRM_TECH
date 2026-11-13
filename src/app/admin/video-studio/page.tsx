'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Video, Sparkles, Layers, Bot, Zap, Scissors, Mic, Download,
  Play, FileText, Globe, Users, BarChart3, Settings, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle, Github, ExternalLink,
  Film, MessageSquare, Captions, Brain, Monitor, Radio, Code,
  Image as ImageIcon, Type, Send
} from 'lucide-react';

type ProviderHealth = {
  id: string;
  name: string;
  category: string;
  status: string;
  vramRequiredGB?: number;
};

type RegistryEntry = {
  id: string;
  url: string;
  name: string;
  category: string;
  description: string;
  license: string;
  integration: { providerId: string; priority: string; status: string };
  aloUseCases: string[];
};

export default function VideoStudioPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<Record<string, ProviderHealth>>({});
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [compositions, setCompositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form states
  const [prompt, setPrompt] = useState('UK university campus cinematic, students, modern buildings, 2027 intake');
  const [provider, setProvider] = useState('ltx');
  const [compositionId, setCompositionId] = useState('UniversityPromo');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [providersRes, templatesRes] = await Promise.all([
        fetch('/api/video-engine/providers').then(r => r.json()).catch(() => ({ health: {}, registry: [], stats: {} })),
        fetch('/api/video-engine/templates').then(r => r.json()).catch(() => ({ remotion: [] })),
      ]);
      setHealth(providersRes.health || {});
      setRegistry(providersRes.registry || []);
      setStats(providersRes.stats || null);
      setCompositions(templatesRes.remotion || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRender = async (type: string) => {
    setRendering(true);
    setResult(null);
    try {
      let res;
      if (type === 'remotion') {
        res = await fetch('/api/video-engine/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: 'remotion', compositionId, inputProps: { title: prompt, universityName: 'University of Manchester' } }),
        }).then(r => r.json());
      } else if (type === 'ai') {
        res = await fetch('/api/video-engine/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: provider, prompt, durationSec: 5, aspectRatio: '16:9', resolution: '720p' }),
        }).then(r => r.json());
      } else if (type === 'caption') {
        res = await fetch('/api/video-engine/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl, language: 'en', targetLanguages: ['bn', 'en'] }),
        }).then(r => r.json());
      } else if (type === 'youtube') {
        res = await fetch('/api/video-engine/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'youtube', url: youtubeUrl, hasRights: true, purpose: 'own_content_reedit', quality: '720p' }),
        }).then(r => r.json());
      } else if (type === 'claude_video') {
        res = await fetch('/api/video-engine/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'claude_video', prompt, durationSec: 30, aspectRatio: '16:9', language: 'english', includeBrand: true }),
        }).then(r => r.json());
      }
      setResult(res);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setRendering(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'online') return 'bg-crm-success-bg border-crm-success-border text-crm-success-text';
    if (status === 'not_configured') return 'bg-crm-warning-bg border-crm-warning-border text-crm-warning-text';
    if (status === 'offline' || status === 'failed') return 'bg-crm-danger-bg border-crm-danger-border text-crm-danger-text';
    return 'bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]';
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--alo-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--alo-brand)] mb-3" />
        <p className="text-sm font-semibold">Loading Video Studio — 34 repos audit...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[var(--alo-text)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--alo-brand)] rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2">
                ALO Video Studio
                <span className="px-2.5 py-0.5 bg-[var(--alo-cta)] text-white text-[11px] font-extrabold rounded-full">UNIFIED ENGINE</span>
              </h1>
              <p className="text-xs text-[var(--alo-text-muted)]">34 repos integrated: n8n, Remotion, CogVideo, Hunyuan, LTX, InfiniteTalk, VideoCaptioner, Jitsi, etc.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" className=" rounded-xl">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button onClick={() => window.open('/docs/VIDEO_ECOSYSTEM_AUDIT.md', '_blank')} className="bg-[var(--alo-brand)] text-white text-[13px] rounded-[10px] hover:bg-[var(--alo-brand-hover)]">
            <FileText className="w-4 h-4 mr-1.5" /> Audit Doc
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Total Repos</span>
            <p className="text-2xl font-extrabold text-[var(--alo-brand)]">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">P0 Critical</span>
            <p className="text-2xl font-extrabold text-crm-danger-text">{stats.p0}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">P1 Important</span>
            <p className="text-2xl font-extrabold text-crm-warning-text">{stats.p1}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Integrated</span>
            <p className="text-2xl font-extrabold text-crm-success-text">{stats.integrated}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Adapter Ready</span>
            <p className="text-2xl font-extrabold text-[var(--alo-brand)]">{stats.adapterReady}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">AI Gen</span>
            <p className="text-2xl font-extrabold text-[var(--alo-brand)]">{stats.categories?.ai_generation}</p>
          </Card>
          <Card className="p-4 bg-white border rounded-xl">
            <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Automation</span>
            <p className="text-2xl font-extrabold text-[var(--alo-cta-active)]">{stats.categories?.content_automation + stats.categories?.automation}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--alo-border)] pb-2 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & Health', icon: BarChart3 },
          { id: 'remotion', label: 'Remotion (React Video)', icon: Layers },
          { id: 'ai', label: 'AI Generation', icon: Sparkles },
          { id: 'caption', label: 'Captioning (VideoCaptioner)', icon: Captions },
          { id: 'talking', label: 'Talking Head', icon: Mic },
          { id: 'editing', label: 'Editing Tools', icon: Scissors },
          { id: 'automation', label: 'Automation', icon: Zap },
          { id: 'recording', label: 'Recording & Jitsi', icon: Monitor },
          { id: 'registry', label: '34 Repos Registry', icon: Github },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${activeTab === tab.id ? 'bg-[var(--alo-brand)] text-white font-bold' : 'bg-white text-[var(--alo-body)] border hover:bg-[var(--alo-page)]'}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border rounded-2xl lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[var(--alo-brand)]" /> Provider Health (34 repos)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[600px] overflow-y-auto">
              {Object.values(health).map((p: any) => (
                <div key={p.id} className={`p-3 border rounded-xl ${statusColor(p.status)}`}>
                  <div className="flex justify-between font-bold">
                    <span>{p.name}</span>
                    <span className="uppercase">{p.status}</span>
                  </div>
                  <p className="mt-1 opacity-80">ID: {p.id} {p.vramRequiredGB ? `• ${p.vramRequiredGB}GB VRAM` : ''}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 bg-white border rounded-2xl space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-crm-warning-text" /> Quick Actions</h2>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border">
                <h3 className="font-bold text-sm">n8n Video Workflows</h3>
                <p className="text-xs text-[var(--alo-body)] mt-1">7 pre-built: lead→video, approval→publish, counseling pipeline, FAQ batch, etc.</p>
                <Button onClick={() => setActiveTab('automation')} className="mt-2 w-full text-xs bg-[var(--alo-brand)] text-white rounded-xl">View Workflows</Button>
              </div>
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border">
                <h3 className="font-bold text-sm">Remotion Templates</h3>
                <p className="text-xs text-[var(--alo-body)] mt-1">{compositions.length} templates: UniversityPromo, CourseExplainer, Testimonial, etc.</p>
                <Button onClick={() => setActiveTab('remotion')} className="mt-2 w-full text-xs bg-[var(--alo-success-dark)] text-white rounded-xl">Render Video</Button>
              </div>
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border">
                <h3 className="font-bold text-sm">AI Providers</h3>
                <p className="text-xs text-[var(--alo-body)] mt-1">LTX (fast, 12GB), CogVideo (18GB), Hunyuan (24GB, best quality), LongCat, Pixelle</p>
                <Button onClick={() => setActiveTab('ai')} className="mt-2 w-full text-xs bg-[var(--alo-brand)] text-white rounded-xl">Generate AI Video</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Remotion */}
      {activeTab === 'remotion' && (
        <Card className="p-6 bg-white border rounded-2xl space-y-6">
          <h2 className="text-base font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-[var(--alo-brand)]" /> Remotion — Programmatic Video with React (remotion-dev/remotion)</h2>
          <p className="text-xs text-[var(--alo-body)]">Create videos programmatically with React. Frame = React component. Real-time preview, SSR via Lambda, versioned templates. More controllable than direct AI video gen.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs font-bold">Composition</label>
              <select value={compositionId} onChange={e => setCompositionId(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm">
                {compositions.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.id}</option>)}
                <option value="UniversityPromo">UniversityPromo</option>
                <option value="CourseExplainer">CourseExplainer</option>
                <option value="Testimonial">Testimonial</option>
                <option value="ScholarshipAnnouncement">ScholarshipAnnouncement</option>
                <option value="VisaGuide">VisaGuide</option>
              </select>

              <label className="text-xs font-bold">Prompt / Title</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2.5 border rounded-xl text-sm" placeholder="University promo title..." />

              <Button onClick={() => handleRender('remotion')} disabled={rendering} className="w-full bg-[var(--alo-brand)] text-white rounded-xl">
                {rendering ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Render Remotion Video
              </Button>

              <Button onClick={() => handleRender('claude_video')} disabled={rendering} variant="outline" className="w-full text-xs rounded-xl">
                <Code className="w-4 h-4 mr-2" /> Generate via Claude-Video (LLM→Remotion Code)
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm">Compositions ({compositions.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {compositions.map((c: any) => (
                  <div key={c.id} className="p-3 bg-[var(--alo-page)] border rounded-xl text-xs">
                    <div className="font-bold">{c.name} <span className="text-[var(--alo-text-muted)]">({c.id})</span></div>
                    <div className="text-[var(--alo-body)] mt-1">{c.description?.slice(0, 120)}...</div>
                    <div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{c.width}x{c.height} • {c.durationInFrames} frames • {c.fps}fps • {c.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <Card className="p-4 bg-[var(--alo-page)] border rounded-xl text-xs">
              <h3 className="font-bold mb-2">Render Result</h3>
              <pre className="whitespace-pre-wrap overflow-auto max-h-[300px] bg-white p-3 rounded-xl border">{JSON.stringify(result, null, 2)}</pre>
            </Card>
          )}
        </Card>
      )}

      {/* AI Generation */}
      {activeTab === 'ai' && (
        <Card className="p-6 bg-white border rounded-2xl space-y-6">
          <h2 className="text-base font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--alo-brand)]" /> AI Video Generation (CogVideo, Hunyuan, LTX, LongCat, Pixelle, ComfyUI)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              { id: 'ltx', name: 'LTX-Video', desc: 'Fastest, 12GB, 45s, default', quality: '⭐⭐⭐', speed: '⭐⭐⭐⭐⭐', vram: '12GB' },
              { id: 'cogvideo', name: 'CogVideoX', desc: 'Long narrative, 5B/2B', quality: '⭐⭐⭐⭐', speed: '⭐⭐⭐', vram: '18GB' },
              { id: 'hunyuan', name: 'HunyuanVideo', desc: 'Best quality cinematic', quality: '⭐⭐⭐⭐⭐', speed: '⭐', vram: '24GB' },
              { id: 'longcat', name: 'LongCat-Video', desc: 'Long videos, minutes', quality: '⭐⭐⭐⭐', speed: '⭐⭐', vram: '20GB' },
              { id: 'pixelle', name: 'Pixelle-Video', desc: 'DiT research', quality: '⭐⭐⭐', speed: '⭐⭐⭐', vram: '16GB' },
              { id: 'comfyui', name: 'ComfyUI-VideoHelperSuite', desc: 'Node-based workflows', quality: '⭐⭐⭐⭐', speed: '⭐⭐⭐', vram: '12GB' },
            ].map(p => (
              <div key={p.id} className={`p-4 border rounded-xl cursor-pointer ${provider === p.id ? 'bg-[var(--alo-brand-pale)] border-[var(--alo-border)]' : 'bg-[var(--alo-page)]'}`} onClick={() => setProvider(p.id)}>
                <div className="font-bold">{p.name} <span className="text-[11px] px-1.5 py-0.5 bg-[var(--alo-page)] rounded">{p.vram}</span></div>
                <div className="text-[var(--alo-body)] mt-1">{p.desc}</div>
                <div className="mt-1">Quality: {p.quality} • Speed: {p.speed}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold">Prompt (education-optimized)</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2.5 border rounded-xl text-sm" />
            <Button onClick={() => handleRender('ai')} disabled={rendering} className="bg-[var(--alo-brand)] text-white rounded-xl">
              {rendering ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate with {provider}
            </Button>
          </div>

          {result && (
            <Card className="p-4 bg-[var(--alo-page)] border rounded-xl text-xs">
              <pre className="whitespace-pre-wrap overflow-auto max-h-[300px] bg-white p-3 rounded-xl border">{JSON.stringify(result, null, 2)}</pre>
            </Card>
          )}
        </Card>
      )}

      {/* Captioning */}
      {activeTab === 'caption' && (
        <Card className="p-6 bg-white border rounded-2xl space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Captions className="w-5 h-5 text-crm-success-text" /> VideoCaptioner — Whisper + LLM, 99 Languages (WEIFENG2333/VideoCaptioner)</h2>
          <p className="text-xs text-[var(--alo-body)]">Free & open-source AI subtitle tool: Whisper STT + LLM intelligent segmentation + translation + batch + VAD + speaker diarization. Supports SRT/ASS/VTT/TXT.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold">Video URL</label>
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://.../video.mp4 or /uploads/..." className="w-full p-2.5 border rounded-xl text-sm" />
              <Button onClick={() => handleRender('caption')} disabled={rendering} className="w-full bg-[var(--alo-success-dark)] text-white rounded-xl">
                {rendering ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Captions className="w-4 h-4 mr-2" />}
                Auto-Caption (99 langs)
              </Button>
            </div>
            <div className="p-4 bg-[var(--alo-page)] border rounded-xl text-xs space-y-2">
              <h3 className="font-bold">Features from VideoCaptioner</h3>
              <ul className="list-disc pl-4 space-y-1 text-[var(--alo-body)]">
                <li>Whisper local or API (free, fast)</li>
                <li>LLM smart segmentation (max 20 words)</li>
                <li>99-language translation</li>
                <li>VAD + speaker diarization</li>
                <li>Batch processing</li>
                <li>SRT/ASS/VTT/TXT export</li>
                <li>Style templates: news, documentary, etc.</li>
              </ul>
            </div>
          </div>

          {result && <Card className="p-4 bg-[var(--alo-page)] border rounded-xl text-xs"><pre className="whitespace-pre-wrap bg-white p-3 rounded-xl border max-h-[300px] overflow-auto">{JSON.stringify(result, null, 2)}</pre></Card>}
        </Card>
      )}

      {/* Registry */}
      {activeTab === 'registry' && (
        <Card className="p-6 bg-white border rounded-2xl space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Github className="w-5 h-5" /> 34 Repos Registry — Full Audit</h2>
          <p className="text-xs text-[var(--alo-body)]">All repos requested, with license, priority, integration status, and ALO use cases. See <code>docs/VIDEO_ECOSYSTEM_AUDIT.md</code> for detailed audit.</p>
          
          <div className="grid grid-cols-1 gap-3 max-h-[800px] overflow-y-auto">
            {registry.map((r) => (
              <div key={r.id} className="p-4 border rounded-xl bg-[var(--alo-page)] text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {r.name}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${r.integration.priority === 'P0' ? 'bg-crm-danger-bg text-crm-danger-text' : r.integration.priority === 'P1' ? 'bg-crm-warning-bg text-crm-warning-text' : 'bg-[var(--alo-page)] text-[var(--alo-body)]'}`}>{r.integration.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${r.integration.status === 'integrated' ? 'bg-crm-success-bg text-crm-success-text' : r.integration.status === 'adapter_ready' ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]' : 'bg-[var(--alo-page)]'}`}>{r.integration.status}</span>
                    </div>
                    <div className="mt-1 text-[var(--alo-body)]">{r.description.slice(0, 200)}...</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.aloUseCases.slice(0, 3).map((uc, i) => <span key={i} className="px-2 py-0.5 bg-white border rounded-full text-[11px]">{uc.slice(0, 60)}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <a href={r.url.replace('.git','')} target="_blank" className="px-3 py-1.5 bg-[var(--alo-brand)] text-white rounded-xl flex items-center gap-1.5 text-[11px] font-bold">
                      <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-[11px] text-[var(--alo-text-muted)] text-center">{r.license.slice(0, 20)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Other tabs placeholder */}
      {['talking','editing','automation','recording'].includes(activeTab) && (
        <Card className="p-12 bg-white border rounded-2xl text-center text-[var(--alo-text-muted)]">
          <div className="w-16 h-16 bg-[var(--alo-surface-muted)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            {activeTab === 'talking' && <Mic className="w-8 h-8" />}
            {activeTab === 'editing' && <Scissors className="w-8 h-8" />}
            {activeTab === 'automation' && <Zap className="w-8 h-8" />}
            {activeTab === 'recording' && <Monitor className="w-8 h-8" />}
          </div>
          <h3 className="font-bold text-[var(--alo-text)] capitalize">{activeTab} Module</h3>
          <p className="text-xs mt-2 max-w-md mx-auto">
            {activeTab === 'talking' && 'InfiniteTalk (MeiGen-AI/InfiniteTalk) + video-retalking (OpenTalker/video-retalking): AI counselor avatar, multilingual dubbing via lip-sync. Check /api/video-engine/talking-head'}
            {activeTab === 'editing' && 'Editing tools: video-subtitle-remover (YaoFANGUK), VideoSuperResolution (LoSealL), VideoAgent (HKUDS), VideoClaw (HITsz), openreel-video (Augani). Check /api/video-engine/edit'}
            {activeTab === 'automation' && 'Automation: youtube-dl (ytdl-org/youtube-dl), RedditVideoMakerBot (elebumm), claude-video (bradautomates), 9x VideoMaker, Telegram bot. Check /api/video-engine/automation + /api/video-engine/n8n'}
            {activeTab === 'recording' && 'Recording: VideoRecorder (qdrzwd/VideoRecorder) browser MediaRecorder + Jitsi Videobridge SFU (jitsi/jitsi-videobridge) for counseling calls. See src/lib/video-engine/recording/'}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => setActiveTab('overview')} variant="outline" className="text-xs rounded-xl">Back to Overview</Button>
            <Button onClick={fetchData} className=" bg-[var(--alo-brand)] text-white rounded-xl"><RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Health</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
