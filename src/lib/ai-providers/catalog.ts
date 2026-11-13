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
 * 2. No advertised "free tier" is assumed to prevent overage billing. All
 *    cloud inference is disabled unless the owner explicitly sets
 *    `PAID_AI_API_ALLOWED=true` after reviewing the account, model and limits.
 *    `freeTier` describes a claim, not a billing guarantee.
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
  // Free one-time signup credits (they exhaust — see freeTier on each entry)
  'ai21',
  'agentrouter',
  'baseten',
  'fireworks',
  'freemodel-dev',
  'hyperbolic',
  'inference-net',
  'longcat',
  'nebius',
  'novita',
  'nscale',
  'openvecta',
  'pioneer',
  // Recurring free allowances
  'blackbox',
  'bluesminds',
  'bytez',
  'internlm',
  'nara',
  'hackclub',
  'puter',
  'sealion',
  // Recorded but blocked by default — unofficial third-party proxies
  'g4f-gemini',
  'g4f-groq',
  'g4f-nvidia',
  'g4f-pollinations',
  'g4f-ollama',
  'llm7',
  'bazaarlink',
  'dahl',
  'freetheai',
  'gitlawb',
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
  // ── Free one-time signup credits. These DO run out; they are catalogued so
  //    the operator can use them knowingly, not as a durable production tier.
  {
    slug: 'ai21',
    name: 'AI21 Labs',
    apiKeyEnv: 'AI21_API_KEY',
    baseUrlEnv: 'ALO_AI_AI21_BASE_URL',
    baseUrl: 'https://api.ai21.com/studio/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$10 trial credits on signup, valid 3 months, no credit card.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://studio.ai21.com/',
  },
  {
    slug: 'agentrouter',
    name: 'AgentRouter',
    apiKeyEnv: 'AGENTROUTER_API_KEY',
    baseUrlEnv: 'ALO_AI_AGENTROUTER_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$200 free credits on signup, no credit card required.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://agentrouter.org/register',
  },
  {
    slug: 'baseten',
    name: 'Baseten',
    apiKeyEnv: 'BASETEN_API_KEY',
    baseUrlEnv: 'ALO_AI_BASETEN_BASE_URL',
    baseUrl: 'https://api.baseten.co/openai/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$30 free trial credits for GPU inference.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://app.baseten.co/',
  },
  {
    slug: 'fireworks',
    name: 'Fireworks AI',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    baseUrlEnv: 'ALO_AI_FIREWORKS_BASE_URL',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$1 free starter credits on signup for API testing.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://fireworks.ai/',
  },
  {
    slug: 'freemodel-dev',
    name: 'FreeModel.dev',
    apiKeyEnv: 'FREEMODEL_API_KEY',
    baseUrlEnv: 'ALO_AI_FREEMODEL_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$300 free API credits, no payment info required. OpenAI-compatible.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://freemodel.dev',
  },
  {
    slug: 'hyperbolic',
    name: 'Hyperbolic',
    apiKeyEnv: 'HYPERBOLIC_API_KEY',
    baseUrlEnv: 'ALO_AI_HYPERBOLIC_BASE_URL',
    baseUrl: 'https://api.hyperbolic.xyz/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$1-5 trial credits on signup for serverless inference.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://hyperbolic.xyz/',
  },
  {
    slug: 'inference-net',
    name: 'Inference.net',
    apiKeyEnv: 'INFERENCE_NET_API_KEY',
    baseUrlEnv: 'ALO_AI_INFERENCE_NET_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$25 free credits on signup, plus research grants.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://inference.net/',
  },
  {
    slug: 'longcat',
    name: 'LongCat AI',
    apiKeyEnv: 'LONGCAT_API_KEY',
    baseUrlEnv: 'ALO_AI_LONGCAT_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote:
      'One-time 10M-token grant after signup plus KYC verification. Explicitly not a recurring allowance.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'nebius',
    name: 'Nebius AI',
    apiKeyEnv: 'NEBIUS_API_KEY',
    baseUrlEnv: 'ALO_AI_NEBIUS_BASE_URL',
    baseUrl: 'https://api.nebius.ai/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '~$1 trial credits on signup for API testing.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://nebius.ai/',
  },
  {
    slug: 'novita',
    name: 'Novita AI',
    apiKeyEnv: 'NOVITA_API_KEY',
    baseUrlEnv: 'ALO_AI_NOVITA_BASE_URL',
    baseUrl: 'https://api.novita.ai/v3/openai',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$0.50 trial credits on signup, valid about 1 year.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://novita.ai/',
  },
  {
    slug: 'nscale',
    name: 'nScale',
    apiKeyEnv: 'NSCALE_API_KEY',
    baseUrlEnv: 'ALO_AI_NSCALE_BASE_URL',
    baseUrl: 'https://api.nscale.com/v1',
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$5 free credits on signup for inference testing.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://nscale.com/',
  },
  {
    slug: 'openvecta',
    name: 'OpenVecta',
    apiKeyEnv: 'OPENVECTA_API_KEY',
    baseUrlEnv: 'ALO_AI_OPENVECTA_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: 'Free credits on signup for OpenAI-compatible inference.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'pioneer',
    name: 'Pioneer AI',
    apiKeyEnv: 'PIONEER_API_KEY',
    baseUrlEnv: 'ALO_AI_PIONEER_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'one-time-credit',
    freeTierNote: '$75 free usage credits, no credit card required.',
    provenance: 'official',
    keyOptional: false,
  },
  // ── Recurring free allowances
  {
    slug: 'blackbox',
    name: 'Blackbox AI',
    apiKeyEnv: 'BLACKBOX_API_KEY',
    baseUrlEnv: 'ALO_AI_BLACKBOX_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free tier: unlimited basic chat plus Minimax-M2.5, no credit card.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'bluesminds',
    name: 'BluesMinds',
    apiKeyEnv: 'BLUESMINDS_API_KEY',
    baseUrlEnv: 'ALO_AI_BLUESMINDS_BASE_URL',
    baseUrl: 'https://api.bluesminds.com/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote:
      'Free daily credits. Note: VIP models consume paid pi credits, so pin free models only.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://www.bluesminds.com',
  },
  {
    slug: 'bytez',
    name: 'Bytez',
    apiKeyEnv: 'BYTEZ_API_KEY',
    baseUrlEnv: 'ALO_AI_BYTEZ_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: '$1 free credits that refresh every 4 weeks.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://bytez.com/',
  },
  {
    slug: 'internlm',
    name: 'InternLM (Intern-S1)',
    apiKeyEnv: 'INTERNLM_API_KEY',
    baseUrlEnv: 'ALO_AI_INTERNLM_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free monthly quota ~1M input / 3M output tokens at ~10 RPM.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'nara',
    name: 'NaraRouter',
    apiKeyEnv: 'NARA_API_KEY',
    baseUrlEnv: 'ALO_AI_NARA_BASE_URL',
    baseUrl: 'https://router.bynara.id/v1',
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote:
      'Free-tier models are pinned; other models require credit. Select only free models.',
    provenance: 'official',
    keyOptional: false,
  },
  {
    slug: 'hackclub',
    name: 'Hack Club AI',
    apiKeyEnv: 'HACKCLUB_API_KEY',
    baseUrlEnv: 'ALO_AI_HACKCLUB_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Sign in with a Hack Club account; API key optional.',
    provenance: 'official',
    keyOptional: true,
    signupUrl: 'https://ai.hackclub.com',
  },
  {
    slug: 'puter',
    name: 'Puter AI',
    apiKeyEnv: 'PUTER_API_KEY',
    baseUrlEnv: 'ALO_AI_PUTER_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Free auth token from the Puter dashboard.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://puter.com/dashboard',
  },
  {
    slug: 'sealion',
    name: 'SEA-LION (AI Singapore)',
    apiKeyEnv: 'SEALION_API_KEY',
    baseUrlEnv: 'ALO_AI_SEALION_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'recurring',
    freeTierNote: 'Sign in with Google — no card and no region wall. API key from the console.',
    provenance: 'official',
    keyOptional: false,
    signupUrl: 'https://sea-lion.ai',
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
  {
    slug: 'bazaarlink',
    name: 'BazaarLink',
    apiKeyEnv: 'BAZAARLINK_API_KEY',
    baseUrlEnv: 'ALO_AI_BAZAARLINK_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote:
      'Free key; the model "auto:free" routes to zero-cost inference. Third-party router of unknown upstream provenance.',
    provenance: 'unofficial-proxy',
    keyOptional: false,
  },
  {
    slug: 'dahl',
    name: 'Dahl',
    apiKeyEnv: 'DAHL_API_KEY',
    baseUrlEnv: 'ALO_AI_DAHL_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote:
      'Token is auto-generated by the gateway rather than issued by a model provider, so usage cannot be attributed.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'freetheai',
    name: 'FreeTheAi',
    apiKeyEnv: 'FREETHEAI_API_KEY',
    baseUrlEnv: 'ALO_AI_FREETHEAI_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Free OpenAI-compatible gateway with passthrough models; operator and data handling unknown.',
    provenance: 'unofficial-proxy',
    keyOptional: true,
  },
  {
    slug: 'gitlawb',
    name: 'Gitlawb Opengateway',
    apiKeyEnv: 'GITLAWB_API_KEY',
    baseUrlEnv: 'ALO_AI_GITLAWB_BASE_URL',
    baseUrl: null,
    defaultModel: null,
    freeTier: 'keyless',
    freeTierNote: 'Third-party opengateway fronting MiMo / GMI Cloud models.',
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
 * PROVENANCE OF THE FREE-TIER CLAIMS — read before trusting any `freeTierNote`.
 *
 * Every `freeTier` and `freeTierNote` value in this file was transcribed from an
 * owner-supplied provider list (the OmniRoute catalog, 2026-10-18). NONE of them
 * has been checked against the provider's own documentation, and none could be:
 * outbound requests to provider hosts are blocked from the build environment.
 *
 * This matters because free tiers change without notice. AI/ML API is already in
 * EXCLUDED_PROVIDERS for exactly this reason — its free tier was discontinued and
 * the service became pay-as-you-go. The same can happen to any entry here.
 *
 * Consequences, enforced in src/lib/ai-providers/resolve.ts:
 *   - `listProviderStatus()` reports freeTierVerified=false for every entry, so a
 *     UI can never present these allowances as confirmed.
 *   - A provider is only trusted after POST /api/ai-providers/[slug]/verify
 *     succeeds with a real key, which is empirical evidence rather than a claim.
 *   - `freeTier: 'one-time-credit'` entries are never selected for implicit
 *     routing, because a grant that silently expires must not become a
 *     production dependency.
 *
 * When a tier IS verified against official documentation, record the date and the
 * URL in VERIFIED_FREE_TIERS below — do not just flip a boolean.
 */
export const FREE_TIER_CLAIMS_SOURCE = 'owner-supplied provider list, 2026-10-18 — not verified against official documentation';

/**
 * Tiers confirmed against the provider's own documentation.
 * Empty on purpose: nothing has been verified yet. Add entries as
 * `{ slug, verifiedOn: 'YYYY-MM-DD', source: '<official docs URL>' }`.
 */
export const VERIFIED_FREE_TIERS: ReadonlyArray<{ slug: FreeProviderSlug; verifiedOn: string; source: string }> = [];

export function isFreeTierVerified(slug: string): boolean {
  return VERIFIED_FREE_TIERS.some((entry) => entry.slug === slug);
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
