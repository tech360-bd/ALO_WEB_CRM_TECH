# LIVE_DEPLOYMENT_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Live Deployment Verification Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Post-deployment verification checklist. Confirms every URL, security control, integration, cron, backup, and admin function is working in production. Each item must be marked PASS or FAIL before declaring the deployment live. |

---

## How to use this template

1. Run this report AFTER completing all 27 steps in `CPANEL_DEPLOYMENT_GUIDE.md`.
2. For each row, run the verification command (or perform the manual check).
3. Mark the result as **PASS** or **FAIL** in the right column.
4. If any row is FAIL, do NOT declare production live — investigate, fix, and re-run.
5. Save the completed report as `storage/logs/deployment-report-YYYYMMDD.md` for audit.

---

## 1. URL verification — page routes

For each URL, `curl -sI <url> | head -1` should return `HTTP/2 200`.

| # | URL | Expected | Result |
|---|---|---|---|
| 1 | `https://alaminn.info` | 200 | ☐ PASS ☐ FAIL |
| 2 | `https://alaminn.info/about` | 200 | ☐ PASS ☐ FAIL |
| 3 | `https://alaminn.info/contact` | 200 | ☐ PASS ☐ FAIL |
| 4 | `https://alaminn.info/expertise` | 200 | ☐ PASS ☐ FAIL |
| 5 | `https://alaminn.info/impact` | 200 | ☐ PASS ☐ FAIL |
| 6 | `https://alaminn.info/media` | 200 | ☐ PASS ☐ FAIL |
| 7 | `https://alaminn.info/articles` | 200 | ☐ PASS ☐ FAIL |
| 8 | `https://alaminn.info/articles/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 9 | `https://alaminn.info/case-studies` | 200 | ☐ PASS ☐ FAIL |
| 10 | `https://alaminn.info/case-studies/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 11 | `https://alaminn.info/projects` | 200 | ☐ PASS ☐ FAIL |
| 12 | `https://alaminn.info/projects/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 13 | `https://alaminn.info/ecosystem` | 200 | ☐ PASS ☐ FAIL |
| 14 | `https://alaminn.info/ecosystem/alo-education` | 200 | ☐ PASS ☐ FAIL |
| 15 | `https://alaminn.info/ecosystem/alo-labs` | 200 | ☐ PASS ☐ FAIL |
| 16 | `https://alaminn.info/ecosystem/tech360` | 200 | ☐ PASS ☐ FAIL |

### Higher Study routes

