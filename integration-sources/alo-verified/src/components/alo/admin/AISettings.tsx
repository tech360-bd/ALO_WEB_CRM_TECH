'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Key, Cpu, Shield, DollarSign, Zap, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, Save, Globe, Server } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsData {
  [key: string]: string | null
}

const PROVIDERS = [
  { key: 'openrouter', name: 'OpenRouter', description: 'Multi-model gateway with GPT-4, Claude, Llama, etc.', icon: '🌐' },
  { key: 'gemini', name: 'Google Gemini', description: 'Google Gemini Pro & Ultra models', icon: '✨' },
  { key: 'groq', name: 'Groq', description: 'Ultra-fast inference for Llama & Mixtral', icon: '⚡' },
  { key: 'ollama', name: 'Ollama', description: 'Local model hosting (Llama, Mistral, etc.)', icon: '🖥️' },
]

const MODELS = [
  { value: 'gpt-4', label: 'GPT-4', provider: 'openrouter' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openrouter' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openrouter' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'openrouter' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'openrouter' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'gemini' },
  { value: 'gemini-ultra', label: 'Gemini Ultra', provider: 'gemini' },
  { value: 'llama3-70b', label: 'Llama 3 70B', provider: 'groq' },
  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B', provider: 'groq' },
  { value: 'llama3-local', label: 'Llama 3 (Local)', provider: 'ollama' },
  { value: 'mistral-local', label: 'Mistral (Local)', provider: 'ollama' },
]

