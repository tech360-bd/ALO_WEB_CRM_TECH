# Integration Decisions

Constraints checked before any dependency is added: Next 16.4.0, React 19, Node 22, Prisma 6, MySQL (`mysql2`), and Hostinger hosting (Node 22; no VPS, no SSH deploy). A reference's use is not a reason to add a dependency.

**Dependencies added in this audit: none.**

| Reference / capability | Decision | Reason |
|---|---|---|
| HyperFrames (Apache-2.0) as a video renderer | EVALUATE, not added | Needs a headless browser renderer. Hostinger shared Node cannot run that. Would have to sit behind the video provider boundary on separate infrastructure. Remotion is already in use (`remotion`, `@remotion/lambda`, `@remotion/player`) |
| MoneyPrinterTurbo (MIT) | NOT ADOPTED | Python stack, GPU/TTS/stock-footage requirements. Conflicts with Hostinger Node hosting. Keep as a provider reference only |
| open-seo (MIT) + DataForSEO | NOT ADOPTED | Requires a paid third-party API key. Needs explicit user approval for budget and data-provider terms |
| Firecrawl (AGPL-3.0) | NOT ADOPTED | AGPL. Use only as a hosted API, after a legal and budget decision |
| humanizer (MIT, Python) | PATTERN ONLY | Python. Rule list can be re-implemented in TypeScript if needed |
| ai-memory (MIT), OpenViking (AGPL) | PATTERN ONLY | AGPL cannot be copied. Existing `ai-workforce/memory.ts` is kept |
| public-apis (MIT) | CATALOGUE ONLY | Each external API needs a licence, rate-limit, and data-use review before any integration |
| n8n | ALREADY INTEGRATED | `src/lib/video-engine/n8n/`, `N8nWorkflowsView.tsx`. Licence not re-checked here |
| Frappe CRM, Odoo, Twenty, Django-CRM | NOT ADOPTED | Full ERP/CRM platforms, not components. Licences are AGPL or unconfirmed. Patterns only |
| context-mode (ELv2) | NOT ADOPTED | Licence forbids managed/hosted use |
| Remotion licence | FLAG | HyperFrames' README describes the Remotion licence as source-available. ALO uses Remotion, so the licence terms should be confirmed for commercial use |

## Rules for future integrations

1. Check Node 22 / Hostinger compatibility first. Python or GPU-only dependencies go behind a provider boundary, with no hard dependency in the Hostinger build.
2. Check the licence (see LICENSES.md) and record the decision here.
3. Keep secrets in environment variables, never in committed files.
4. No mock "200 OK" responses for an unconfigured integration. Return an explicit "not configured" state.