| # | URL | Expected | Result |
|---|---|---|---|
| 17 | `https://alaminn.info/higher-study` | 200 | ☐ PASS ☐ FAIL |
| 18 | `https://alaminn.info/higher-study/universities` | 200 | ☐ PASS ☐ FAIL |
| 19 | `https://alaminn.info/higher-study/universities/university-of-oxford` | 200 | ☐ PASS ☐ FAIL |
| 20 | `https://alaminn.info/higher-study/universities/university-of-oxford/courses` | 200 | ☐ PASS ☐ FAIL |
| 21 | `https://alaminn.info/higher-study/universities/university-of-oxford/research` | 200 | ☐ PASS ☐ FAIL |
| 22 | `https://alaminn.info/higher-study/universities/university-of-oxford/scholarships` | 200 | ☐ PASS ☐ FAIL |
| 23 | `https://alaminn.info/higher-study/universities/uk` | 200 | ☐ PASS ☐ FAIL |
| 24 | `https://alaminn.info/higher-study/uk-universities` | 200 | ☐ PASS ☐ FAIL |
| 25 | `https://alaminn.info/higher-study/global-universities` | 200 | ☐ PASS ☐ FAIL |
| 26 | `https://alaminn.info/higher-study/courses` | 200 | ☐ PASS ☐ FAIL |
| 27 | `https://alaminn.info/higher-study/courses/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 28 | `https://alaminn.info/higher-study/scholarships` | 200 | ☐ PASS ☐ FAIL |
| 29 | `https://alaminn.info/higher-study/scholarships/chevening-scholarship` | 200 | ☐ PASS ☐ FAIL |
| 30 | `https://alaminn.info/higher-study/phd-research` | 200 | ☐ PASS ☐ FAIL |
| 31 | `https://alaminn.info/higher-study/research` | 200 | ☐ PASS ☐ FAIL |
| 32 | `https://alaminn.info/higher-study/research/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 33 | `https://alaminn.info/higher-study/supervisors` | 200 | ☐ PASS ☐ FAIL |
| 34 | `https://alaminn.info/higher-study/supervisors/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 35 | `https://alaminn.info/higher-study/subjects` | 200 | ☐ PASS ☐ FAIL |
| 36 | `https://alaminn.info/higher-study/subjects/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 37 | `https://alaminn.info/higher-study/intakes` | 200 | ☐ PASS ☐ FAIL |
| 38 | `https://alaminn.info/higher-study/intakes/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 39 | `https://alaminn.info/higher-study/destinations` | 200 | ☐ PASS ☐ FAIL |
| 40 | `https://alaminn.info/higher-study/destinations/uk` | 200 | ☐ PASS ☐ FAIL |
| 41 | `https://alaminn.info/higher-study/destinations/uk/london` | 200 | ☐ PASS ☐ FAIL |
| 42 | `https://alaminn.info/higher-study/study-resources` | 200 | ☐ PASS ☐ FAIL |
| 43 | `https://alaminn.info/higher-study/resources` | 200 | ☐ PASS ☐ FAIL |
| 44 | `https://alaminn.info/higher-study/resources/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 45 | `https://alaminn.info/higher-study/saved` | 200 | ☐ PASS ☐ FAIL |
| 46 | `https://alaminn.info/higher-study/compare` | 200 | ☐ PASS ☐ FAIL |
| 47 | `https://alaminn.info/higher-study/compare/courses` | 200 | ☐ PASS ☐ FAIL |
| 48 | `https://alaminn.info/higher-study/compare/universities` | 200 | ☐ PASS ☐ FAIL |
| 49 | `https://alaminn.info/higher-study/compare/scholarships` | 200 | ☐ PASS ☐ FAIL |
| 50 | `https://alaminn.info/higher-study/eligibility-check` | 200 | ☐ PASS ☐ FAIL |
| 51 | `https://alaminn.info/higher-study/application-guide` | 200 | ☐ PASS ☐ FAIL |
| 52 | `https://alaminn.info/higher-study/book-consultation` | 200 | ☐ PASS ☐ FAIL |
| 53 | `https://alaminn.info/higher-study/apply` | 200 | ☐ PASS ☐ FAIL |
| 54 | `https://alaminn.info/higher-study/course-finder` | 200 | ☐ PASS ☐ FAIL |

### English Learning routes

| # | URL | Expected | Result |
|---|---|---|---|
| 55 | `https://alaminn.info/english-learning` | 200 | ☐ PASS ☐ FAIL |
| 56 | `https://alaminn.info/english-learning/courses` | 200 | ☐ PASS ☐ FAIL |
| 57 | `https://alaminn.info/english-learning/courses/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 58 | `https://alaminn.info/english-learning/practice-tests` | 200 | ☐ PASS ☐ FAIL |
| 59 | `https://alaminn.info/english-learning/practice-tests/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 60 | `https://alaminn.info/english-learning/tutors` | 200 | ☐ PASS ☐ FAIL |
| 61 | `https://alaminn.info/english-learning/tutors/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 62 | `https://alaminn.info/english-learning/resources` | 200 | ☐ PASS ☐ FAIL |
| 63 | `https://alaminn.info/english-learning/resources/<sample-slug>` | 200 | ☐ PASS ☐ FAIL |
| 64 | `https://alaminn.info/english-learning/progress` | 200 | ☐ PASS ☐ FAIL |
| 65 | `https://alaminn.info/english-learning/eligibility-check` | 200 | ☐ PASS ☐ FAIL |
| 66 | `https://alaminn.info/english-learning/book-consultation` | 200 | ☐ PASS ☐ FAIL |
| 67 | `https://alaminn.info/english-learning/book-tutor` | 200 | ☐ PASS ☐ FAIL |
| 68 | `https://alaminn.info/english-learning/apply` | 200 | ☐ PASS ☐ FAIL |

