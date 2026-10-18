/**
 * Free-tier AI provider catalog — ALO Education
 * =============================================
 *
 * A data-only registry of AI providers that offer a genuinely free tier and
 * speak the OpenAI-compatible `/v1/chat/completions` protocol. It exists so the
 * system can gain providers by adding a row here instead of editing the
 * `TextProvider` union and the `defaults` map in src/lib/ai.ts every time.
 *
 * HARD RULES
 * ----------
 * 1. NO SECRET VALUES LIVE IN THIS FILE. Each entry names the environment
 *    variable that holds the key (`apiKeyEnv`). The value is supplied by the
 *    operator at deploy time and is never committed, logged or returned by an
 *    API. `scripts/ci/scan-credentials.sh` scans this file.
 * 2. `PAID_AI_API_ALLOWED=false` is honoured by construction: every entry
 *    declares a `freeTier`, and providers whose only offering is paid are not
 *    listed at all. See EXCLUDED_PROVIDERS below for what was deliberately left
 *    out and why.
 * 3. `baseUrl` is only populated where the endpoint is well established. Where
 *    it is uncertain, it is `null` and the operator MUST supply
 *    `ALO_AI_<SLUG>_BASE_URL`. A guessed endpoint that silently 404s is worse
 *    than an explicit configuration error.
 *
 * NOTHING HERE IS VERIFIED AS REACHABLE. No outbound call to any of these hosts
 * was possible from the environment where this was written. Connectivity must be
 * proven by the onboarding test (POST /api/ai-providers/[slug]/test) with a real
 * key before a provider is trusted.
 */

/** How the "free" is granted. This distinction matters operationally. */
export type FreeTierKind =
  /** Recurring allowance that resets (per day/month). Safe to depend on. */
  | 'recurring'
  /** A one-time signup grant. It WILL run out; treat as temporary. */
  | 'one-time-credit'
  /** No key required at all. */
  | 'keyless';

/**
 * Provenance of the endpoint. Anything other than 'official' is off by default.
 *
 * 'unofficial-proxy' means a third party is reselling or reverse-proxying
 * someone else's model. Those almost always breach the upstream provider's
 * terms, can vanish without notice, and may log prompts. They are recorded so
 * the decision is explicit, not so they get used by accident.
 */
export type ProviderProvenance = 'official' | 'unofficial-proxy';

/**
 * The closed set of provider slugs. Declared as a const tuple so the type is a
 * real union, not `string`, which means a typo'd slug fails to compile rather
 * than failing at runtime in front of a user.
 *
 * `FREE_PROVIDERS` is typed against this union, so every entry's slug must appear
 * here. The reverse direction — a slug listed here with no entry — is caught by
 * tests/unit/ai-provider-catalog.test.ts.
 */
export const FREE_PROVIDER_SLUGS = [
  // Native adapters that already exist in src/lib/ai.ts
  'groq',
  'openrouter',
  'zai',
  // Catalogued OpenAI-compatible free tiers
  'gemini',
  'cerebras',
  'nvidia',
  'mistral',
  'cohere',
  'deepseek',
  'huggingface',
  'github-models',
  'sambanova',
  'together',
  'deepinfra',
  'siliconflow',
  'scaleway',
  'modelscope',
  'morph',
  'featherless',
  'friendliai',
  'arcee',
  'upstage',
  'qwen',
  'pollinations',
  // Recorded but blocked by default — unofficial third-party proxies
  'g4f-gemini',
  'g4f-groq',
  'g4f-nvidia',
  'g4f-pollinations',
  'g4f-ollama',
  'llm7',
] as const;

export type FreeProviderSlug = (typeof FREE_PROVIDER_SLUGS)[number];

