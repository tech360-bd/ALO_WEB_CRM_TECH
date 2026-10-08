# Licence Review

Licence values come from the GitHub REST API (`license.spdx_id`), except where a README states a different licence, which is noted. This is an engineering review, not legal advice.

## Rules applied

1. **Copyleft (AGPL-3.0, GPL, LGPL, ELv2): no code is copied into ALO.** Patterns and ideas are allowed. AGPL network-use clauses would apply to any hosted service ALO runs.
2. **No licence (NONE) or unclear (NOASSERTION): no code reuse.** The licence has to be confirmed first.
3. **MIT / Apache-2.0: code may be reused with its notice kept**, but only when a feature needs it and the dependency has been checked (see INTEGRATION-DECISIONS.md). No code has been copied in this audit.
4. **Trademarks and copyrighted assets** (logos, screenshots, illustrations, posters) are never copied.

## Per-reference licence

| Reference | Licence | Obligation if reused | Copy permitted? |
|---|---|---|---|
| omacom/omarchy | MIT | Keep notice | Not applicable |
| cathrynlavery/diagram-design | MIT | Keep notice | Patterns only (already applied) |
| cursor/plugins | NONE | None granted | **No** |
| AprilNEA/OpenLogi | Apache-2.0 | Keep notice + NOTICE file | Not applicable |
| volcengine/OpenViking | AGPL-3.0 | Source disclosure for network service | **No** (patterns only) |
| debpalash/VoiceStudio | AGPL-3.0 | Source disclosure for network service | **No** |
| akitaonrails/ai-memory | MIT | Keep notice | Patterns only |
| Lakr233/vphone-cli | MIT | Keep notice | Not applicable |
| public-apis/public-apis | MIT | Keep notice | Catalogue data only |
| harry0703/MoneyPrinterTurbo | MIT | Keep notice | Patterns only |
| blader/humanizer | MIT | Keep notice | Patterns only |
| heygen-com/hyperframes | Apache-2.0 | Keep notice + NOTICE file; patent grant | Evaluate |
| every-app/open-seo | MIT | Keep notice | Patterns only |
| ruvnet/ruflo | MIT | Keep notice | Not adopted |
| coreyhaines31/marketingskills | MIT | Keep notice | Patterns; copy only with notice |
| mksglu/context-mode | Elastic-2.0 (README; API: NOASSERTION) | No hosted/managed-service use; no licence-notice removal | **No** |
| fmtlib/fmt | MIT | Keep notice | Not applicable |
| affaan-m/ECC | MIT | Keep notice | Not applicable |
| alsk1992/CloddsBot | MIT | Keep notice | Out of scope |
| nashsu/llm_wiki | NOASSERTION | Unknown | **No** until confirmed |
| vastsa/PI-Desktop | LGPL-3.0 | Library linking terms | Not applicable |
| armory3d/armorpaint | NOASSERTION | Unknown | **No** |
| anthropics/claude-plugins-community | Apache-2.0 | Keep notice | Not adopted |
| Frappe CRM (candidate `frappe/crm`) | AGPL-3.0 | As AGPL | **No** (patterns only) |
| Firecrawl (`firecrawl/firecrawl`) | AGPL-3.0 | As AGPL | **No**; hosted API only if ever used |
| Firecrawl MCP server (`firecrawl/firecrawl-mcp-server`) | MIT | Keep notice | Not adopted |
| DeskcommCRM (candidate `melgarafael/DeskcommCRM`) | MIT (candidate) | Keep notice | Not adopted; unconfirmed |
| Django-CRM (candidate `Django-CRM/Django-CRM`) | MIT (candidate) | Keep notice | Not adopted; unconfirmed |
| Odoo (`odoo/odoo`) | NOASSERTION from API | Unknown | **No** |
| Crash Course CRM (candidates) | NONE | None granted | **No** |
| OroCRM | NONE (candidate) | None granted | **No** |
| ChurchCRM (`ChurchCRM/CRM`) | MIT (candidate) | Keep notice | Out of domain |
| TryCompAI (`trycompai/crm`) | MIT (candidate) | Keep notice | Unconfirmed |
| n8n | Not verified | Not verified | Already integrated; licence not re-checked here |

## Action items

- Confirm licences for every candidate before any code is reused.
- Before adopting any MIT/Apache-2.0 item, add its NOTICE/attribution to the repository.
- Remove or replace any NOASSERTION/NONE item from consideration unless the owner confirms its licence.