### Admin routes

| # | URL | Expected | Result |
|---|---|---|---|
| 69 | `https://alaminn.info/admin/login` | 200 | ☐ PASS ☐ FAIL |
| 70 | `https://alaminn.info/admin` (not logged in) | 302 → /admin/login | ☐ PASS ☐ FAIL |
| 71 | `https://alaminn.info/admin` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 72 | `https://alaminn.info/admin/contacts` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 73 | `https://alaminn.info/admin/articles` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 74 | `https://alaminn.info/admin/projects` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 75 | `https://alaminn.info/admin/users` (logged in as SUPER_ADMIN) | 200 | ☐ PASS ☐ FAIL |
| 76 | `https://alaminn.info/admin/audit-logs` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 77 | `https://alaminn.info/admin/settings` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 78 | `https://alaminn.info/admin/seo` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 79 | `https://alaminn.info/admin/analytics` (logged in) | 200 | ☐ PASS ☐ FAIL |
| 80 | `https://alaminn.info/admin/notifications` (logged in) | 200 | ☐ PASS ☐ FAIL |

---

## 2. API verification

| # | URL | Expected | Result |
|---|---|---|---|
| 81 | `GET https://alaminn.info/api/health` | 200 + `{"status":"ok"}` | ☐ PASS ☐ FAIL |
| 82 | `GET https://alaminn.info/api/readiness` | 200 + `{"ready":true}` | ☐ PASS ☐ FAIL |
| 83 | `GET https://alaminn.info/api/health/deep` (no auth) | 401 | ☐ PASS ☐ FAIL |
| 84 | `GET https://alaminn.info/api/v1/higher-study/universities` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 85 | `GET https://alaminn.info/api/v1/higher-study/scholarships` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 86 | `GET https://alaminn.info/api/v1/higher-study/courses` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 87 | `GET https://alaminn.info/api/v1/english-learning/courses` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 88 | `GET https://alaminn.info/api/v1/english-learning/tutors` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 89 | `GET https://alaminn.info/api/v1/public/articles` | 200 + JSON array | ☐ PASS ☐ FAIL |
| 90 | `GET https://alaminn.info/api/v1/public/projects` | 200 + JSON array | ☐ PASS ☐ FAIL |

---

## 3. SSL / HTTPS verification

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 91 | SSL cert valid | `echo \| openssl s_client -connect alaminn.info:443 -servername alaminn.info 2>/dev/null \| openssl x509 -noout -dates` | `notBefore` in past, `notAfter` in future | ☐ PASS ☐ FAIL |
| 92 | HTTP → HTTPS redirect | `curl -sI http://alaminn.info \| head -1` | `HTTP/1.1 301 Moved Permanently` | ☐ PASS ☐ FAIL |
| 93 | HSTS header present | `curl -sI https://alaminn.info \| grep -i strict-transport` | `max-age=63072000; includeSubDomains; preload` | ☐ PASS ☐ FAIL |
| 94 | CSP header present | `curl -sI https://alaminn.info \| grep -i content-security` | `default-src 'self'; ...` | ☐ PASS ☐ FAIL |
| 95 | X-Frame-Options header | `curl -sI https://alaminn.info \| grep -i x-frame` | `DENY` | ☐ PASS ☐ FAIL |
| 96 | X-Content-Type-Options header | `curl -sI https://alaminn.info \| grep -i x-content-type` | `nosniff` | ☐ PASS ☐ FAIL |