export default function AISettings() {
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null)

  // Form state
  const [providerKeys, setProviderKeys] = useState({
    openrouter: '',
    gemini: '',
    groq: '',
    ollama: '',
  })
  const [defaultModel, setDefaultModel] = useState('gpt-4')
  const [fallbackChain, setFallbackChain] = useState('gpt-4,gpt-3.5-turbo,claude-3-sonnet')
  const [tokenLimit, setTokenLimit] = useState('4096')
  const [rateLimitPerMin, setRateLimitPerMin] = useState('60')
  const [rateLimitPerDay, setRateLimitPerDay] = useState('1000')
  const [costTracking, setCostTracking] = useState(true)
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings?group=ai')
      if (res.ok) {
        const data = await res.json()
        const s = data.settings || {}
        setSettings(s)

        // Populate form
        if (s['ai_openrouter_key']) setProviderKeys(prev => ({ ...prev, openrouter: '••••••••' }))
        if (s['ai_gemini_key']) setProviderKeys(prev => ({ ...prev, gemini: '••••••••' }))
        if (s['ai_groq_key']) setProviderKeys(prev => ({ ...prev, groq: '••••••••' }))
        if (s['ai_ollama_key']) setProviderKeys(prev => ({ ...prev, ollama: '••••••••' }))
        if (s['ai_default_model']) setDefaultModel(s['ai_default_model'])
        if (s['ai_fallback_chain']) setFallbackChain(s['ai_fallback_chain'])
        if (s['ai_token_limit']) setTokenLimit(s['ai_token_limit'])
        if (s['ai_rate_limit_per_min']) setRateLimitPerMin(s['ai_rate_limit_per_min'])
        if (s['ai_rate_limit_per_day']) setRateLimitPerDay(s['ai_rate_limit_per_day'])
        if (s['ai_cost_tracking']) setCostTracking(s['ai_cost_tracking'] === 'true')
        if (s['ai_ollama_endpoint']) setOllamaEndpoint(s['ai_ollama_endpoint'])
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const saveSettings = async () => {
    try {
      setSaving(true)
      const updates: Record<string, string | null> = {
        ai_default_model: defaultModel,
        ai_fallback_chain: fallbackChain,
        ai_token_limit: tokenLimit,
        ai_rate_limit_per_min: rateLimitPerMin,
        ai_rate_limit_per_day: rateLimitPerDay,
        ai_cost_tracking: costTracking.toString(),
        ai_ollama_endpoint: ollamaEndpoint,
      }

      // Only update keys if they were changed (not the masked placeholder)
      if (providerKeys.openrouter && providerKeys.openrouter !== '••••••••') {
        updates['ai_openrouter_key'] = providerKeys.openrouter
      }
      if (providerKeys.gemini && providerKeys.gemini !== '••••••••') {
        updates['ai_gemini_key'] = providerKeys.gemini
      }
      if (providerKeys.groq && providerKeys.groq !== '••••••••') {
        updates['ai_groq_key'] = providerKeys.groq
      }
      if (providerKeys.ollama && providerKeys.ollama !== '••••••••') {
        updates['ai_ollama_key'] = providerKeys.ollama
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates, group: 'ai' }),
      })

      if (res.ok) {
        toast.success('AI settings saved successfully')
        fetchSettings()
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (provider: string) => {
    try {
      setTesting(provider)
      setTestResult(null)
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'test_connection',
          agentType: defaultModel.includes('gpt') ? 'openrouter' : provider,
          inputText: `Test connection from ${provider}. Reply with "Connection successful" only.`,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTestResult({ provider, success: true, message: `Connected successfully. Response time: ${data.executionTime}ms` })
        toast.success(`${provider} connection test passed`)
      } else {
        setTestResult({ provider, success: false, message: 'Connection failed - check API key' })
        toast.error(`${provider} connection test failed`)
      }
    } catch {
      setTestResult({ provider, success: false, message: 'Connection error' })
      toast.error(`${provider} connection test failed`)
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#F37021]" />
            AI Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure AI providers, models, and limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Reload
          </Button>
          <Button className="bg-[#F37021] hover:bg-[#e0631a] gap-2" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <Card className={`border-l-4 ${testResult.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {testResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <div>
              <p className="font-medium text-sm">{testResult.provider}: {testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
              <p className="text-xs text-muted-foreground">{testResult.message}</p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTestResult(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="providers">
        <TabsList className="flex-wrap">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="limits">Limits & Rate</TabsTrigger>
          <TabsTrigger value="cost">Cost Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDERS.map(provider => (
              <Card key={provider.key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <p>{provider.name}</p>
                      <p className="text-xs text-muted-foreground font-normal">{provider.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Key className="w-3 h-3" /> API Key
                    </label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={providerKeys[provider.key as keyof typeof providerKeys]}
                        onChange={e => setProviderKeys(prev => ({ ...prev, [provider.key]: e.target.value }))}
                        placeholder={`Enter ${provider.name} API key...`}
                        className="pr-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings[`ai_${provider.key}_key`] ? 'Key is configured' : 'No key configured'}
                    </p>
                  </div>

                  {provider.key === 'ollama' && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Server className="w-3 h-3" /> Endpoint
                      </label>
                      <Input
                        value={ollamaEndpoint}
                        onChange={e => setOllamaEndpoint(e.target.value)}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => testConnection(provider.key)}
                    disabled={testing === provider.key}
                  >
                    {testing === provider.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {testing === provider.key ? 'Testing...' : `Test Connection`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#F37021]" />
                Default Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The default model used when no specific model is specified for an agent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0066CC]" />
                Fallback Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={fallbackChain}
                onChange={e => setFallbackChain(e.target.value)}
                placeholder="gpt-4,gpt-3.5-turbo,claude-3-sonnet"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Comma-separated list of models to try if the primary model fails. First model is tried first.
                </p>
                <div className="flex flex-wrap gap-1">
                  {fallbackChain.split(',').filter(Boolean).map((model, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {model.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                Model-to-Agent Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Override the default model for specific agents. Configure in individual agent settings.
              </p>
              <div className="space-y-2">
                {[
                  { agent: 'Boss Agent', recommended: 'gpt-4o', reason: 'Complex orchestration' },
                  { agent: 'Research Agent', recommended: 'gpt-4o', reason: 'Detailed analysis' },
                  { agent: 'WhatsApp Assistant', recommended: 'gpt-3.5-turbo', reason: 'Fast responses needed' },
                  { agent: 'Lead Scorer', recommended: 'gpt-3.5-turbo', reason: 'Simple scoring logic' },
                  { agent: 'Blog Generator', recommended: 'gpt-4', reason: 'Quality content needed' },
                ].map(item => (
                  <div key={item.agent} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm">{item.agent}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.recommended}</Badge>
                      <span className="text-xs text-muted-foreground">{item.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F37021]" />
                Token Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Max Tokens per Request</label>
                <Input type="number" value={tokenLimit} onChange={e => setTokenLimit(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Maximum tokens for AI responses (default: 4096)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Requests per Minute</label>
                  <Input type="number" value={rateLimitPerMin} onChange={e => setRateLimitPerMin(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Requests per Day</label>
                  <Input type="number" value={rateLimitPerDay} onChange={e => setRateLimitPerDay(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate limits help prevent API abuse and control costs. Requests beyond the limit will be queued.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Cost Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Cost Tracking</p>
                  <p className="text-xs text-muted-foreground">Track API costs per agent, model, and time period</p>
                </div>
                <Switch checked={costTracking} onCheckedChange={setCostTracking} />
              </div>

              <Separator />

              {costTracking && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Estimated Cost per 1K Tokens</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { model: 'GPT-4', input: '$0.03', output: '$0.06' },
                      { model: 'GPT-4o', input: '$0.005', output: '$0.015' },
                      { model: 'GPT-3.5 Turbo', input: '$0.0005', output: '$0.0015' },
                      { model: 'Claude 3 Sonnet', input: '$0.003', output: '$0.015' },
                      { model: 'Claude 3 Opus', input: '$0.015', output: '$0.075' },
                      { model: 'Gemini Pro', input: '$0.00025', output: '$0.0005' },
                      { model: 'Llama 3 (Groq)', input: '$0.00059', output: '$0.00079' },
                      { model: 'Llama 3 (Ollama)', input: 'Free', output: 'Free' },
                    ].map(item => (
                      <div key={item.model} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                        <span className="font-medium">{item.model}</span>
                        <span className="text-muted-foreground">In: {item.input} / Out: {item.output}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
