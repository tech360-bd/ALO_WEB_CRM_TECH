# Environment configuration

Full source-reference inventory: `docs/PRODUCTION_ENVIRONMENT_MATRIX.md`. `.env.example` is a template, not verified hosting configuration. `.env.production.example` is retained as a synchronized legacy template. Do not commit runtime `.env` files.

| Variable/category | Where to obtain value | Where to enter it | Secret |
|---|---|---|---|
| DATABASE_URL | Provider MySQL connection settings; URL-encode credentials | Managed Node environment | Yes |
| NEXTAUTH_SECRET | Secure random generator; retain across restarts | Managed Node environment | Yes |
| NEXTAUTH_URL, APP_URL, NEXT_PUBLIC_APP_URL | Approved HTTPS application origin | Hosting; public variables also at build time | No |
| ENCRYPTION_KEY / HRMS_ENCRYPTION_KEY | Existing encryption-key custody; never casually rotate encrypted data keys | Hosting secret store | Yes |
| FILE_SIGN_SECRET | Secure random key >=32 characters | Hosting secret store | Yes |
| ALO_CRON_SECRET / legacy CRON_SECRET | Secure random >=32 characters; same scheduled client/server value | Hosting and private scheduled-command config | Yes |
| STORAGE_POOL_C | Approved persistent private path outside public/release directories | Hosting environment | No, internal path |
| GROQ_API_KEY / OPENROUTER_API_KEY / ZAI_API_KEY | Selected approved provider account | Hosting secret store | Yes |
| LOCAL_AI_URL / LOCAL_AI_MODEL / optional LOCAL_AI_API_KEY | Approved reachable private model deployment | Hosting environment/secret store | Key is secret |
| SMTP_HOST / SMTP_USER / SMTP_PASSWORD | Selected mail provider | Hosting secret store | Credentials are secret |
| WhatsApp/Meta/social/OAuth/other services | Corresponding provider's official app settings | Hosting secret store or existing encrypted integration settings, according to consumer | Tokens/secrets yes |

Email-service transport is incomplete; SMTP configuration alone does not make it operational. MAIL_* template values are not substitutes for SMTP_* consumers. Optional service credentials are conditional, not startup requirements for every module. No paid provider substitution is authorized.

Runtime PORT/HOSTNAME come from managed hosting when needed. NODE_ENV=production, TZ=Asia/Dhaka. Never expose a secret with NEXT_PUBLIC_; those values can be embedded in browser bundles. Do not configure development demo passwords/seeding in production. AUTH_SECRET/JWT_SECRET/SESSION_SECRET appear in legacy templates; source consumers and selected auth mechanisms, not a generic checklist, determine their necessity.

Secret scan is heuristic, not proof of absence. Historical database-credential candidates require rotation verification. GitHub secret-list access denied (403); host values remain NOT VERIFIED.