---

## 4. Navbar + mobile menu check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 97 | Desktop navbar renders | Visit `https://alaminn.info` on desktop | Logo + nav links (Home, Higher Study, English Learning, About, Contact, Ecosystem) visible | ☐ PASS ☐ FAIL |
| 98 | Mobile menu button visible | Resize to < 768px width | Hamburger icon visible in top-right | ☐ PASS ☐ FAIL |
| 99 | Mobile menu opens | Click hamburger | Slide-out menu with all nav links | ☐ PASS ☐ FAIL |
| 100 | Mobile menu closes | Click X or outside | Menu closes; main content visible | ☐ PASS ☐ FAIL |
| 101 | Footer renders | Scroll to bottom | Footer with copyright, social links, sitemap link | ☐ PASS ☐ FAIL |

---

## 5. Database connection check

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 102 | `/api/health` reports DB OK | `curl -s https://alaminn.info/api/health \| python3 -m json.tool` | `{"status":"ok", "db": "connected", ...}` or similar | ☐ PASS ☐ FAIL |
| 103 | DB has 55 tables | `mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "SHOW TABLES;" \| wc -l` | `56` (55 tables + 1 header) | ☐ PASS ☐ FAIL |
| 104 | Admin user exists | `mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "SELECT email, role FROM User WHERE email='admin@alaminn.info';"` | 1 row, role=SUPER_ADMIN | ☐ PASS ☐ FAIL |
| 105 | Higher Study data exists | `mysql ... -e "SELECT COUNT(*) FROM HigherStudyUniversity;"` | ≥ 20 | ☐ PASS ☐ FAIL |
| 106 | English Learning data exists | `mysql ... -e "SELECT COUNT(*) FROM EnglishLearningCourse;"` | ≥ 12 | ☐ PASS ☐ FAIL |

---

## 6. Search / filter / form checks

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 107 | Higher Study university search | Visit `/higher-study/universities`, type in search box | List filters in real-time | ☐ PASS ☐ FAIL |
| 108 | Higher Study course filter by level | Visit `/higher-study/courses`, select "Masters" | Only masters courses shown | ☐ PASS ☐ FAIL |
| 109 | Higher Study scholarship filter by country | Visit `/higher-study/scholarships`, select "UK" | Only UK scholarships shown | ☐ PASS ☐ FAIL |
| 110 | Higher Study compare flow | Visit `/higher-study/compare`, add 2-3 universities | Comparison table renders | ☐ PASS ☐ FAIL |
| 111 | Higher Study saved items | Visit `/higher-study/saved`, save an item | Item appears in saved list | ☐ PASS ☐ FAIL |
| 112 | English Learning course filter | Visit `/english-learning/courses`, select "IELTS" | Only IELTS courses shown | ☐ PASS ☐ FAIL |
| 113 | Contact form submission | Submit `/contact` form with valid data | 200 response + acknowledgement email received | ☐ PASS ☐ FAIL |
| 114 | Newsletter signup | Submit newsletter form | 200 response + double-opt-in email received | ☐ PASS ☐ FAIL |
| 115 | Inquiry form with validation | Submit `/contact` with missing required field | 400 error with field-level message | ☐ PASS ☐ FAIL |

---