export interface FreeProviderDefinition {
  slug: FreeProviderSlug;
  name: string;
  /** Env var holding the API key. Never the key itself. */
  apiKeyEnv: string;
  /** Env var that may override the base URL. Always honoured when set. */
  baseUrlEnv: string;
  /** Well-established default endpoint, or null when the operator must set one. */
  baseUrl: string | null;
  /** Default model, or null when the operator must choose. */
  defaultModel: string | null;
  freeTier: FreeTierKind;
  /** Human-readable statement of the free allowance, as published by the provider. */
  freeTierNote: string;
  provenance: ProviderProvenance;
  /** True when the provider works with no key at all. */
  keyOptional: boolean;
  /** Extra headers the endpoint requires (never credentials). */
  headers?: Record<string, string>;
  signupUrl?: string;
}

/**
 * Curated list. Ordered roughly by how dependable the free tier is.
 *
 * `groq`, `openrouter` and `zai` already have first-class adapters in
 * src/lib/ai.ts; they are listed here too so the catalog is the single place an
 * operator looks, but the router keeps using their native paths.
 */
export const FREE_PROVIDERS: readonly FreeProviderDefinition[] = [
  {
    slug: 'groq',
    name: 'Groq',
    apiKeyEnv: 'GROQ_API_KEY',
    baseUrlEnv: 'ALO_AI_GROQ_BASE_URL',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    freeTier: 'recurring',
    freeTierNote: 'Free tier ~30 RPM / 14.4K requests per day, no credit card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://console.groq.com/keys',
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrlEnv: 'ALO_AI_OPENROUTER_BASE_URL',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    freeTier: 'recurring',
    freeTierNote: 'Models suffixed ":free" cost $0/token; ~20 RPM / 200 requests per day.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://openrouter.ai/settings/keys',
  },
  {
    slug: 'gemini',
    name: 'Google Gemini (AI Studio)',
    apiKeyEnv: 'GEMINI_API_KEY',
    baseUrlEnv: 'ALO_AI_GEMINI_BASE_URL',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    freeTier: 'recurring',
    freeTierNote: 'Free tier ~1,500 requests/day on Flash models, no credit card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://aistudio.google.com/apikey',
  },
  {
    slug: 'cerebras',
    name: 'Cerebras',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    baseUrlEnv: 'ALO_AI_CEREBRAS_BASE_URL',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    freeTier: 'recurring',
    freeTierNote: 'Free trial ~1M tokens/day, 30K TPM, 5 RPM, no credit card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://cloud.cerebras.ai/',
  },
  {
    slug: 'nvidia',
    name: 'NVIDIA NIM',
    apiKeyEnv: 'NVIDIA_API_KEY',
    baseUrlEnv: 'ALO_AI_NVIDIA_BASE_URL',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free developer access ~40 RPM across 70+ models.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://build.nvidia.com/',
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    apiKeyEnv: 'MISTRAL_API_KEY',
    baseUrlEnv: 'ALO_AI_MISTRAL_BASE_URL',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free "Experiment" tier: rate-limited access to all models, no card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://console.mistral.ai/api-keys',
  },
  {
    slug: 'cohere',
    name: 'Cohere',
    apiKeyEnv: 'COHERE_API_KEY',
    baseUrlEnv: 'ALO_AI_COHERE_BASE_URL',
    baseUrl: 'https://api.cohere.com/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Trial: ~1,000 API calls/month for testing, no credit card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://dashboard.cohere.com/api-keys',
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseUrlEnv: 'ALO_AI_DEEPSEEK_BASE_URL',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    freeTier: 'one-time-credit',
    freeTierNote: 'One-time grant of ~5M tokens on signup. It will run out.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    slug: 'huggingface',
    name: 'Hugging Face Inference',
    apiKeyEnv: 'HUGGINGFACE_API_KEY',
    baseUrlEnv: 'ALO_AI_HUGGINGFACE_BASE_URL',
    baseUrl: 'https://router.huggingface.co/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free Inference Providers tier for thousands of models.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://huggingface.co/settings/tokens',
  },
  {
    slug: 'github-models',
    name: 'GitHub Models',
    apiKeyEnv: 'GITHUB_TOKEN',
    baseUrlEnv: 'ALO_AI_GITHUB_MODELS_BASE_URL',
    baseUrl: 'https://models.inference.ai.azure.com',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free with a GitHub PAT carrying the "models: read" scope.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://github.com/settings/tokens',
  },
  {
    slug: 'sambanova',
    name: 'SambaNova',
    apiKeyEnv: 'SAMBANOVA_API_KEY',
    baseUrlEnv: 'ALO_AI_SAMBANOVA_BASE_URL',
    baseUrl: 'https://api.sambanova.ai/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$5 free credits on signup, 30-day validity, no credit card.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'together',
    name: 'Together AI',
    apiKeyEnv: 'TOGETHER_API_KEY',
    baseUrlEnv: 'ALO_AI_TOGETHER_BASE_URL',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: 'Free signup credits for API testing.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'deepinfra',
    name: 'DeepInfra',
    apiKeyEnv: 'DEEPINFRA_API_KEY',
    baseUrlEnv: 'ALO_AI_DEEPINFRA_BASE_URL',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: 'Free signup credits for testing and exploration.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'siliconflow',
    name: 'SiliconFlow',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrlEnv: 'ALO_AI_SILICONFLOW_BASE_URL',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: '$1 credit plus permanently free models after identity verification.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'scaleway',
    name: 'Scaleway AI',
    apiKeyEnv: 'SCALEWAY_API_KEY',
    baseUrlEnv: 'ALO_AI_SCALEWAY_BASE_URL',
    baseUrl: 'https://api.scaleway.ai/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '~1M free tokens for new accounts. EU/Paris hosting.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'modelscope',
    name: 'ModelScope',
    apiKeyEnv: 'MODELSCOPE_API_KEY',
    baseUrlEnv: 'ALO_AI_MODELSCOPE_BASE_URL',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free API-Inference tier; Alibaba account required.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'morph',
    name: 'Morph',
    apiKeyEnv: 'MORPH_API_KEY',
    baseUrlEnv: 'ALO_AI_MORPH_BASE_URL',
    baseUrl: 'https://api.morphllm.com/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier ~250K credits/month at $0.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'featherless',
    name: 'Featherless AI',
    apiKeyEnv: 'FEATHERLESS_API_KEY',
    baseUrlEnv: 'ALO_AI_FEATHERLESS_BASE_URL',
    baseUrl: 'https://api.featherless.ai/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier available, no credit card required.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'friendliai',
    name: 'FriendliAI',
    apiKeyEnv: 'FRIENDLIAI_API_KEY',
    baseUrlEnv: 'ALO_AI_FRIENDLIAI_BASE_URL',
    baseUrl: 'https://inference.friendli.ai/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier for serverless inference, no credit card.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'arcee',
    name: 'Arcee AI',
    apiKeyEnv: 'ARCEE_API_KEY',
    baseUrlEnv: 'ALO_AI_ARCEE_BASE_URL',
    baseUrl: 'https://api.arcee.ai/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier on signup.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'upstage',
    name: 'Upstage',
    apiKeyEnv: 'UPSTAGE_API_KEY',
    baseUrlEnv: 'ALO_AI_UPSTAGE_BASE_URL',
    baseUrl: 'https://api.upstage.ai/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier for Document Parse and Solar models.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'qwen',
    name: 'Qwen Cloud (Alibaba Model Studio)',
    apiKeyEnv: 'QWEN_API_KEY',
    baseUrlEnv: 'ALO_AI_QWEN_BASE_URL',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: 'Free token grant on new accounts; verify current terms.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'zai',
    name: 'Z.AI (GLM)',
    apiKeyEnv: 'ZAI_API_KEY',
    baseUrlEnv: 'ALO_AI_ZAI_BASE_URL',
    baseUrl: null, // Uses the official SDK adapter in src/lib/ai.ts, not a raw URL.
    defaultModel: 'glm-4-flash',
    freeTier: 'recurring',
    freeTierNote: 'Free GLM tier via the official SDK.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  {
    slug: 'pollinations',
    name: 'Pollinations AI',
    apiKeyEnv: 'POLLINATIONS_API_KEY',
    baseUrlEnv: 'ALO_AI_POLLINATIONS_BASE_URL',
    baseUrl: 'https://text.pollinations.ai/openai',
    defaultModel: 'openai',
    freeTier: 'keyless',
    freeTierNote: 'Keyless free tier for a set of open models; premium models need a key.',
    provenance: 'official',
    keyOptional: true,
  },
  // ── Recorded but OFF by default. Do not enable without a deliberate decision.
  {
    slug: 'g4f-gemini',
    name: 'g4f.space Gemini proxy',
    apiKeyEnv: 'G4F_GEMINI_API_KEY',
    baseUrlEnv: 'ALO_AI_G4F_GEMINI_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Unofficial keyless reverse proxy to Gemini, ~5 requests/minute.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'g4f-groq',
    name: 'g4f.space Groq proxy',
    apiKeyEnv: 'G4F_GROQ_API_KEY',
    baseUrlEnv: 'ALO_AI_G4F_GROQ_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Unofficial keyless reverse proxy to Groq, ~5 requests/minute.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'g4f-nvidia',
    name: 'g4f.space NVIDIA proxy',
    apiKeyEnv: 'G4F_NVIDIA_API_KEY',
    baseUrlEnv: 'ALO_AI_G4F_NVIDIA_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Unofficial keyless reverse proxy to NVIDIA NIM, ~5 requests/minute.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'g4f-pollinations',
    name: 'g4f.space Pollinations proxy',
    apiKeyEnv: 'G4F_POLLINATIONS_API_KEY',
    baseUrlEnv: 'ALO_AI_G4F_POLLINATIONS_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Unofficial keyless reverse proxy to Pollinations, ~5 requests/minute.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'g4f-ollama',
    name: 'g4f.space hosted Ollama',
    apiKeyEnv: 'G4F_OLLAMA_API_KEY',
    baseUrlEnv: 'ALO_AI_G4F_OLLAMA_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Unofficial keyless hosted Ollama gateway, ~5 requests/minute.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'llm7',
    name: 'LLM7.io',
    apiKeyEnv: 'LLM7_API_KEY',
    baseUrlEnv: 'ALO_AI_LLM7_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Works without a key; a free token raises the limits.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
];

export function getProviderDefinition(slug: string): FreeProviderDefinition | undefined {
  return FREE_PROVIDERS.find((p) => p.slug === slug);
}

/** Type guard narrowing an arbitrary string to a catalogued slug. */
export function isFreeProviderSlug(value: string): value is FreeProviderSlug {
  return (FREE_PROVIDER_SLUGS as readonly string[]).includes(value);
}

/**
 * Providers deliberately NOT catalogued, with the reason.
 *
 * This list exists because the operator supplied a much longer provider list and
 * asked for "only free model". Several entries on that list cannot be added
 * without breaking either the letter or the spirit of the project's own rules,
 * and silently dropping them would hide a decision the owner should make.
 */
export const EXCLUDED_PROVIDERS: ReadonlyArray<{ slug: string; reason: string }> = [
  {
    slug: 'suno',
    reason:
      'Onboards by pasting a browser session cookie. The project rules forbid handling stolen or pasted tokens, cookies or sessions, and cookie auth bypasses the provider API terms. Use an official music API or the local music workflow instead.',
  },
  {
    slug: 'udio',
    reason: 'Same as suno: session-cookie authentication, not an API key. Excluded by the credential-handling rules.',
  },
  {
    slug: 'freeaiapikey',
    reason:
      'A discounted resale proxy for GPT-5 / Claude models. Reselling another provider\'s models breaches upstream terms and gives no control over data handling. Not a free tier.',
  },
  {
    slug: 'uncloseai',
    reason:
      'Accepts any non-empty string as a key, so there is no way to attribute usage, enforce a quota, or know who operates it. Unverifiable provenance.',
  },
  {
    slug: 'ai-ml-api (aimlapi)',
    reason: 'Free tier was discontinued; the service is now pay-as-you-go with a $20 minimum. Excluded by PAID_AI_API_ALLOWED=false.',
  },
  {
    slug: 'openai / anthropic / gemini-paid / heygen / elevenlabs / runway / midjourney',
    reason:
      'Paid-only or paid-by-default. Named explicitly in the Payment Guard blocklist. Owner approval required before any of these is added.',
  },
];