## 7. CRM referral check (Higher Study → ALO Education)

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 116 | Create referral via API | `curl -s -X POST https://alaminn.info/api/v1/higher-study/referral -H "Content-Type: application/json" -d '{"referralType":"course-application","universitySlug":"university-of-oxford","courseSlug":"msc-computer-science","consentGiven":true,"consentVersion":"v1.0"}'` | `{"success":true,"data":{"referralCode":"...","targetUrl":"https://...","referralId":"..."}}` | ☐ PASS ☐ FAIL |
| 117 | Referral targetUrl has NO PII | Inspect the `targetUrl` from #116 | Only slugs + referralCode + referralToken in query string (NO email, phone, name) | ☐ PASS ☐ FAIL |
| 118 | Referral DB row created | `mysql ... -e "SELECT status, expiresAt, createdAt FROM HigherStudyReferral ORDER BY createdAt DESC LIMIT 1;"` | status=created, expiresAt=now+24h | ☐ PASS ☐ FAIL |
| 119 | Referral rejection (no consent) | `curl -s -X POST .../referral -d '{"referralType":"course-application","consentGiven":false}'` | 400 with "consentGiven must be true" | ☐ PASS ☐ FAIL |
| 120 | Referral PII guard | `curl -s -X POST .../referral -d '{"referralType":"course-application","consentGiven":true,"context":{"email":"test@test.com"}}'` | 400 with "Referral context contains forbidden PII field" | ☐ PASS ☐ FAIL |

---

## 8. ALO Education transfer check (browser flow)

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 121 | "Apply Now" button visible | Visit `/higher-study/universities/university-of-oxford` | Apply Now button on at least one course | ☐ PASS ☐ FAIL |
| 122 | Transfer notice shows | Click Apply Now | Modal/page: "You will be redirected to ALO Education..." | ☐ PASS ☐ FAIL |
| 123 | Consent checkbox required | Try to continue without ticking | Continue button disabled or form rejects | ☐ PASS ☐ FAIL |
| 124 | Redirect lands on ALO Education | Tick consent + click Continue | Browser navigates to ALO Education domain with referralCode + token in URL | ☐ PASS ☐ FAIL |
| 125 | No PII in URL | Inspect the URL after redirect | Only slugs + referralCode + referralToken (NO email, phone, name) | ☐ PASS ☐ FAIL |

---

## 9. English Learning link check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 126 | English Learning referral via API | `curl -s -X POST https://alaminn.info/api/v1/english-learning/referral -H "Content-Type: application/json" -d '{"referralType":"course-package","courseSlug":"ielts-preparation","consentGiven":true,"consentVersion":"v1.0"}'` | `{"success":true,"data":{"referralCode":"...","targetUrl":"https://..."}}` | ☐ PASS ☐ FAIL |
| 127 | Referral targetUrl points to English platform | Inspect `targetUrl` from #126 | URL is on the `ENGLISH_PLATFORM_URL` domain | ☐ PASS ☐ FAIL |
| 128 | Referral DB row created | `mysql ... -e "SELECT status, createdAt FROM EnglishLearningReferral ORDER BY createdAt DESC LIMIT 1;"` | status=created | ☐ PASS ☐ FAIL |
| 129 | Browser "Apply" link works | Visit `/english-learning/courses/<slug>`, click Apply | Modal/notice + redirect to English platform | ☐ PASS ☐ FAIL |

---

## 10. Admin access check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 130 | Admin login works | Visit `/admin/login`, enter ADMIN_EMAIL + ADMIN_PASSWORD | Redirects to `/admin` (dashboard) | ☐ PASS ☐ FAIL |
| 131 | Dashboard shows stats | Visit `/admin` after login | Cards/panels with inquiry count, opportunity count, etc. | ☐ PASS ☐ FAIL |
| 132 | Contacts list loads | Visit `/admin/contacts` | Table of contacts from DB | ☐ PASS ☐ FAIL |
| 133 | Audit log records login | `mysql ... -e "SELECT action, createdAt FROM AuditLog WHERE action='login' ORDER BY createdAt DESC LIMIT 1;"` | Recent entry with action=login | ☐ PASS ☐ FAIL |
| 134 | Admin can create article | Visit `/admin/articles`, click New, fill, save | Article appears in list | ☐ PASS ☐ FAIL |
| 135 | Admin can update settings | Visit `/admin/settings`, change a value, save | Change persists | ☐ PASS ☐ FAIL |

---

## 11. Unauthorized access check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 136 | `/admin` without login redirects | `curl -sI https://alaminn.info/admin \| head -1` | `302` (redirect to /admin/login) | ☐ PASS ☐ FAIL |
| 137 | `/api/v1/admin/contacts` without session | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/api/v1/admin/contacts` | `401` | ☐ PASS ☐ FAIL |
| 138 | `/api/health/deep` without session | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/api/health/deep` | `401` | ☐ PASS ☐ FAIL |
| 139 | `VIEWER` cannot delete contacts | Login as VIEWER, attempt DELETE `/api/v1/admin/contacts/<id>` | `403` | ☐ PASS ☐ FAIL |
| 140 | Cron endpoint without secret | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/api/cron/scholarship-deadlines` | `401` | ☐ PASS ☐ FAIL |
| 141 | Cron endpoint with wrong secret | `curl -s -o /dev/null -w "%{http_code}" -H "x-cron-secret: wrong" https://alaminn.info/api/cron/scholarship-deadlines` | `401` | ☐ PASS ☐ FAIL |

---

## 12. Static asset check

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 142 | CSS loads | `curl -sI https://alaminn.info/_next/static/css/<chunk>.css \| head -1` | `200` | ☐ PASS ☐ FAIL |
| 143 | JS chunk loads | `curl -sI https://alaminn.info/_next/static/chunks/main.js \| head -1` | `200` | ☐ PASS ☐ FAIL |
| 144 | Favicon loads | `curl -sI https://alaminn.info/favicon.ico \| head -1` | `200` | ☐ PASS ☐ FAIL |
| 145 | Robots.txt loads | `curl -sI https://alaminn.info/robots.txt \| head -1` | `200` | ☐ PASS ☐ FAIL |
| 146 | Image loads | `curl -sI https://alaminn.info/images/hero.jpg \| head -1` | `200` | ☐ PASS ☐ FAIL |
| 147 | Source map blocked | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/_next/static/chunks/main.js.map` | `403` or `404` | ☐ PASS ☐ FAIL |
| 148 | `.env` blocked | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/.env` | `403` | ☐ PASS ☐ FAIL |
| 149 | `package.json` blocked | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/package.json` | `403` | ☐ PASS ☐ FAIL |
| 150 | `prisma/` blocked | `curl -s -o /dev/null -w "%{http_code}" https://alaminn.info/prisma/schema.prisma` | `403` | ☐ PASS ☐ FAIL |

---

## 13. Email check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 151 | Inquiry acknowledgement email | Submit `/contact` form with a real email | Acknowledgement email received within 60s | ☐ PASS ☐ FAIL |
| 152 | Newsletter double-opt-in email | Sign up for newsletter | Verification email received within 60s | ☐ PASS ☐ FAIL |
| 153 | Email lands in inbox (not spam) | Check inbox AND spam folder | Email in inbox (not spam) | ☐ PASS ☐ FAIL |
| 154 | SPF record set | `dig +short TXT alaminn.info` | `v=spf1 ...` | ☐ PASS ☐ FAIL |
| 155 | DKIM record set | `dig +short TXT default._domainkey.alaminn.info` | `v=DKIM1; k=rsa; p=...` | ☐ PASS ☐ FAIL |
| 156 | DMARC record set | `dig +short TXT _dmarc.alaminn.info` | `v=DMARC1; p=quarantine; ...` | ☐ PASS ☐ FAIL |
| 157 | Mail-tester score ≥ 7 | Send email to a mail-tester.com address | Score ≥ 7/10 | ☐ PASS ☐ FAIL |

---

## 14. Cron check

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 158 | Scholarship-deadlines cron works | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/scholarship-deadlines` | `{"status":"ok","job":"scholarship-deadlines",...}` | ☐ PASS ☐ FAIL |
| 159 | Email-queue cron works | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/email-queue` | `{"status":"ok","job":"email-queue",...}` | ☐ PASS ☐ FAIL |
| 160 | Health-monitor cron works | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/health-monitor` | `{"status":"ok","job":"health-monitor",...}` | ☐ PASS ☐ FAIL |
| 161 | All 11 cron jobs configured in cPanel | cPanel → Advanced → Cron Jobs | 11 rows present with correct schedules | ☐ PASS ☐ FAIL |
| 162 | Cron jobs actually running | Wait 5 min, check `~/logs/alaminn.log` for cron entries | Log shows recent cron hits | ☐ PASS ☐ FAIL |

---

## 15. Backup check

| # | Check | Command | Expected | Result |
|---|---|---|---|---|
| 163 | Backup script runs | `cd ~/alaminn.info && bash scripts/backup.sh` | `Backup completed: ...` | ☐ PASS ☐ FAIL |
| 164 | Backup file created | `ls -lh storage/backups/` | `.sql.gz` + `.sha256` files present | ☐ PASS ☐ FAIL |
| 165 | Backup is non-trivial size | `ls -lh storage/backups/*.sql.gz` | ≥ 500 KB | ☐ PASS ☐ FAIL |
| 166 | Backup verifies | `bash scripts/verify-backup.sh` | All 5 checks PASS | ☐ PASS ☐ FAIL |
| 167 | Daily backup cron configured | cPanel → Cron Jobs | `0 2 * * * ... scripts/backup.sh ...` row exists | ☐ PASS ☐ FAIL |
| 168 | Pre-restore backup test passed | (Performed in maintenance window per `ROLLBACK_GUIDE.md`) | Restore completed and verified | ☐ PASS ☐ FAIL |

---

## 16. Health monitoring check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 169 | UptimeRobot monitor configured | Log in to UptimeRobot | Monitor "Alaminn.info — Health" exists | ☐ PASS ☐ FAIL |
| 170 | UptimeRobot shows "Up" | UptimeRobot dashboard | Status = Up | ☐ PASS ☐ FAIL |
| 171 | Alert contact configured | UptimeRobot → Alert Contacts | At least 1 email/Slack contact | ☐ PASS ☐ FAIL |
| 172 | Local health cron (optional) | `crontab -l \| grep health` | `*/5 * * * * curl -fsS ... /api/health` row exists | ☐ PASS ☐ FAIL |

---

## 17. Rollback capability check

| # | Check | How to verify | Expected | Result |
|---|---|---|---|---|
| 173 | Pre-deploy backup exists | `ls -lh ~/alaminn.info.predeploy.*.tgz` | At least one tar file | ☐ PASS ☐ FAIL |
| 174 | Pre-deploy DB snapshot exists | `ls -lh storage/backups/*.sql.gz` | At least one .sql.gz file | ☐ PASS ☐ FAIL |
| 175 | Backup verification passed | `bash scripts/verify-backup.sh` | All 5 checks PASS | ☐ PASS ☐ FAIL |
| 176 | `.next/standalone.bak` exists (post-deploy) | `ls -ld .next/standalone.bak` | Directory exists | ☐ PASS ☐ FAIL |
| 177 | Restore script executable | `ls -l scripts/restore.sh` | `-rwxr-xr-x` | ☐ PASS ☐ FAIL |

---

## Final sign-off

| Field | Value |
|---|---|
| All 177 checks PASS? | ☐ YES — production is LIVE ☐ NO — investigate failures |
| Deploy date / time | ____________________________ |
| Deployed by | ____________________________ |
| Reviewed by | ____________________________ |
| Notes | ____________________________ |

---

## Reference

- **Total checks**: 177
- **Required to declare production live**: ALL 177 must PASS
- **Failure handling**: investigate, fix, re-run the failed check; do NOT mark PASS until the check actually passes
- **Audit retention**: save completed reports in `storage/logs/deployment-report-YYYYMMDD.md` indefinitely
- **Re-run cadence**: every deploy, every quarterly review, after any major incident
