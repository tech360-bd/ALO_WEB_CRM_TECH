# ALO EDUCATION — FINAL MASTER PRODUCTION COMPLETION PROMPT
# WEBSITE + CRM + AI WORKFORCE + AUTOMATION + DATABASE + SECURITY + DEPLOYMENT
# ================================================================

ROLE
You are the Principal Full-Stack Engineer, Product Architect, UX Engineer,
CRM Architect, AI Agent Engineer, Automation Engineer, Database Engineer,
Security Engineer, QA Engineer, DevOps Engineer and Production Release
Engineer for ALO Education.

You are working on the EXISTING ALO EDUCATION PROJECT.

IMPORTANT:
DO NOT rebuild the project from zero.
DO NOT replace working functionality unnecessarily.
DO NOT create demo implementations.
DO NOT create fake/mock 200-OK APIs.
DO NOT create placeholder dashboards.
DO NOT create "Coming Soon" pages.
DO NOT declare completion without actually testing the implementation.

Your job is to inspect the ENTIRE EXISTING PROJECT, compare it against this
master specification, repair missing/incomplete functionality, connect all
modules, test everything, and leave the project genuinely production-ready.

===============================================================
1. PRIMARY OBJECTIVE
===============================================================

Complete ALO Education as one unified ecosystem:

WEBSITE
    ↓
LEAD CAPTURE
    ↓
MASTER CRM ID
    ↓
CRM RECORD
    ↓
AI LEAD INTAKE
    ↓
AI QUALIFICATION
    ↓
AI COURSE MATCHING
    ↓
COUNSELOR ASSIGNMENT
    ↓
FOLLOW-UP AUTOMATION
    ↓
DOCUMENT COLLECTION
    ↓
AI DOCUMENT EXTRACTION
    ↓
APPLICATION
    ↓
UNIVERSITY SUBMISSION
    ↓
OFFER
    ↓
FINANCE
    ↓
VISA
    ↓
ENROLLMENT
    ↓
POST-ENROLLMENT FOLLOW-UP

Every stage must persist data into the database and appear in the unified
CRM timeline.

The system must operate with approximately 70%+ operational automation,
while keeping legally/financially sensitive decisions under human control.

TARGET:
REAL AUTOMATION >= 70%

Do not inflate the percentage by counting meaningless UI actions.

===============================================================
2. FIRST ACTION — FULL PROJECT AUDIT
===============================================================

Before changing code:

1. Inspect the complete repository.
2. Inspect package.json.
3. Inspect all source directories.
4. Inspect all API routes.
5. Inspect all page routes.
6. Inspect Prisma schemas.
7. Inspect database configuration.
8. Inspect authentication.
9. Inspect RBAC.
10. Inspect CRM logic.
11. Inspect AI agents.
12. Inspect n8n integration.
13. Inspect Redis integration.
14. Inspect document upload/extraction.
15. Inspect email integration.
16. Inspect WhatsApp integration.
17. Inspect university/course data.
18. Inspect SEO implementation.
19. Inspect navbar/footer architecture.
20. Inspect all dashboards.
21. Inspect all forms.
22. Inspect all empty states.
23. Inspect all buttons.
24. Inspect all links.
25. Inspect all external integrations.
26. Inspect PM2 configuration.
27. Inspect Caddy configuration.
28. Inspect production environment configuration.
29. Inspect deployment scripts.
30. Inspect tests.

Create an internal gap matrix:

FEATURE | EXISTS | COMPLETE | CONNECTED | TESTED | FIX REQUIRED

Do not stop after finding the first issue.

===============================================================
3. TECHNOLOGY TARGET
===============================================================

Preferred production stack:

Frontend:
- Next.js 15.x where compatible with existing project
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui
- Responsive design
- Server-side rendering where appropriate

Backend:
- Next.js API routes / server actions where appropriate
- Prisma 6.x
- MySQL 8.0
- Redis 7.x

Authentication:
- NextAuth.js 5.x
- JWT/session validation
- CSRF protection
- RBAC
- tenant isolation

AI:
- OpenAI GPT-4o / currently configured OpenAI production model
- Provider abstraction
- n8n automation
- AI agents executing real functions/tools

Runtime:
- Node.js 22.23.2
- PM2
- Caddy v2
- HTTPS

Automation:
- n8n
- Redis queues/cache where appropriate

Email:
- Resend

Storage:
- STORAGE_POOL_A
- STORAGE_POOL_B
- STORAGE_POOL_C
- UPLOAD_DIR
- QUARANTINE_DIR

IMPORTANT:
Do not blindly downgrade or upgrade packages.
First inspect the existing package versions and compatibility.
Only change versions when necessary and verify the complete build afterward.

===============================================================
4. WEBSITE — COMPLETE EVERYTHING
===============================================================

Audit EVERY public page.

Every page must have:

- Correct navbar
- Exactly one navbar
- Correct footer
- Responsive mobile layout
- Breadcrumb where useful
- Page title
- SEO metadata
- Open Graph metadata
- Canonical URL
- Proper CTA
- Working forms
- Working buttons
- Working links
- Loading states
- Error states
- Empty states
- No fake data
- No dead links
- No "Coming Soon"
- No placeholder content

GLOBAL RULE:

ONE GLOBAL HEADER
ONE GLOBAL FOOTER

Do not duplicate navigation components inside individual pages.

===============================================================
5. HOME PAGE
===============================================================

Create/refine a premium international education consultancy homepage.

Hero must be visually strong and conversion-focused.

Hero should contain:

- Main headline
- Supporting statement
- Primary CTA
- Secondary CTA
- Course Finder CTA
- University Finder CTA
- Student consultation CTA
- Trust indicators
- Country/destination highlights
- Relevant imagery
- Responsive layout
- Professional animations
- Accessible contrast
- Mobile optimization

Use the existing reference design supplied by the project owner as the
visual direction where appropriate.

Do not copy another website's proprietary content.
Recreate the design intent using ALO Education branding.

===============================================================
6. IMAGES — IMPORTANT
===============================================================

Do not leave large sections as text-only cards if the design requires imagery.

For:

- University cards
- Course cards
- Country cards
- Service cards
- Scholarship cards
- English test cards
- Resource cards
- Destination cards
- Marketing sections
- Feature cards

Use appropriate images/icons/visual treatments.

Images must:

- load correctly
- have alt text
- use optimized formats
- have fallback behavior
- not generate broken-image icons

Do not randomly duplicate one image everywhere if unique imagery is
available.

===============================================================
7. UNIVERSITY SYSTEM
===============================================================

University listing must support:

- Search
- Country
- City
- Ranking
- Tuition
- Intake
- Degree level
- Discipline
- Scholarship
- English requirement
- Application requirements

University detail page must contain:

- University name
- Logo/image
- Country
- City
- Overview
- Rankings where available
- Tuition
- Intakes
- Entry requirements
- English requirements
- Scholarships
- Application deadlines
- Accommodation information where available
- Popular courses
- Related courses
- FAQs
- CTA
- Apply/Enquire button

Every university must have a working dynamic slug page.

===============================================================
8. COURSE SYSTEM
===============================================================

Every course must have a complete dynamic course page.

Course page must contain:

- Course title
- University
- Country
- Campus
- Degree level
- Discipline
- Duration
- Intake
- Application deadline
- Tuition fee
- Currency
- Scholarship
- Entry requirements
- Academic requirements
- English requirements
- IELTS/PTE/TOEFL/etc requirements
- Documents required
- Application process
- Career information
- Related courses
- Related universities
- FAQs
- CTA
- Apply Now
- Request Counselling

No course page should be an empty shell.

All course information must originate from the database.

===============================================================
9. ENGLISH TEST SYSTEM
===============================================================

All English-test pages must contain real detailed information.

Support pages such as:

- IELTS
- IELTS Academic
- IELTS General
- PTE
- TOEFL
- Duolingo
- LanguageCert
- OET where applicable
- Other configured tests

Each page should contain:

- Overview
- Test format
- Sections
- Duration
- Scoring
- Accepted countries
- University acceptance
- Minimum scores
- Preparation guidance
- Test fees where available
- Booking information
- FAQs
- Related destinations
- Related universities
- CTA
- Course matching CTA

Do not create thin pages containing only a title and cards.

===============================================================
10. SERVICES
===============================================================

Every service page must have complete content.

Examples:

- University Selection
- Course Selection
- Application Support
- Scholarship Support
- SOP assistance
- Documentation
- Visa Guidance
- Interview Preparation
- Accommodation
- Pre-departure
- Post-arrival
- Partner support

Each service page must contain:

- Hero
- Explanation
- Process
- Benefits
- Required documents
- FAQs
- CTA
- Related services
- Contact/enquiry form

===============================================================
11. SCHOLARSHIPS
===============================================================

Scholarship pages must include:

- Eligibility
- Amount
- University
- Country
- Deadline
- Requirements
- Application method
- Related courses
- FAQs
- CTA

===============================================================
12. RESOURCES
===============================================================

Resources must support:

- Search
- Categories
- Detail pages
- Related resources
- SEO
- CTA
- Download where applicable

No dead resource cards.

===============================================================
13. CRM — MASTER ID
===============================================================

Every lead/student must receive a unique master CRM identity.

Format:

ALO-LEAD-XXXXXX

or the project's existing approved ALO-STU master identity format.

Do not create duplicate CRM identities.

Identity matching must consider:

- Email
- Phone
- WhatsApp
- Passport number where legally appropriate
- Existing student ID
- Existing application
- Name + DOB where appropriate

Potential duplicates must create a review task instead of silently creating
another student.

===============================================================
14. CRM MASTER RECORD
===============================================================

The master CRM record must preserve ALL submitted information.

Do not discard form fields.

Capture where applicable:

PERSONAL INFORMATION
- Full name
- DOB
- Gender
- Nationality
- Address
- City
- Country
- Phone
- WhatsApp
- Email

ACADEMIC INFORMATION
- Institution
- Degree
- Subject
- GPA/CGPA
- Graduation year
- Academic history

ENGLISH
- Test type
- Score
- Section scores
- Test date
- Expiry

STUDY PLAN
- Destination
- Degree level
- Subject
- University preferences
- Course preferences
- Intake
- Budget

DOCUMENTS
- Passport
- Academic certificates
- Transcripts
- English certificate
- CV
- SOP
- Recommendation letters
- Financial documents
- Other required documents

APPLICATION
- University
- Course
- Intake
- Status
- Deadline
- Offer
- Conditions

VISA
- Visa status
- Interview
- CAS/COE
- Submission
- Decision

FINANCE
- Fees
- Payments
- Refunds
- Commission
- Outstanding balance

COMMUNICATION
- Email
- WhatsApp
- SMS
- Calls
- Notes
- Tasks

Everything must persist.

===============================================================
15. AUTO CRM CREATION
===============================================================

Whenever a visitor submits:

- Website form
- Course enquiry
- University enquiry
- WhatsApp lead
- Facebook lead
- Instagram lead
- Landing page form
- Consultation request
- Application form

automatically:

1. Validate input.
2. Detect duplicate.
3. Create/update master CRM record.
4. Generate CRM ID.
5. Store source.
6. Store campaign.
7. Store UTM parameters.
8. Store submitted fields.
9. Create timeline event.
10. Trigger AI intake.
11. Trigger qualification.
12. Trigger assignment.
13. Create next action.
14. Notify counselor where necessary.

No manual CRM creation should be required for normal lead intake.

===============================================================
16. DOCUMENT AUTO-UPLOAD
===============================================================

When a student uploads a document:

1. Create secure upload record.
2. Attach document to master CRM ID.
3. Store document type.
4. Store original filename.
5. Store storage path.
6. Store upload time.
7. Calculate file hash.
8. Detect duplicate files.
9. Quarantine suspicious files.
10. Run document classification.
11. Extract available fields.
12. Write extracted information to StudentProfile.
13. Flag missing information.
14. Create missing-document task.
15. Update timeline.
16. Notify responsible counselor when human review is required.

Documents must NEVER become orphaned files.

===============================================================
17. AI WORKFORCE
===============================================================

AI agents must be functional workers, not chat-only assistants.

Each agent must have:

- Agent identity
- Role
- Permissions
- Tools
- Input schema
- Output schema
- Database access policy
- Audit log
- Retry behavior
- Escalation behavior
- Human handoff
- Error handling

Agents must execute actual system operations.

===============================================================
18. REQUIRED AI AGENTS
===============================================================

At minimum verify and operationalize:

1. Lead Intake Agent
2. Lead Qualification Agent
3. Duplicate Detection Agent
4. Student Profile Agent
5. Course Matching Agent
6. University Matching Agent
7. Scholarship Agent
8. English Test Agent
9. Document Classification Agent
10. Document Extraction Agent
11. Missing Document Agent
12. Application Agent
13. Deadline Monitoring Agent
14. Follow-up Agent
15. Counselor Assignment Agent
16. Communication Agent
17. Marketing Agent
18. Analytics Agent
19. Night Shift Agent
20. Morning Briefing Agent

If additional agents already exist, preserve and test them.

===============================================================
19. AI AGENT BEHAVIOR
===============================================================

Example:

NEW LEAD

Lead Intake Agent:
→ validate
→ deduplicate
→ create/update CRM
→ create timeline event

Qualification Agent:
→ analyze profile
→ score lead
→ identify destination
→ identify study level
→ identify budget
→ identify urgency
→ write qualification result

Course Matching Agent:
→ query course database
→ match requirements
→ produce ranked matches
→ store recommendations

Assignment Agent:
→ identify counselor
→ check workload
→ assign lead
→ create task

Follow-up Agent:
→ determine next action
→ schedule follow-up
→ create task
→ send approved communication

Document Agent:
→ classify
→ extract
→ update profile
→ detect missing fields
→ create task

Agents must not merely return JSON without performing the corresponding
database/system operation.

===============================================================
20. HUMAN-IN-THE-LOOP
===============================================================

AI must NOT independently make final legally sensitive decisions.

Human approval required for:

- Visa approval decisions
- Final visa submissions
- Financial approvals
- Refunds
- Contracts
- High-risk compliance decisions
- Sensitive identity decisions
- Final university submission where configured
- Any action requiring legal judgment

AI prepares work.
Human approves sensitive work.

===============================================================
21. NIGHT SHIFT
===============================================================

Night Shift Agent must:

- process pending leads
- classify documents
- detect missing information
- update CRM
- generate follow-up tasks
- monitor deadlines
- analyze stale leads
- prepare morning briefing
- escalate urgent issues

Morning Briefing must show:

- New leads
- Hot leads
- Unassigned leads
- Missing documents
- Deadlines
- Overdue follow-ups
- Applications requiring attention
- Visa issues
- AI escalations
- Recommended actions

===============================================================
22. AUTOMATION TARGET
===============================================================

Calculate REAL automation.

TOTAL_ELIGIBLE_OPERATIONAL_TASKS
AUTOMATED_TASKS
AI_ASSISTED_TASKS
HUMAN_ONLY_TASKS
FAILED_TASKS
ESCALATED_TASKS

Formula:

AUTOMATION_RATE =
(AUTOMATED_TASKS + AI_ASSISTED_TASKS)
/
TOTAL_ELIGIBLE_OPERATIONAL_TASKS
× 100

Target:

>= 70%

Do not manipulate the denominator.

Every task category must be auditable.

===============================================================
23. N8N
===============================================================

Create real n8n integrations.

Use n8n for workflows such as:

- Lead intake
- CRM synchronization
- Email
- WhatsApp
- Follow-up
- Document processing
- Notifications
- Daily reports
- Morning briefing
- Marketing automation
- Deadline alerts

Use secure webhook authentication.

Never expose secrets in client-side code.

===============================================================
24. WHATSAPP
===============================================================

Implement the complete integration architecture.

Support:

- Incoming messages
- Outgoing messages
- Lead creation
- Existing CRM matching
- Conversation history
- Message status
- Templates
- Attachments
- AI-assisted responses
- Human takeover
- Audit trail

If production Meta credentials are unavailable:

DO NOT fake successful delivery.

Show:

WHATSAPP STATUS:
"CONFIGURED / CREDENTIALS REQUIRED"

Simulation must never be presented as real delivery.

===============================================================
25. EMAIL
===============================================================

Implement Resend integration.

Support:

- Welcome email
- Lead confirmation
- Counselor notification
- Document request
- Follow-up
- Application updates
- Offer notifications
- Visa notifications

Track:

- sent
- delivered where supported
- failed
- timestamp
- recipient
- template

===============================================================
26. REDIS
===============================================================

Use Redis for appropriate:

- caching
- queues
- rate limiting
- temporary job state
- AI task queues
- session-related infrastructure where configured

Redis failure must not silently corrupt database transactions.

===============================================================
27. DATABASE
===============================================================

Production database:

MySQL 8.0

Verify:

- all models
- indexes
- foreign keys
- unique constraints
- cascade rules
- timestamps
- audit fields
- CRM identity
- document relationships
- application relationships
- timeline relationships
- employee/counselor relationships
- partner tenant isolation

No important application data may live only in process memory.

===============================================================
28. SECURITY
===============================================================

Verify:

- Authentication
- Authorization
- RBAC
- JWT/session validation
- CSRF
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection
- IDOR protection
- Tenant isolation
- File upload security
- Secret protection
- API authorization
- Audit logging

Sensitive APIs must not return data without authorization.

Never trust client-provided role/user IDs.

===============================================================
29. ENVIRONMENT SECURITY
===============================================================

.env must:

- never be committed
- permission 600
- contain real production values only
- not contain placeholder secrets

Required categories:

NODE_ENV
PORT
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
JWT_SECRET
OPENAI_API_KEY
OPENAI_BASE_URL
AI_MODEL
GROQ_API_KEY where used
MISTRAL_API_KEY where used
RESEND_API_KEY
EMAIL_FROM
UPLOAD_DIR
QUARANTINE_DIR
STORAGE_POOL_A
STORAGE_POOL_B
STORAGE_POOL_C
REDIS_URL
N8N_WEBHOOK_URL
ALO_PRODUCTION_API
CORS_ORIGIN
RATE_LIMIT_WINDOW
RATE_LIMIT_MAX
LOG_LEVEL

Never print secret values into logs.

===============================================================
30. ADMIN / CRM DASHBOARD
===============================================================

CRM must include functional dashboards for:

SUPER ADMIN
ADMIN
COUNSELOR
VISA OFFICER
MARKETING
HR
FINANCE
PARTNER
STUDENT

Dashboards must use real database data.

No fake statistics.

===============================================================
31. CRM FEATURES
===============================================================

Verify:

- Leads
- Students
- Applications
- Universities
- Courses
- Documents
- Tasks
- Follow-ups
- Communications
- Timeline
- Employees
- Counselors
- Partners
- Finance
- Visa
- Reports
- Audit logs
- AI workforce
- Automation monitor

Every action must either read or write real data.

===============================================================
32. STUDENT PORTAL
===============================================================

Student can:

- view profile
- update allowed fields
- see recommendations
- upload documents
- see missing documents
- see applications
- see offers
- see deadlines
- communicate
- see tasks
- see timeline
- see visa status where permitted

===============================================================
33. PARTNER PORTAL
===============================================================

Partner must have tenant isolation.

Partner can only access:

- own students
- own leads
- own applications
- own documents
- own commissions
- own reports

Cross-partner access must return 403/404 as appropriate.

===============================================================
34. SEARCH / COURSE FINDER
===============================================================

Course Finder must work without requiring login for public search.

Filters:

- Country
- University
- Subject
- Degree
- Tuition
- Intake
- Duration
- English test
- Scholarship
- Location

Results must come from database.

Course recommendation must use AI where configured.

===============================================================
35. SEO
===============================================================

Implement server-side SEO for:

- homepage
- countries
- universities
- university details
- courses
- course details
- English tests
- services
- scholarships
- resources

Generate:

- title
- description
- canonical
- OG
- Twitter metadata
- structured data where appropriate

Dynamic pages must generate metadata from database records.

===============================================================
36. PERFORMANCE
===============================================================

Optimize:

- images
- database queries
- caching
- server rendering
- bundle size
- API latency
- unnecessary client components

Do not sacrifice correctness for arbitrary performance scores.

===============================================================
37. UI QUALITY
===============================================================

All cards and grids must have consistent:

- spacing
- typography
- border radius
- hierarchy
- CTA
- hover state
- responsive behavior
- image ratio
- loading state
- empty state

Use ALO Education branding consistently.

Avoid visually inconsistent random colors.

===============================================================
38. API QUALITY
===============================================================

Every API route must:

- validate input
- authenticate where required
- authorize
- perform real operation
- return correct status code
- handle errors
- log safely
- avoid leaking secrets
- avoid fake success

Eliminate mock endpoints.

===============================================================
39. TESTING
===============================================================

Run:

npm install
npx prisma generate
npx prisma validate
npm run lint
npm run typecheck
npm run build

Then test:

- Homepage
- Navigation
- University page
- Course page
- English test page
- Service page
- Scholarship page
- Resource page
- Lead form
- CRM creation
- CRM ID generation
- Duplicate detection
- AI qualification
- Course matching
- Counselor assignment
- Document upload
- Document extraction
- Missing document workflow
- Application workflow
- Student portal
- Partner portal
- Admin portal
- AI dashboard
- n8n webhook
- Redis
- email
- WhatsApp architecture
- authentication
- RBAC
- tenant isolation

===============================================================
40. END-TO-END TEST
===============================================================

Perform this complete test:

VISITOR
→ WEBSITE
→ LEAD FORM
→ CRM ID
→ DUPLICATE CHECK
→ AI QUALIFICATION
→ COURSE MATCH
→ COUNSELOR ASSIGNMENT
→ FOLLOW-UP TASK
→ DOCUMENT UPLOAD
→ DOCUMENT CLASSIFICATION
→ DATA EXTRACTION
→ PROFILE UPDATE
→ MISSING DOCUMENT TASK
→ APPLICATION
→ DEADLINE TRACKING
→ OFFER
→ FINANCE
→ VISA
→ HUMAN APPROVAL
→ FINAL STATUS

Verify every stage is persisted.

===============================================================
41. PRODUCTION DEPLOYMENT
===============================================================

Prepare:

- .env.production
- ecosystem.config.cjs
- Caddyfile
- deployment script
- health endpoint
- PM2 startup configuration

PM2:

- correct working directory
- correct environment
- correct port
- restart on failure
- memory limit
- log management

Caddy:

aloeducation.com
www.aloeducation.com

Reverse proxy to:

127.0.0.1:3015

Enable HTTPS.

===============================================================
42. HEALTH CHECK
===============================================================

Implement:

GET /api/health

Response must verify:

- application
- database
- Redis where required

Do not report healthy if the application cannot access the database.

===============================================================
43. DEPLOYMENT VERIFICATION
===============================================================

Run:

pm2 status

ss -lntp | grep ':3015'

curl -I http://127.0.0.1:3015/

curl -s http://127.0.0.1:3015/api/health

sudo caddy validate --config /etc/caddy/Caddyfile

sudo systemctl status caddy

curl -I https://aloeducation.com/

pm2 save

===============================================================
44. SECURITY FINAL CHECK
===============================================================

Verify:

- .env = 600
- .env ignored by git
- no secrets in source
- no placeholder secrets in production
- no hardcoded passwords
- no API keys in frontend
- UFW configured
- SSH key authentication available
- sensitive API endpoints protected

===============================================================
45. AUTOMATION REPORT
===============================================================

Produce real numbers:

TOTAL_ELIGIBLE_OPERATIONAL_TASKS:
AUTOMATED_TASKS:
AI_ASSISTED_TASKS:
HUMAN_ONLY_TASKS:
FAILED_TASKS:
ESCALATED_TASKS:

Then calculate:

REAL AUTOMATION %

Also provide task-level evidence.

Target:

>= 70%

If below 70%:
DO NOT DECLARE COMPLETE.

Identify the highest-value manual tasks and automate them where safely possible.

===============================================================
46. FINAL ACCEPTANCE GATES
===============================================================

The project can only be declared:

PRODUCTION READY

if all applicable gates pass:

[ ] Website build passes
[ ] TypeScript passes
[ ] ESLint passes
[ ] Prisma validation passes
[ ] MySQL connection passes
[ ] Database schema synchronized
[ ] Redis works
[ ] PM2 works
[ ] Port 3015 works
[ ] Caddy validates
[ ] HTTPS works
[ ] Navbar appears once
[ ] Footer exists on all public pages
[ ] All dynamic university pages work
[ ] All dynamic course pages work
[ ] English test pages complete
[ ] Services complete
[ ] Scholarships complete
[ ] Resources complete
[ ] CRM ID generation works
[ ] Duplicate detection works
[ ] All submitted CRM fields persist
[ ] Document uploads link to CRM
[ ] Document extraction works
[ ] AI agents perform real operations
[ ] AI tasks persist
[ ] n8n workflows work
[ ] Student portal works
[ ] Partner portal works
[ ] RBAC works
[ ] Tenant isolation works
[ ] API authorization works
[ ] No fake APIs
[ ] No fake statistics
[ ] No Coming Soon pages
[ ] No broken links
[ ] No broken images
[ ] SEO works
[ ] Automation >= 70%
[ ] Failed tasks = 0 or explicitly explained
[ ] Sensitive actions require human approval
[ ] PM2 persistence works
[ ] Production HTTPS works

===============================================================
47. DO NOT CHEAT THE AUDIT
===============================================================

Never report:

"PASS"

just because code exists.

PASS means the feature was actually executed and verified.

Never count:

- static buttons
- empty pages
- mock APIs
- placeholder AI responses
- fake database writes
- simulated WhatsApp delivery

as real automation.

If an external credential is missing:

mark:

CREDENTIAL_REQUIRED

not:

PASS

The system must clearly distinguish:

IMPLEMENTED
CONFIGURED
OPERATIONAL
CREDENTIAL_REQUIRED
FAILED
BLOCKED

===============================================================
48. FINAL REPORT FORMAT
===============================================================

At completion provide:

# ALO EDUCATION FINAL ACCEPTANCE REPORT

## 1. Executive Result

## 2. Website
- pages
- tested pages
- broken links
- images
- navbar
- footer
- SEO

## 3. CRM
- modules
- APIs
- master CRM ID
- duplicate detection
- persistence

## 4. AI Workforce
- agent count
- operational agents
- database actions
- escalations
- human handoff

## 5. Automation
TOTAL_ELIGIBLE_OPERATIONAL_TASKS:
AUTOMATED_TASKS:
AI_ASSISTED_TASKS:
HUMAN_ONLY_TASKS:
FAILED_TASKS:
ESCALATED_TASKS:
REAL AUTOMATION %:

## 6. Database
- provider
- models
- foreign keys
- indexes
- persistence

## 7. Security
- auth
- RBAC
- CSRF
- JWT
- tenant isolation
- file security

## 8. Integrations
- OpenAI
- n8n
- Redis
- Resend
- WhatsApp
- other providers

## 9. Production
- Node
- Next.js
- Prisma
- MySQL
- Redis
- PM2
- Caddy
- HTTPS

## 10. Tests
Show actual commands and results.

## 11. Remaining External Credentials

Only list genuinely missing credentials.

## 12. Final Classification

Choose exactly one:

PRODUCTION READY

or

PRODUCTION READY WITH EXTERNAL CREDENTIALS REQUIRED

or

NOT PRODUCTION READY

Do not use "production ready" if critical tests are failing.

===============================================================
49. MOST IMPORTANT RULE
===============================================================

DO NOT STOP AT AUDITING.

After identifying a missing feature:

1. Fix it.
2. Integrate it.
3. Test it.
4. Re-test dependent features.
5. Run production build.
6. Run end-to-end workflow.
7. Update the final audit.

The goal is not a report.

The goal is a genuinely working ALO Education ecosystem.

===============================================================
50. FINAL COMMAND
===============================================================

START NOW.

Inspect the complete existing project first.

Do not ask me to describe the task again.

The task is:

COMPLETE, CONNECT, AUTOMATE, SECURE, TEST AND DEPLOY THE ENTIRE
ALO EDUCATION WEBSITE + CRM + AI WORKFORCE + DATABASE + AUTOMATION SYSTEM
WITHOUT REMOVING EXISTING WORKING FEATURES.

Target real automation:
>= 70%

Target:
ZERO intentionally incomplete internal functionality.

External services may remain:
CREDENTIAL_REQUIRED

but their integration architecture must be production-ready.

Begin with the full repository audit, then execute all required fixes.
Do not declare completion until the final acceptance gates have been tested.



now check file full website i need like this if already have then skep if any missing then build now and no need any ask anythink.  


ALO EDUCATION
WORLD-CLASS STUDENT JOURNEY + STUDENT PORTAL
SMS / WHATSAPP / WEBSITE CHAT → STUDENT → COURSE → APPLICATION → DOCUMENT → OFFER → CAS → VISA → FINAL VISA REVIEW
MASTER BUILD INSTRUCTION
Build and integrate the complete ALO Education Student Journey and Student Portal inside the existing ALO Education Web + CRM project.
DO NOT rebuild the project from zero.
First inspect the existing codebase, database, authentication, CRM, communication system, Course Finder, university/course pages, student portal, document system, English Test system and existing dashboards.
Keep everything that is working.
Do not create duplicate modules, duplicate routes, duplicate student records or demo-only dashboards.
The final system must be a single connected student journey, not a collection of unrelated pages.
The journey must begin from:
Unknown SMS / WhatsApp / Website Chat / Social Message
and continue through:
Lead → Student ID → Profile → Eligibility → Course Finder → Shortlist → Application → Documents → University Submission → Offer → Deposit → CAS/Admission → Visa Preparation → AI Interview → Human Visa Review → Visa Submission → Final Visa Decision → Pre-Departure → Enrollment
The Student Portal must become the student's single source of truth.
The student should not need to repeatedly explain their information to ALO.
AI, Counselor, Application Team, English Trainer and Visa Officer must all work from the same student record and timeline.
The existing requirement explicitly requires the platform to connect SMS/WhatsApp/chat, registration, counseling, documents, university application, offer, payment, visa processing and final visa decision in one journey.

1. CORE PRINCIPLE
Build the portal around one permanent identity:
ALO FULL STUDENT
AE-YYYY000001
ENGLISH TEST ONLY STUDENT
AET-YYYY000001
GUEST
GUEST-YYYY-RANDOM
Never create a second student profile simply because the same person contacts ALO from another channel.
Identity matching must use:
* Student ID
* verified phone
* WhatsApp number
* verified email
* social account ID
* existing CRM lead
* application ID
* document ownership
If an existing number contacts ALO again:
LOAD EXISTING PROFILE → APPEND TO TIMELINE → DO NOT CREATE DUPLICATE
This duplicate-prevention behavior is a mandatory existing communication requirement.

2. CHANNEL-TO-STUDENT AUTOMATION
Support:
* WhatsApp
* SMS
* Website Chat
* Facebook Messenger
* Instagram DM
* Website forms
* Course Finder
* Consultation forms
* English Test registration
* Student registration
Every incoming communication must enter one unified communication engine.

3. UNKNOWN NUMBER / FIRST CONTACT
When an unknown person sends:
Hi
or:
I want to study in UK
or:
Canada course
or:
IELTS mock test
or:
Need visa help
or:
Apply for Australia
AI must identify intent automatically.
Possible intents:
* admission
* course finder
* university information
* scholarship
* English test
* visa
* document support
* consultation
* application status
* existing student support
* referral
* general enquiry
AI should first attempt to identify the person.
Ask:
“Do you already have an ALO Student ID?”
If yes:
Ask for Student ID.
If no:
Start guided registration.
The existing workflow requires AI to ask for the Student ID first and create a profile when the person does not have one.

4. NEW STUDENT AUTO-CREATION
If no Student ID exists, collect only information that is actually needed.
Initial fields:
* Full name
* Phone
* WhatsApp
* Email
* Preferred country
* Study level
* Subject
* Intake
* English test status
* English score
* Budget
* Current qualification
AI should dynamically ask additional questions based on the student's answers.
Do NOT ask unnecessary questions.
After enough information is collected:
Automatically create:
* CRM Lead
* Student Profile
* Student ID
* AI Memory
* Communication Timeline
* Profile Checklist
* Counselor Assignment
* Next Action
* Portal Account
Then send:
“Your ALO Student Portal is ready.”
with secure login/OTP link.
Student IDs must follow the defined AE/AET system.

5. STUDENT LOGIN
Routes:

/login
/student-login
/student-register
/english-test-login
/english-test-register
/verify-otp
/forgot-password
/reset-password
/student/dashboard

Login methods:
* Email + password
* Phone + OTP
* WhatsApp OTP
* Student ID + OTP
* optional magic link
* optional Google login if safely configured
After authentication:
ALO FULL STUDENT
/student/dashboard
ENGLISH TEST ONLY
/test-student/dashboard
INCOMPLETE PROFILE
/student/profile/onboarding
SUSPENDED
/account-suspended
The routing rules must be implemented at backend level, not only through frontend navigation.

6. STUDENT DASHBOARD
Route:
/student/dashboard
Design this as a Mission Control Center for the student's entire overseas education journey.
Do not make it look like a generic admin dashboard.
It should immediately answer:
“Where am I?”
“What has been completed?”
“What is missing?”
“What should I do next?”
“Who is handling my case?”
“What is my application status?”
“Am I ready for visa?”

7. DASHBOARD HEADER
Show:
* ALO Education logo
* Student name
* Student ID
* student type
* destination
* current application
* current journey stage
* profile completion
* notification
* messages
* language selector
* help
* logout
Example:
Welcome back, Student
AE-2026000001
UK Admission Journey
Profile: 82%
Current stage:
CAS Preparation
Next action:
Upload updated bank statement

8. PRIMARY NEXT-ACTION ENGINE
At the top of the dashboard create a large dynamic:
YOUR NEXT BEST ACTION
AI determines this from real database information.
Examples:
* Complete profile
* Upload passport
* Upload transcript
* Submit English certificate
* Review university options
* Compare courses
* Apply to selected course
* Sign application form
* Upload bank statement
* Pay application fee
* Review offer
* Pay deposit
* Complete CAS questionnaire
* Practice credibility interview
* Upload visa documents
* Book biometric appointment
* Complete final visa review
This must never be hardcoded.
AI calculates it from:
* application stage
* missing documents
* deadlines
* payments
* English score
* interview readiness
* visa checklist
* counselor tasks

9. DASHBOARD QUICK ACTIONS
Create large action buttons:
* Continue Application
* Find Courses
* Upload Documents
* Message Counselor
* AI Advisor
* Start Mock Test
* Practice Interview
* Visa Readiness
* View Timeline

10. DASHBOARD SMART CARDS
Create connected cards for:
Profile
Show:
* completion %
* missing information
* AI recommendation
Applications
Show:
* active applications
* latest status
* next deadline
Documents
Show:
* uploaded
* approved
* pending
* rejected
* missing
English Test
Show:
* latest score
* mock credits
* weak skill
* recommended practice
ALO full students receive 3 free full mocks.
AI Interview
Show:
* readiness score
* last practice
* risk level
* next recommendation
Visa
Show:
* readiness %
* missing items
* risk flags
* next action
Messages
Show:
* unread messages
* counselor response
* latest WhatsApp conversation
Appointment
Show:
* next appointment
* counselor
* date/time
* meeting link
Payment
Show:
* outstanding amount
* payment status
* invoice

11. COMPLETE STUDENT JOURNEY TIMELINE
Create a visual journey:

Lead Created
      ↓
Student ID Created
      ↓
Profile Started
      ↓
Profile Completed
      ↓
Eligibility Checked
      ↓
Course Matched
      ↓
University Shortlisted
      ↓
Documents Requested
      ↓
Documents Uploaded
      ↓
Documents Reviewed
      ↓
Application Prepared
      ↓
Application Submitted
      ↓
Conditional Offer
      ↓
Unconditional Offer
      ↓
Deposit
      ↓
CAS / Final Admission
      ↓
Visa Documents
      ↓
AI Interview
      ↓
Human Visa Review
      ↓
Visa Submitted
      ↓
Visa Decision
      ↓
Pre-Departure
      ↓
Enrollment

Every event must have:
* timestamp
* responsible person
* AI/human
* status
* note
* document
* action
* communication reference
The required existing journey already specifies these major stages and requires status/date/responsible person/note/action for timeline items.

12. UNIFIED COMMUNICATION CENTER
Route:
/student/messages
Channels:
* WhatsApp
* SMS
* Website Chat
* Messenger
* Instagram
* Email
* Portal Message
The student should see one unified conversation.
Do not make the student manually switch between communication histories.
Every message connects to:

student_id
lead_id
application_id
conversation_id
channel
sender
sender_role
timestamp
status

The existing system requires every message/action to be connected to the correct student/partner/employee identity and audit trail.

13. AI MEMORY
Create persistent AI Student Memory.
Memory must include:
Identity
* Student ID
* name
* phone
* email
* student type
Profile
* education
* GPA
* English
* work experience
* study gap
* passport
* funding
* sponsor
* visa history
Preferences
* country
* university
* subject
* course
* intake
* budget
Applications
* university
* course
* application ID
* stage
* deadlines
* offer
* CAS
Documents
* uploaded
* missing
* rejected
* expired
* pending
Communication
* WhatsApp
* SMS
* website chat
* counselor messages
* previous questions
English
* test
* score
* mock history
* weak areas
Interview
* sessions
* scores
* weaknesses
* risk
Visa
* checklist
* readiness
* officer review
* submission
* decision
AI must not repeatedly ask information already stored.
The supplied specification explicitly requires AI memory to cover profile, application, documents, communication, English testing, interview, visa and payment information.

14. PROFILE CENTER
Route:
/student/profile
Sections:
Personal
* full name
* DOB
* nationality
* phone
* email
* address
Education
* SSC/O-Level
* HSC/A-Level
* Bachelor
* Master
* qualification
* institution
* GPA
* grading scale
* completion year
Passport
* passport number
* issue date
* expiry date
* issuing country
English
* IELTS
* PTE
* TOEFL
* Duolingo
* OIETC
* ELLT
* score
* test date
* expiry
Work
* company
* position
* start/end
* experience
Funding
* sponsor
* relationship
* income
* funding source
Visa history
* previous applications
* refusals
* country
* date
* refusal reason
Admission Preference
* destination
* level
* subject
* course
* intake
* budget
AI should calculate profile completeness dynamically.

15. COURSE FINDER
Route:
/student/course-finder
The Course Finder must use the student's actual profile.
Do not show a generic search engine only.
Calculate:
Eligibility Score
AI Match Score
Scholarship Match
Budget Match
English Requirement Match
Academic Match
Visa Readiness Impact
Missing Requirements
Required Documents
The existing course finder requirement specifically includes profile-based recommendations, safe/ambitious universities, budget options, scholarships, visa-friendly options and English alternatives.

16. COURSE MATCH RESULT
Every course result should show:
95% AI Match
92% Eligibility
Scholarship Possible
Budget Fit
English Requirement Met
Then:
WHY THIS COURSE MATCHES YOU
* Your GPA meets requirement
* Your English score meets requirement
* Your preferred subject matches
* Your budget is within range
* Your preferred intake is available
WHAT IS MISSING
* Updated CV
* English certificate
* Passport copy
RISK FLAGS
* Study gap requires explanation
* English score close to minimum
* Deposit above current budget
Buttons:
* Save
* Compare
* Apply
* Ask AI
* Ask Counselor
* Generate Checklist

17. APPLICATION FROM COURSE FINDER
When student clicks:
APPLY NOW
Do NOT simply redirect to a blank application form.
First run:
APPLICATION PRE-CHECK
Check:
* profile complete?
* passport?
* academic documents?
* English requirement?
* academic requirement?
* application deadline?
* intake open?
* scholarship?
* application fee?
* deposit?
* required forms?
* SOP?
* CV?
* recommendation?
* funding documents?
Then show:
APPLICATION READINESS
87% Ready
Green:
* Requirements met
Yellow:
* Needs review
Red:
* Missing
Then:
START APPLICATION

18. AUTO APPLICATION CREATION
When student confirms:
Create:

application
student_id
course_id
university_id
campus_id
intake_id
counselor_id
application_team_id
status
review_status
document_status
payment_status

Create application draft.
Automatically generate:
* application checklist
* document checklist
* timeline event
* counselor task
* application-team task
* notification

19. DOCUMENT HUB
Route:
/student/documents
Document categories must include:
* Passport
* Photo
* NID/Birth Certificate
* SSC/O-Level
* HSC/A-Level
* Bachelor
* Master
* IELTS/PTE/TOEFL/Duolingo/OIETC
* CV
* SOP
* Recommendation Letter
* Bank Statement
* Sponsor Documents
* Work Experience
* Visa Documents
* Refusal Letter
* Medical Documents
* Other
The supplied requirements define these document categories and statuses.

20. DOCUMENT UPLOAD MUST BE INTELLIGENT
When student uploads a document:
AI automatically:
1. identifies document type
2. reads metadata/text where permitted
3. associates it with the correct student
4. associates it with application
5. associates it with required checklist
6. detects duplicate
7. checks expiry
8. checks whether required
9. detects possible missing pages
10. flags poor quality
11. creates review task
12. updates timeline
13. notifies responsible team
Statuses:

NOT_UPLOADED
UPLOADED
AI_CHECKING
PENDING_REVIEW
APPROVED
REJECTED
NEEDS_UPDATE
EXPIRED


21. IMPORTANT: DOCUMENT + FORM AUTOMATION
If a university/application/visa process requires a form after a document is uploaded:
DO NOT ASK THE STUDENT TO FIND AND FILL THE FORM MANUALLY.
System should detect:
Document received → Required form detected
Then open:
COMPLETE REQUIRED FORM
AI pre-fills fields using verified student data.
Example:
Passport uploaded.
System already knows:
* name
* DOB
* nationality
* passport number
* expiry
The application form automatically pre-fills those fields.
Student only confirms or corrects.
Never invent missing information.
Any sensitive information change must require appropriate verification.

22. DOCUMENT REVIEW WORKFLOW
After upload:

Student
 ↓
AI Document Check
 ↓
Application Team Review
 ↓
Counselor Confirmation if needed
 ↓
Approved

If rejected:
Show:
WHY WAS THIS REJECTED?
Example:
Bank statement is older than the required period.
Then:
WHAT YOU NEED TO DO
Upload a newer bank statement covering the required period.

23. SOP CENTER
Route:
/student/sop
Functions:
* course-specific SOP
* university-specific SOP
* academic background
* career goal
* study motivation
* study gap explanation
* sponsor explanation
* future plan
* originality guidance
* version history
* counselor review
* export PDF/DOCX
AI may draft.
Student must review and personalize.
Never create copied or fabricated personal information.
The supplied requirement explicitly says AI may draft but the student must rewrite/review and no copied SOP should be used.

24. CV CENTER
Route:
/student/cv
Create:
* academic CV
* professional CV
* university CV
* scholarship CV
AI assists with:
* structure
* grammar
* formatting
* missing sections
* consistency
Student approves final version.

25. ENGLISH TEST CENTER
Route:
/student/english-test
Include:
* IELTS
* PTE
* TOEFL
* Duolingo
* OIETC
* ELLT
* placement test
For full ALO students:
3 free full mock tests
Track:
* remaining credits
* used credits
* paid credits
* mock history
* latest result
* weak areas
English Test-only students receive their separate limited dashboard and must not gain admission/visa access unless upgraded.

26. AI ENGLISH ANALYSIS
After mock test:
AI calculates:
* Listening
* Reading
* Writing
* Speaking
* Overall estimate
Writing:
* task achievement
* coherence
* vocabulary
* grammar
Speaking:
* fluency
* pronunciation estimate
* vocabulary
* grammar
* relevance
* confidence
Then generate:
YOUR NEXT PRACTICE PLAN
Example:
Writing is currently your weakest skill. Practice Task 2 structure for 5 days before attempting another full mock.
Practice scores must clearly be identified as estimates, not official exam results.

27. APPLICATION TRACKER
Route:
/student/applications
Each application:
* university
* course
* country
* intake
* application ID
* deadline
* counselor
* application officer
* visa officer
* current status
* progress
* last update
Expanded stages:

Counselling
Eligibility Checked
Documents Pending
Documents Received
University Shortlisted
Application Preparing
Application Submitted
Conditional Offer
Unconditional Offer
Deposit Pending
CAS Interview
CAS Pending
CAS Issued
Visa Documents
Visa Submitted
Visa Decision Pending
Visa Approved
Visa Refused
Pre-Departure
Enrolled


28. OFFER MANAGEMENT
When university offer arrives:
Upload/import offer.
AI extracts:
* university
* course
* intake
* offer type
* conditions
* tuition
* deposit
* deadline
* scholarship
* CAS requirement
Then show:
OFFER SUMMARY
CONDITIONS TO COMPLETE
PAYMENT REQUIRED
DEADLINE
NEXT ACTION
Student must confirm acceptance where applicable.

29. DEPOSIT / PAYMENT CENTER
Route:
/student/payments
Show:
* application fee
* university deposit
* ALO service payment
* mock test payment
* other approved fees
Each payment:
* invoice
* amount
* currency
* status
* deadline
* receipt
* transaction reference
Never claim a fee is current without verified source data.

30. CAS / FINAL ADMISSION CENTER
Route:
/student/cas
Show:
* offer status
* conditions
* deposit status
* CAS questionnaire
* credibility interview
* CAS documents
* CAS status
* CAS issued date
When CAS is issued:
Automatically unlock:
VISA PREPARATION

31. VISA PREPARATION CENTER
Route:
/student/visa
Sections:
Visa Checklist
Financial Documents
Sponsor Documents
CAS
Passport
Medical/TB if required
Visa Forms
Biometrics
Appointment
Visa Application
Decision
The existing specification requires CAS, bank statement, sponsor documents, visa status, TB/medical, biometric, decision, refusal history and AI risk/readiness.

32. AI VISA READINESS ENGINE
Calculate:
VISA READINESS SCORE
Example:
91% READY
Breakdown:
* Documents: 96%
* Financial: 88%
* Academic consistency: 95%
* Course knowledge: 91%
* University knowledge: 93%
* Study plan: 87%
* Interview readiness: 84%
Risk levels:

READY
NEEDS_DOCUMENT_UPDATE
NEEDS_INTERVIEW_PRACTICE
HIGH_RISK
HUMAN_REVIEW_REQUIRED

AI must never guarantee visa approval.
Never show:
Visa guaranteed.
Use:
Current readiness assessment indicates areas that should be reviewed before submission.

33. AI VISA INTERVIEW
Routes:

/student/ai-interview
/student/visa-interview-practice
/student/credibility-interview

Interview types:
* credibility interview
* visa interview
* pre-CAS interview
* scholarship interview
* sponsor interview
* study-gap interview
* general English speaking
AI asks one question at a time.
It must dynamically follow up based on the answer.
Topics:
* why this country?
* why this university?
* why this course?
* previous education
* career goals
* study gap
* sponsor
* funding
* accommodation
* future plan
* visa history
* refusal history
Scores:
* communication
* confidence
* course knowledge
* university knowledge
* country knowledge
* financial explanation
* sponsor explanation
* study-gap explanation
* future plan
* visa risk
* overall readiness
Results:

READY
NEEDS_PRACTICE
HIGH_RISK
HUMAN_REVIEW_REQUIRED

Save result to:
* Student Portal
* CRM timeline
* Counselor dashboard
* Visa Officer dashboard
The supplied specification explicitly requires these interview types, dynamic follow-up behavior, scoring and saving the result across these systems.

34. HUMAN VISA OFFICER REVIEW
This is a critical stage.
After AI preparation:
HUMAN VISA REVIEW
Student sees:
Your case is now under final human review.
Show:
* Visa readiness
* document status
* financial status
* CAS status
* interview result
* AI risk flags
* missing items
* officer questions
Visa Officer can request:
* document correction
* additional explanation
* additional evidence
* interview practice
* sponsor clarification
Student receives notification.

35. FINAL VISA REVIEW CHECKLIST
Before submission, system must run a final checklist.
IDENTITY
* passport valid
* name consistency
* DOB consistency
ACADEMIC
* certificates
* transcripts
* course consistency
ENGLISH
* correct test
* score
* validity
UNIVERSITY
* offer
* conditions
* CAS
FINANCE
* bank statement
* sponsor
* funds
* required period
* source of funds
VISA
* forms
* photographs
* TB/medical where required
* biometrics
* supporting documents
INTERVIEW
* readiness
* weak answers
* risk flags
COMMUNICATION
* student informed
* counselor review
* visa officer approval
If anything critical is missing:
BLOCK FINAL SUBMISSION
and explain exactly why.

36. FINAL HUMAN APPROVAL
Create:
FINAL VISA REVIEW
Actions:
Approve for Submission
Request Changes
Send Back to Student
Escalate
Hold
Every action must create:
* timeline event
* audit log
* notification
* responsible officer
* timestamp
* reason

37. VISA SUBMISSION
After final approval:
Status:
VISA_READY_FOR_SUBMISSION
Then:
VISA_SUBMITTED
Store:
* submission date
* application reference
* biometric date
* visa center
* uploaded final package
* responsible officer

38. VISA DECISION
Statuses:

DECISION_PENDING
APPROVED
REFUSED
WITHDRAWN

When decision arrives:
Student dashboard must update automatically.
APPROVED
Show:
Visa Approved
Then unlock:
PRE-DEPARTURE JOURNEY
REFUSED
Show:
* decision document
* refusal reason
* counselor review
* next options
Never automatically promise appeal/reapplication success.

39. PRE-DEPARTURE
After approval:
Create:
* accommodation guidance
* airport guidance
* travel checklist
* university enrollment
* arrival instructions
* insurance where relevant
* financial preparation
* emergency contacts
* university contact
* student orientation
* arrival confirmation

40. REFERRAL / STUDENT MARKETING
Add a separate Student Referral card.
This is not CRM administration.
It is a student-facing referral feature.
REFER A FRIEND
Student can:
* share referral link
* share WhatsApp
* share Messenger
* copy referral code
* send directly to friend
Example:
Your Referral Code: AEFR-XXXXXX
If friend clicks and registers:
Automatically associate:

referrer_student_id
referred_lead_id
campaign
source
timestamp

Do not award benefits merely because someone clicked.
Define configurable referral conditions such as:
* qualified lead
* consultation completed
* application submitted
* enrollment
* approved internal campaign condition
Student can see:
* referrals sent
* pending
* qualified
* successful
* available reward/offers
Marketing can configure attractive offers from the backend.

41. AI NEXT-BEST-ACTION
Every student should have an AI-generated next action.
Example:
Your best next step
Upload your updated bank statement. After that, your visa officer can complete the final financial review.
Another example:
Your course shortlist is ready. You have 4 strong matches and 2 ambitious options. Compare them before starting an application.
This replaces unnecessary manual follow-up.

42. AUTOMATIC ACTION ENGINE
After every important student action:
Registration
Create:
* memory
* checklist
* counselor task
* welcome communication
Profile completed
Run:
* eligibility
* course recommendations
* document checklist
Course selected
Generate:
* application pre-check
* document checklist
Application created
Create:
* application timeline
* counselor task
* application-team task
Document uploaded
Run:
* classification
* AI check
* missing-document check
* expiry check
* reviewer task
Offer received
Run:
* offer extraction
* conditions
* payment requirement
* CAS checklist
CAS received
Run:
* visa checklist
* financial checklist
* interview preparation
Interview completed
Run:
* scoring
* risk detection
* officer notification
Visa review completed
Run:
* final submission readiness
Visa decision
Run:
* approved → pre-departure
* refused → counselor review workflow

43. NOTIFICATION ENGINE
Notify through:
* portal
* WhatsApp
* SMS
* email
* push notification if available
Examples:
Your university application has been submitted.
Your passport document has been approved.
Your bank statement requires an update.
Your CAS interview preparation is ready.
Your final visa review has started.
Every notification must be linked to the student timeline.

44. STUDENT TIMELINE = SINGLE SOURCE OF TRUTH
Every action must be visible in chronological order.
Examples:

03:15 PM
Student uploaded passport
AI classified document
Application Team notified

03:22 PM
Application Team approved passport

04:10 PM
University application submitted

05:45 PM
Offer received

06:00 PM
AI extracted offer conditions

Next:
Student must complete deposit

No orphan events.

45. SECURITY
Mandatory:
* backend authentication
* backend RBAC
* ownership checks
* CSRF protection
* validation
* secure file access
* signed/private document URLs
* OTP for sensitive communication
* audit logging
* rate limiting
* no frontend-only permissions
* no hardcoded credentials
* no demo login
* no fake student data
Student can only access their own information.
English Test-only users cannot access:
* applications
* visa
* full document vault
* admission workflow
The supplied security requirements explicitly prohibit frontend-only auth, role bypass, fake dashboard data and unauthorized private-data access.

46. DATABASE CONNECTION
Use the existing database where possible.
Ensure the student identity connects to:

User
Student
StudentProfile
Applications
Courses
Universities
Documents
Messages
TimelineEvents
Appointments
Payments
EnglishTests
MockTests
InterviewSessions
VisaChecklist
VisaReadiness
Notifications
AiStudentMemory
AuditLogs
Referral

No disconnected duplicate student table should be introduced unless technically necessary.

47. REQUIRED STUDENT ROUTES
Implement/verify:

/student/dashboard
/student/profile
/student/profile/onboarding

/student/course-finder
/student/course/:id
/student/shortlist
/student/compare

/student/applications
/student/applications/:id
/student/apply/:course_id

/student/documents
/student/documents/:id

/student/messages
/student/timeline
/student/notifications
/student/appointments
/student/payments

/student/sop
/student/cv

/student/english-test
/student/mock-tests
/student/mock-tests/available
/student/mock-tests/start/:testId
/student/mock-tests/session/:sessionId
/student/mock-tests/result/:sessionId

/student/ai-interview
/student/visa-interview-practice
/student/credibility-interview

/student/visa
/student/visa/checklist
/student/visa/readiness
/student/cas

/student/referrals
/student/referrals/:id
/student/help


48. REQUIRED BACKEND CONNECTIONS
Every protected API must perform:

Authentication
+
Role Check
+
Student Ownership Check
+
Validation
+
Database Operation
+
Audit Log
+
Timeline Event
+
Notification where applicable

Never trust:

student_id
role
application_id
document_id

from frontend alone.
Derive ownership from authenticated session.

49. DESIGN REQUIREMENT
ALO Education branding:

Background: #FFFFFF
Primary Blue: #0057B8
CTA Orange: #E8501A
Text: #0F172A
Soft Background: #F8FAFC
Border: #E2E8F0
Success: #10B981
Warning: #F59E0B
Danger: #EF4444

Design:
* premium education consultancy
* clean
* highly trustworthy
* modern
* responsive
* mobile-first
* accessible
* fast
* no dark overlay
* no lorem ipsum
* no fake statistics
* no hardcoded student names
* consistent 48px CTA buttons
* equal-height cards
* clear status colors
* excellent empty states
* excellent loading states
* excellent error states

50. STUDENT DASHBOARD SHOULD NOT FEEL LIKE CRM
The student sees:
My Journey
My Applications
My Documents
My Courses
My Tests
My Interviews
My Visa
My Messages
My Payments
My Referrals
My Appointments
My AI Advisor
CRM/internal notes must never leak into the student portal.

51. AI ADVISOR
Add a permanent:
Ask ALO AI
Student can ask:
* What should I do now?
* What documents are missing?
* Why was my document rejected?
* Which course matches me?
* Am I eligible?
* What is my application status?
* What happens after offer?
* What do I need for CAS?
* Am I ready for visa?
* What should I prepare for interview?
* Why is my visa readiness low?
AI answers from actual Student ID memory and database.
If uncertain:
Human handover
Do not hallucinate.

52. HUMAN HANDOVER
AI must detect:
* uncertainty
* sensitive case
* refusal
* financial complexity
* legal/visa ambiguity
* unusual document
* high-risk case
* student explicitly requests human
Then create:
Counselor Task
or
Visa Officer Task
and notify the student:
I've flagged this for your ALO team so you don't receive an unreliable answer.

53. FINAL JOURNEY VISUAL
Create a permanent journey indicator:

INQUIRY
  ↓
PROFILE
  ↓
ELIGIBILITY
  ↓
COURSE
  ↓
APPLICATION
  ↓
DOCUMENTS
  ↓
OFFER
  ↓
CAS
  ↓
VISA PREPARATION
  ↓
AI INTERVIEW
  ↓
HUMAN VISA REVIEW
  ↓
SUBMISSION
  ↓
DECISION
  ↓
PRE-DEPARTURE

Current stage highlighted.
Completed stages marked.
Future stages locked/unlocked according to real workflow.

54. CRITICAL AUTOMATION RULE
The objective is not simply to display information.
The system must perform work automatically.
Example:
Student uploads passport.
Do not only show:
Passport uploaded.
Instead:

Passport uploaded
↓
AI identifies passport
↓
Student identity matched
↓
Passport data extracted
↓
Expiry checked
↓
Application linked
↓
Required form pre-filled
↓
Missing information detected
↓
Application Team notified
↓
Timeline updated
↓
Student receives confirmation

This same principle must apply to every major student action.

55. FINAL ACCEPTANCE TEST
Do not declare complete until this complete journey is tested:
TEST 1
Unknown WhatsApp number sends:
Hi
→ lead created → identity checked → Student ID created → profile created → counselor assigned → portal link sent
TEST 2
Same WhatsApp number sends another message.
→ existing student found → NO duplicate profile → message added to same timeline
TEST 3
Student logs in.
→ correct dashboard → real student information → no hardcoded data
TEST 4
Student completes profile.
→ eligibility calculated → course recommendations generated → missing documents identified
TEST 5
Student opens Course Finder.
→ actual profile matched → eligibility score → AI match score → missing requirements → application readiness
TEST 6
Student clicks Apply.
→ pre-check → application draft → checklist → timeline → counselor/application task
TEST 7
Student uploads document.
→ AI classification → expiry check → correct application association → review task → timeline
TEST 8
Required form exists.
→ system detects form requirement → pre-fills known information → student confirms → form saved
TEST 9
Offer arrives.
→ offer information recorded → conditions extracted → next action generated
TEST 10
CAS stage reached.
→ visa checklist activated → financial checklist activated → interview preparation activated
TEST 11
Student completes AI interview.
→ transcript → score → risk → readiness → counselor/visa officer visibility
TEST 12
Visa Officer performs final review.
→ missing items detected → corrections requested if necessary → approval/rejection recorded
TEST 13
Approved for submission.
→ final checklist → visa package status → submission status
TEST 14
Visa decision entered.
→ student notified → timeline updated → approved → pre-departure → refused → human review workflow
TEST 15
Student asks:
“What should I do now?”
AI must answer using actual Student ID memory and current workflow.
It must not ask the student to repeat information already stored.

56. FINAL VERIFICATION RULE
Run:
* frontend build
* backend build
* type check
* lint
* database migration validation
* API tests
* authentication tests
* RBAC tests
* document upload tests
* communication tests
* duplicate detection tests
* Course Finder tests
* application tests
* mock-test tests
* AI interview tests
* visa workflow tests
* mobile responsive tests
* browser end-to-end tests
Test both:
Happy path
and
Failure path
including:
* duplicate phone
* duplicate email
* expired document
* rejected document
* missing course requirement
* invalid application
* expired intake
* insufficient funds
* incomplete profile
* unauthorized student access
* unauthorized document access
* unauthorized visa information
* duplicate WhatsApp message
* OTP failure
* payment failure
* API failure

57. ABSOLUTE RULE
DO NOT SAY “DONE” BASED ON FILE NAMES, ROUTES, COMPONENT NAMES OR STATIC UI.
Verify the actual implementation.
The project is complete only when the real system has been tested end-to-end from:
UNKNOWN MESSAGE → STUDENT ID → LOGIN → PROFILE → COURSE FINDER → APPLICATION → DOCUMENTS → OFFER → CAS → VISA PREPARATION → AI INTERVIEW → HUMAN VISA REVIEW → VISA SUBMISSION → FINAL VISA DECISION → PRE-DEPARTURE.
The acceptance requirements already state that the dashboard is NOT COMPLETE until login, Student ID detection, profile, real backend data, documents, application tracker, English tests, AI interview, visa readiness, communication memory, CRM timeline and role visibility all work.
FINAL REPORT MUST SHOW

IMPLEMENTED
---------
Feature
Route
Backend API
Database
Automation
Test Result

VERIFIED
---------
End-to-end student journey
Communication
Student ID
AI Memory
Course Match
Application
Documents
Forms
Offer
CAS
Interview
Visa Review
Visa Submission
Decision

NOT COMPLETE
-------------
Anything still missing
Exact reason
Affected route
Required fix

Never mark an unverified feature as complete.


ALL OTHER EMPLOYEE DASHBOARDS + ROLE-BASED OPERATING SYSTEM
TASK: Build, audit, patch, and complete ALL NON-SUPER-ADMIN EMPLOYEE DASHBOARDS inside the existing ALO Education WEB_CRM.
DO NOT REBUILD THE EXISTING APPLICATION.
DO NOT CREATE A NEW PROJECT.
DO NOT DELETE WORKING MODULES.
DO NOT REPLACE EXISTING WORKING DASHBOARDS.
DO NOT CREATE UI-ONLY FEATURES.
DO NOT USE FAKE DATA.
DO NOT CLAIM A FEATURE IS COMPLETE UNLESS: ROUTE + UI + API + DATABASE + RBAC + REAL WORKFLOW + AUDIT LOG + VALIDATION actually work.
FIRST AUDIT THE EXISTING PROJECT. THEN REUSE EXISTING COMPONENTS/APIs/models. ONLY ADD OR PATCH WHAT IS MISSING.
============================================================
1. PRIMARY OBJECTIVE ============================================================
Create a complete role-based Employee Dashboard System for ALO Education.
ALO SUPER_ADMIN remains the master authority.
Every employee gets a dashboard according to:
* role
* designation
* department
* branch
* country
* assigned records
* explicit permissions
* temporary permissions
* permission expiry
* approval requirements
Employee dashboards must use the existing ALO dashboard shell.
The same underlying CRM data must be used across dashboards.
NO DUPLICATE DATABASE.
NO DUPLICATE STUDENT.
NO DUPLICATE LEAD.
NO DUPLICATE APPLICATION.
NO DUPLICATE DOCUMENT.
NO DUPLICATE COMMUNICATION THREAD.
NO duplicate business records simply because they appear in different dashboards.
SUPPORTED EMPLOYEE ROLES:
SUPER_ADMIN ADMIN CEO DIRECTOR BRANCH_MANAGER COUNTRY_MANAGER HR_MANAGER OFFICE_MANAGER COUNSELOR SENIOR_COUNSELOR APPLICATION_TEAM APPLICATION_MANAGER VISA_OFFICER VISA_INTERVIEW_OFFICER FINANCE MARKETING_MANAGER MARKETING FRONT_DESK SUPPORT_STAFF PARTNER_MANAGER VIEWER
The system must also support custom roles.
Every custom role must be created through RBAC.
SUPER_ADMIN has unrestricted master access.
ADMIN access is permission controlled.
All other employees are permission controlled.
No frontend-only authorization.
All employee dashboards must use one reusable shell.
Header:
* ALO logo
* page title
* employee name
* designation
* branch
* country assignment
* notification bell
* global search where permitted
* task count
* pending approval count
* profile
* logout
If Super Admin is acting as the employee:
SHOW:
"SUPER ADMIN ACTING AS: {EMPLOYEE / ROLE}"
Buttons:
* Stop Acting-As
* View Acting-As Audit
Every action must remain attributed to:
realActorUserId = SUPER_ADMIN
actingAsUserId = employee ID
actingAsRole = employee role
Implement or patch:
/employee/dashboard
/employee/counselor-dashboard /employee/senior-counselor-dashboard /employee/application-dashboard /employee/application-manager-dashboard /employee/visa-dashboard /employee/visa-interview-dashboard /employee/finance-dashboard /employee/marketing-dashboard /employee/marketing-manager-dashboard /employee/hr-dashboard /employee/branch-manager-dashboard /employee/country-manager-dashboard /employee/office-manager-dashboard /employee/front-desk-dashboard /employee/support-dashboard /employee/partner-manager-dashboard
Also support role-aware routing:
/employee/dashboard
After login:
IF role = COUNSELOR → Counselor Dashboard
IF role = SENIOR_COUNSELOR → Senior Counselor Dashboard
IF role = APPLICATION_TEAM → Application Team Dashboard
IF role = VISA_OFFICER → Visa Dashboard
IF role = VISA_INTERVIEW_OFFICER → Visa Interview Dashboard
IF role = FINANCE → Finance Dashboard
IF role = MARKETING → Marketing Dashboard
IF role = MARKETING_MANAGER → Marketing Manager Dashboard
IF role = HR_MANAGER → HR Dashboard
IF role = BRANCH_MANAGER → Branch Manager Dashboard
IF role = COUNTRY_MANAGER → Country Manager Dashboard
IF role = OFFICE_MANAGER → Office Manager Dashboard
IF role = FRONT_DESK → Front Desk Dashboard
IF role = SUPPORT_STAFF → Support Dashboard
IF role = PARTNER_MANAGER → Partner Manager Dashboard
Every employee dashboard must use real API-driven metrics.
No hardcoded numbers.
KPI visibility depends on role.
Common metrics:
* Assigned Leads
* New Leads
* Hot Leads
* Assigned Students
* Active Applications
* Pending Documents
* Follow-ups Due
* Overdue Follow-ups
* Today's Tasks
* Appointments
* Unread Messages
* Pending Approvals
* SLA Breaches
* Notifications
Role-specific KPI cards must be added.
Every KPI:
* real backend query
* permission checked
* loading state
* error state
* empty state
* click-through route
ROUTE:
/employee/counselor-dashboard
PURPOSE:
Counselor manages assigned leads and students.
KPI:
* New Leads
* Assigned Leads
* Hot Leads
* Active Students
* Follow-ups Due
* Overdue Follow-ups
* Applications
* Pending Documents
* Appointments Today
* Unread Messages
* Conversion Rate
MAIN MODULES:
1. Lead Inbox
2. My Students
3. Follow-up Queue
4. Application Pipeline
5. Document Requests
6. Communication Inbox
7. Appointments
8. Course Finder
9. University Finder
10. Scholarship Finder
11. Student Timeline
12. Student Next Action
13. SOP/CV Drafting
14. English Test Status
15. Visa Readiness Summary
16. Counselor Performance
COUNSELOR ACTIONS:
* create lead
* update lead
* qualify lead
* convert lead
* assign follow-up
* call log
* WhatsApp message
* email
* website chat
* schedule appointment
* assign course
* recommend university
* create application draft
* request document
* review document
* add timeline note
* create SOP draft
* create CV draft
* send student update
Counselor cannot:
* modify RBAC
* access salary
* access other employee private HR data
* approve commission
* access unrelated partner data
* access unrestricted visa-sensitive data
* publish marketing content without permission
ROUTE:
/employee/senior-counselor-dashboard
Everything Counselor has PLUS:
* team lead overview
* counselor performance
* lead distribution
* workload balancing
* escalation queue
* SLA monitoring
* high-value leads
* difficult cases
* counselor coaching notes
* team conversion report
* branch performance where permitted
Senior Counselor can:
* assign leads to counselors
* reassign follow-ups
* escalate cases
* review counselor activity
* review student communication
* approve selected counselor workflow actions
Cannot bypass Super Admin RBAC.
ROUTE:
/employee/application-dashboard
PURPOSE:
Manage application workflow.
KPI:
* Applications Received
* Draft Applications
* Submitted Applications
* Document Pending
* Application Review
* Offer Pending
* Offer Received
* CAS/COE/Enrollment Stage
* Deadline Alerts
* SLA Breaches
PIPELINE:
Lead → Student → Application Draft → Documents → Application Review → Submitted → Conditional Offer → Unconditional Offer → Deposit → CAS/COE → Visa Ready → Completed
FEATURES:
* application queue
* application details
* university
* course
* intake
* application deadline
* document checklist
* missing documents
* application notes
* submission tracking
* offer tracking
* student communication
* counselor communication
* task assignment
* deadline alerts
* application timeline
ACTIONS:
* create application
* update stage
* request documents
* verify documents
* add application note
* assign application officer
* notify counselor
* notify student
* mark submission
* record offer
* escalate deadline
Sensitive application changes require audit.
ROUTE:
/employee/application-manager-dashboard
Includes all Application Team functionality PLUS:
* team workload
* application SLA
* officer performance
* deadline risk
* university workload
* country workload
* intake workload
* escalation queue
* application conversion
* offer conversion
* team task assignment
Manager can:
* assign applications
* reassign applications
* monitor officers
* approve workflow actions where permission exists
* generate application reports
ROUTE:
/employee/visa-dashboard
KPI:
* Visa Cases
* Visa Ready
* Interview Pending
* Documents Pending
* High Risk
* Funding Risk
* Study Gap Risk
* Refusal Risk
* Interview Completed
* Escalated Cases
MODULES:
* visa case queue
* visa readiness
* document checklist
* funding/sponsor assessment
* study gap assessment
* credibility preparation
* refusal history
* interview history
* officer notes
* risk indicators
* student-safe feedback
* visa report
ACTIONS:
* review visa case
* update readiness
* request documents
* assign interview
* review interview
* create visa readiness report
* escalate risk
* add officer note
NEVER:
* guarantee visa
* claim embassy outcome
* invent immigration rules
* expose private sensitive data unnecessarily
ROUTE:
/employee/visa-interview-dashboard
FEATURES:
* interview queue
* scheduled interviews
* AI interview practice
* UKVI-style question bank
* credibility questions
* transcript
* score
* feedback
* risk indicators
* retry history
* officer review
* student-safe report
ACTIONS:
* start interview
* pause interview
* complete interview
* review transcript
* score
* provide feedback
* request another interview
* escalate
AI output must remain educational/practice content.
No visa guarantee.
ROUTE:
/employee/finance-dashboard
KPI:
* Today's Receipts
* Pending Payments
* Outstanding Invoices
* Partner Commission Pending
* Commission Approved
* Refund Requests
* Payment Failures
* Monthly Revenue
MODULES:
* invoices
* payments
* receipts
* refunds
* commissions
* partner payments
* student payment history
* finance reports
* reconciliation
* payment gateway health
ACTIONS depend on permission:
* create invoice
* record payment
* verify payment
* approve refund
* review commission
* export finance report
Finance employee must NOT automatically receive:
* HR salary data
* unrelated employee private data
All financial approval actions audited.
ROUTE:
/employee/marketing-manager-dashboard
Reuse the existing ALO Marketing Manager system.
DO NOT BUILD A SECOND MARKETING SYSTEM.
Features:
* campaigns
* content ideas
* content generator
* content library
* social inbox
* comment-to-lead
* DM-to-lead
* WhatsApp marketing
* campaign calendar
* SEO
* creative studio
* video generator
* campaign ROI
* lead source analytics
* approval queue
* Marketing AgentOS
Marketing Manager can:
* create campaign
* generate content
* edit content
* approve content
* schedule content
* review social messages
* convert social interaction to lead
* assign counselor
* review campaign performance
Publishing requires configured integration and required approval.
ROUTE:
/employee/marketing-dashboard
Features:
* assigned campaigns
* content creation
* content ideas
* social inbox
* campaign calendar
* creative assets
* lead source tracking
* campaign reports
Marketing Officer may NOT:
* modify system marketing permissions
* change integrations
* change provider secrets
* approve own restricted content
* bypass approval workflow
Only assigned campaigns unless broader permission exists.
ROUTE:
/employee/hr-dashboard
KPI:
* Total Employees
* Active Employees
* Pending Profiles
* Profile Corrections
* Leave Requests
* Attendance Today
* Late Employees
* Missing Documents
* Expiring Documents
MODULES:
* employee directory
* employee profile review
* onboarding
* employee documents
* leave
* attendance
* employment status
* HR tasks
* HR reports
HR may access employee private data ONLY with explicit permission.
Salary:
* restricted
* encrypted/restricted storage
* access logged
* view permission required
HR actions:
* approve profile
* request correction
* review documents
* approve leave
* update HR status
* manage onboarding
HR cannot modify Super Admin RBAC unless explicitly granted.
ROUTE:
/employee/branch-manager-dashboard
Only assigned branch data by default.
KPI:
* Branch Leads
* Students
* Applications
* Visa Cases
* Revenue if permitted
* Counselor Conversion
* Follow-ups
* Pending Documents
* Marketing Leads
FEATURES:
* branch employees
* branch students
* branch leads
* applications
* counselor performance
* branch tasks
* appointments
* branch reports
* branch communication
* workload management
Actions:
* assign branch lead
* assign counselor
* reassign within branch
* monitor staff
* approve permitted workflows
* generate branch report
Cannot access another branch unless permission explicitly allows.
ROUTE:
/employee/country-manager-dashboard
Country-specific control.
KPI:
* Leads by Country
* Students
* Applications
* Offers
* Visa Ready
* Refusal Risk
* Upcoming Intake
* University Pipeline
FEATURES:
* country students
* country applications
* university data
* course data
* scholarships
* deadlines
* visa information
* country guide
* counselor assignment
* application team workload
* country reports
Country Manager can manage only assigned countries unless broader permission exists.
ROUTE:
/employee/office-manager-dashboard
Features:
* office attendance
* staff activity
* appointments
* front desk queue
* daily tasks
* student visits
* calls
* branch operations
* office reports
No access to:
* salary unless explicitly permitted
* confidential HR documents
* RBAC
* financial approval unless permitted
ROUTE:
/employee/front-desk-dashboard
Purpose:
Manage reception and first contact.
Features:
* walk-in students
* visitor registration
* new leads
* appointment check-in
* phone enquiries
* basic student lookup
* counselor assignment request
* appointment schedule
* office announcements
Front Desk can create lead/contact.
Front Desk cannot access:
* visa-sensitive information
* salary
* confidential HR data
* finance
* internal notes
* unrestricted student documents
ROUTE:
/employee/support-dashboard
Features:
* support tickets
* student messages
* partner messages where allowed
* technical issues
* document upload assistance
* appointment support
* escalation
* SLA monitoring
Support staff only sees records required for support.
No unrestricted student financial or visa-sensitive information.
ROUTE:
/employee/partner-manager-dashboard
Features:
* partner list
* partner onboarding
* partner approval queue
* partner performance
* partner leads
* partner students
* partner applications
* partner support
* partner marketing quota
* partner seat requests
* partner benefit usage
* partner reports
Actions:
* review partner
* approve partner if permission exists
* suspend partner if permission exists
* review extra seat request
* review marketing quota request
* assign internal counselor
* view partner performance
Must NEVER expose one partner's private data to another partner.
Create reusable:
/employee/tasks
Features:
* my tasks
* overdue
* today
* upcoming
* assigned by manager
* priority
* SLA
* related student
* related lead
* related application
* related partner
* related campaign
Actions:
* complete
* reassign if permitted
* postpone
* add note
* escalate
Create reusable notification system.
Notifications:
* new lead
* assigned student
* document uploaded
* document missing
* application update
* offer received
* visa interview scheduled
* follow-up due
* SLA warning
* task assigned
* approval required
* partner update
* campaign update
* system warning
Notifications must be stored.
No fake notifications.
Use existing Unified Communication Engine.
Supported:
* WhatsApp
* SMS
* Email
* Website Chat
* Student Portal
* Partner Portal
* Social inbox
* Call logs
Every employee sees only permitted conversations.
Every message must be connected to:
* lead
* student
* partner
* application
* campaign
* task
where applicable.
Every communication must create timeline activity.
Every employee has:
/employee/profile
Sections:
Personal Employment Education Emergency Contact Documents Attendance Leave System Activity
Privacy:
Employee: → own profile
HR: → authorized employee HR records
Super Admin: → all with audit
Other employee: → no private profile access unless explicitly permitted.
Every dashboard must use:
canAccessFeature(userId, featureKey)
Additional scopes:
OWN_ONLY ASSIGNED_ONLY BRANCH_ONLY COUNTRY_ONLY DEPARTMENT_ONLY ALL
Examples:
Counselor + Marketing permission: → can access selected marketing features
Application Team + Visa permission: → can access selected visa features
Branch Manager + Counselor permission: → can access counselor functions for branch
Marketing + Finance report permission: → can view only approved finance reports
Never implement permissions only by hiding buttons.
Every employee dashboard MUST work when launched by Super Admin Acting-As.
Example:
Super Admin → Employee Control → Select Counselor → Start Acting-As → Counselor Dashboard opens
Header:
SUPER ADMIN ACTING AS: Counselor Name
Every action:
realActorUserId = Super Admin
actingAsUserId = Counselor
actingAsRole = COUNSELOR
action = actual action
module = actual module
entityId = affected entity
beforeValue
afterValue
timestamp
Audit all sensitive actions.
Examples:
* login
* logout
* profile view
* student view
* document view
* document download
* message send
* lead conversion
* application stage update
* visa-sensitive view
* finance change
* commission approval
* HR change
* salary view
* permission change
* role change
* Acting-As
* export
* AI action
* content publish
* partner quota change
Audit record:
id actorUserId actingAsUserId actingAsRole action module entityType entityId beforeValue afterValue ipAddress userAgent reason createdAt
Reuse existing approval engine if present.
Approval required for:
* sensitive document action
* finance approval
* commission approval
* RBAC change
* public content publish
* bulk messaging
* bulk export
* AI production change
* visa-sensitive operation
* employee suspension
* partner suspension
Statuses:
PENDING APPROVED REJECTED REVISION_NEEDED ESCALATED EXPIRED
Super Admin dashboard must launch every employee dashboard.
Employee launcher card:
* role
* designation
* dashboard
* active users
* pending tasks
* alerts
* status
Buttons:
OPEN DASHBOARD
ACTING-AS
PERMISSIONS
ACTIVITY
AUDIT
Search:
* employee name
* Employee ID
* company email
* role
* department
* branch
* country
* status
Filters:
* active
* suspended
* pending
* resigned
* terminated
* department
* branch
* country
* role
Super Admin/authorized HR/Admin can:
* force password change
* revoke sessions
* suspend account
* reactivate account
* lock account
* unlock account
Employee cannot access system when suspended.
Every security action logged.
Implement/reuse:
canAccessFeature()
hasPermission()
hasRole()
hasScope()
canViewStudent()
canViewPartner()
canViewApplication()
canViewDocument()
canViewSensitiveData()
canActAs()
canApprove()
canExport()
canSendMessage()
canPublish()
canAccessBranch()
canAccessCountry()
Every backend controller must use these checks.
Frontend checks are UX only.
Audit existing APIs first.
Reuse existing routes.
Add only missing APIs.
Required logical API groups:
GET /api/employee/dashboard
GET /api/employee/metrics
GET /api/employee/tasks
GET /api/employee/notifications
GET /api/employee/profile
PATCH /api/employee/profile
GET /api/employee/activity
GET /api/employee/students
GET /api/employee/leads
GET /api/employee/applications
GET /api/employee/documents
GET /api/employee/messages
GET /api/employee/followups
GET /api/employee/appointments
GET /api/employee/reports
POST /api/employee/tasks
PATCH /api/employee/tasks/{id}
POST /api/employee/followups
POST /api/employee/messages
POST /api/employee/documents/request
POST /api/employee/applications
PATCH /api/employee/applications/{id}
POST /api/employee/appointments
Role-specific APIs should be added only where existing APIs do not already provide the required functionality.
Every API:
* authentication
* RBAC
* scope check
* input validation
* audit where sensitive
* safe errors
* transaction where required
FIRST INSPECT EXISTING DATABASE.
Do NOT duplicate existing models.
Reuse:
User Employee Role Permission RolePermission UserPermissionOverride Student Lead Partner Application Document Message Task FollowUp Appointment Notification AuditLog ApprovalRequest Branch Country Department
Add fields only if missing.
Use migrations.
Never silently destroy production data.
Use ALO design language:
WHITE BACKGROUND
ALO BLUE PRIMARY NAVIGATION
ALO ORANGE CTA
SOFT GRAY PAGE BACKGROUND
PREMIUM CRM/SaaS STYLE
Rounded cards
Clean typography
Responsive layout
Desktop + tablet + mobile
PWA compatible
Smooth drawer/modal/popover
Accessible forms
Beautiful timeline
Kanban where useful
Charts where useful
Inbox where useful
No Excel-like giant tables unless genuinely required.
Tables on mobile become cards.
No dark overlay.
No dead buttons.
No fake charts.
No fake KPI.
Common navigation:
Dashboard
My Tasks
Leads
Students
Applications
Documents
Communication
Appointments
Reports
Notifications
Profile
Role-specific navigation appears dynamically.
Example Counselor:
Dashboard Leads Students Applications Documents Follow-ups Appointments Communication Course Finder University Finder Reports
Visa Officer:
Dashboard Visa Cases Interview Queue Documents Risk Review Readiness Reports
Marketing:
Dashboard Campaigns Content Social Inbox Calendar Creative Studio SEO Reports
Finance:
Dashboard Invoices Payments Commissions Refunds Reports
HR:
Dashboard Employees Onboarding Documents Leave Attendance Reports
Employee AI access must be permission-controlled.
Examples:
Counselor AI:
* lead summary
* next action
* course recommendation
* follow-up draft
* student FAQ
Application AI:
* missing document detection
* application checklist
* deadline risk
Visa AI:
* interview practice
* risk summary
* readiness checklist
Marketing AI:
* content generation
* campaign ideas
* social reply suggestions
Finance AI:
* invoice classification
* payment summary
HR AI:
* profile completeness
* document classification
AI must NEVER:
* bypass RBAC
* expose unauthorized data
* publish without approval
* invent facts
* guarantee visa/admission
* modify production without required approval
Every dashboard must query actual existing data.
If there are zero records:
SHOW:
"No records yet"
NOT:
fake student
fake lead
fake revenue
fake campaign
fake application
fake chart
Development seed data may be used ONLY if explicitly marked as development seed data and never presented as production reality.
Every dashboard must have:
loading skeleton
empty state
API error state
retry
permission denied state
offline/PWA state where appropriate
Desktop:
12-column grid.
Tablet:
2-column cards.
Mobile:
1-column cards.
Tables:
Desktop: table
Mobile: stacked cards
Drawers:
mobile full-width
Charts:
responsive
No horizontal overflow.
Do not load every module at once.
Use:
lazy loading
pagination
server-side filtering
server-side search
cached dashboard metrics where appropriate
optimized database queries
indexed foreign keys
avoid N+1 queries
Do not load thousands of students into browser memory.
Mandatory:
authentication
RBAC
scope filtering
server-side authorization
CSRF protection where applicable
input validation
output sanitization
rate limiting where applicable
secure document URLs
protected file storage
masked sensitive information
audit logs
session revocation
safe error responses
No secrets in frontend.
No API keys in source code.
No tokens exposed in browser unnecessarily.
PROVE:
1. Student cannot access employee dashboard.
2. Partner cannot access employee dashboard.
3. Counselor cannot access another counselor's private assigned data unless permission allows.
4. Marketing cannot access salary.
5. Finance cannot access HR private data without permission.
6. Front Desk cannot access visa-sensitive information.
7. Support cannot access unrestricted documents.
8. Branch Manager cannot access another branch without permission.
9. Country Manager cannot access another country without permission.
10. Employee cannot modify RBAC.
11. Employee cannot create Super Admin.
12. Employee cannot bypass approval.
13. Employee cannot publish restricted content.
14. Suspended employee cannot login.
15. Acting-As creates audit log.
16. Acting-As banner appears.
17. Acting-As can be stopped.
18. Permission changes create audit log.
19. Temporary permission expires.
20. Document download creates audit log.
21. Salary view creates audit log.
22. Sensitive visa access creates audit log.
23. Bulk export requires permission.
24. AI cannot bypass permission.
25. AI cannot publish without approval.
26. Employee cannot use another employee's session.
27. Employee cannot access another partner's data.
28. Employee cannot access another branch's data without permission.
29. Employee cannot access another country without permission.
30. API rejects unauthorized requests even if frontend route is manually opened.
COUNSELOR:
Login → Counselor Dashboard → View assigned lead → View assigned student → Create follow-up → Send message → Request document → Create application draft → Audit created
SENIOR COUNSELOR:
Login → Team dashboard → Review counselors → Reassign lead → Review SLA → Audit created
APPLICATION TEAM:
Login → Application dashboard → Open application → Request document → Update application stage → Notify counselor → Audit created
VISA OFFICER:
Login → Visa dashboard → Open visa case → Review checklist → Interview → Create readiness report → Audit created
VISA INTERVIEW OFFICER:
Login → Interview dashboard → Start mock interview → Complete interview → Review transcript → Save result
FINANCE:
Login → Finance dashboard → View authorized payment → Record payment if permitted → Audit created
MARKETING:
Login → Marketing dashboard → Create content → Save draft → Approval workflow
MARKETING MANAGER:
Login → Marketing Manager → Create campaign → Approve content → Schedule → Report
HR:
Login → HR dashboard → Review employee profile → Review document → Audit created
Unauthorized salary access: DENIED
BRANCH MANAGER:
Login → Branch dashboard → View branch students → Assign counselor → Branch report
COUNTRY MANAGER:
Login → Country dashboard → View country students → View applications → Country report
OFFICE MANAGER:
Login → Office dashboard → View office operations → Manage permitted tasks
FRONT DESK:
Login → Front Desk → Register visitor → Create lead → Appointment → Cannot access sensitive data
SUPPORT:
Login → Support dashboard → Open support ticket → Message student → Escalate
PARTNER MANAGER:
Login → Partner dashboard → View assigned partners → Review partner request → Cannot expose partner-to-partner data
SUPER_ADMIN:
Login → Super Admin Dashboard
Select:
Counselor → Open Dashboard → Acting-As
Marketing Manager → Open Dashboard → Acting-As
Visa Officer → Open Dashboard → Acting-As
Application Team → Open Dashboard → Acting-As
Finance → Open Dashboard → Acting-As
HR → Open Dashboard → Acting-As
Branch Manager → Open Dashboard → Acting-As
Every action must be logged.
Stop Acting-As must immediately terminate the acting session.
FIRST FIND EXISTING COMPONENTS.
Possible reusable components:
EmployeeDashboard DashboardShell KpiCard DataTable Kanban Timeline TaskPanel NotificationPanel CommunicationInbox StudentDrawer LeadDrawer ApplicationDrawer DocumentViewer ApprovalDrawer RoleGuard PermissionGuard ActingAsBanner AuditLogViewer
If equivalent component exists:
REUSE IT.
Do not create:
EmployeeDashboard2 StudentDashboardNew MarketingDashboardFinal2 ApplicationDashboardNew2
Avoid duplicate architecture.
PHASE 1: AUDIT
Inspect:
routes pages components backend API database Prisma RBAC auth audit existing dashboards
Produce matrix:
FEATURE STATUS EXISTING FILE EXISTING API DATABASE RBAC AUDIT ACTION REQUIRED
PHASE 2: COMMON EMPLOYEE SHELL
Fix:
auth role routing dashboard shell navigation notifications tasks profile
PHASE 3: COUNSELOR
Build/fix Counselor dashboard.
PHASE 4: APPLICATION
Build/fix Application Team.
PHASE 5: VISA
Build/fix Visa Officer + Interview Officer.
PHASE 6: FINANCE
PHASE 7: MARKETING
Reuse existing Marketing Manager system.
PHASE 8: HR
PHASE 9: BRANCH / COUNTRY / OFFICE
PHASE 10: FRONT DESK / SUPPORT
PHASE 11: PARTNER MANAGER
PHASE 12: CROSS-ROLE PERMISSIONS
PHASE 13: ACTING-AS
PHASE 14: AUDIT
PHASE 15: SECURITY NEGATIVE TESTS
PHASE 16: BUILD / DATABASE VALIDATION
Run according to the existing project stack:
npm install
npm run typecheck
npm run lint
npm run build
npx prisma validate
npx prisma generate
If applicable:
npx prisma migrate status
If backend exists:
node --check backend/server.js
Run existing tests.
Do not invent test results.
Before saying COMPLETE, verify:
[ ] Counselor Dashboard works [ ] Senior Counselor Dashboard works [ ] Application Team Dashboard works [ ] Application Manager Dashboard works [ ] Visa Officer Dashboard works [ ] Visa Interview Dashboard works [ ] Finance Dashboard works [ ] Marketing Dashboard works [ ] Marketing Manager Dashboard works [ ] HR Dashboard works [ ] Branch Manager Dashboard works [ ] Country Manager Dashboard works [ ] Office Manager Dashboard works [ ] Front Desk Dashboard works [ ] Support Dashboard works [ ] Partner Manager Dashboard works
[ ] Common employee shell works [ ] Role-based routing works [ ] Real KPI APIs work [ ] Tasks work [ ] Notifications work [ ] Communication works [ ] Student access works [ ] Lead access works [ ] Application access works [ ] Document access works [ ] Appointment access works
[ ] RBAC enforced backend-side [ ] Scope rules enforced [ ] Branch rules enforced [ ] Country rules enforced [ ] Sensitive data restrictions enforced [ ] Acting-As works [ ] Acting-As banner works [ ] Acting-As audit works [ ] Approval workflow works [ ] Audit logs work [ ] AI permission rules work
[ ] No fake data [ ] No dead buttons [ ] No duplicate dashboards [ ] No duplicate database models [ ] No broken routes [ ] No frontend-only security [ ] No production secrets exposed [ ] Responsive mobile UI [ ] Responsive tablet UI [ ] Desktop UI works
Return an evidence-based implementation report.
SECTION A: EXISTING EMPLOYEE FEATURES FOUND
SECTION B: REUSED COMPONENTS
SECTION C: COUNSELOR DASHBOARD
SECTION D: APPLICATION DASHBOARD
SECTION E: VISA DASHBOARD
SECTION F: FINANCE DASHBOARD
SECTION G: MARKETING DASHBOARD
SECTION H: HR DASHBOARD
SECTION I: BRANCH/COUNTRY DASHBOARDS
SECTION J: OFFICE/FRONT DESK/SUPPORT
SECTION K: PARTNER MANAGER
SECTION L: RBAC
SECTION M: ACTING-AS
SECTION N: AUDIT LOGGING
SECTION O: APIs
SECTION P: DATABASE MODELS/FIELDS
SECTION Q: SECURITY TESTS
SECTION R: FILES CHANGED
SECTION S: BUILD/TYPECHECK/LINT/PRISMA RESULTS
SECTION T: REMAINING ISSUES
For every item report:
STATUS: FULLY_BUILT PARTIALLY_BUILT FIXED NOT_FOUND BLOCKED
EVIDENCE: actual route/file/API/database/test evidence.
ONLY return:
COMPLETE
IF every required employee dashboard and workflow is genuinely operational.
Otherwise return:
NOT COMPLETE
Then list EXACTLY:
1. Missing route
2. Missing UI
3. Missing API
4. Missing database
5. Missing RBAC
6. Missing audit
7. Broken workflow
8. Failed test
9. Build error
10. Remaining external dependency
NEVER say:
"almost complete"
"looks complete"
"UI is ready"
"backend can be added later"
"API can be connected later"
"production ready" without evidence.
AUDIT THE EXISTING ALO EDUCATION WEB_CRM FIRST.
DO NOT REBUILD THE APPLICATION.
DO NOT DELETE EXISTING FEATURES.
DO NOT DUPLICATE EXISTING MODULES.
REUSE EVERYTHING THAT IS ALREADY CORRECT.
PATCH ONLY WHAT IS MISSING.
THEN IMPLEMENT THE COMPLETE EMPLOYEE DASHBOARD OPERATING SYSTEM.
Every employee must receive the correct dashboard based on role + permission + scope.
Every action must go through backend authorization.
Every sensitive action must be auditable.
Super Admin must be able to open and operate every employee dashboard through secure Acting-As Mode.
The system must use real database records and real APIs.
No fake data. No fake buttons. No fake reports. No fake AI. No frontend-only security.
BUILD → CONNECT → TEST → AUDIT → VERIFY.
DO NOT CLAIM COMPLETE UNTIL THE ACCEPTANCE TESTS PASS.


ALO_EMPLOYEE_ACCESS_SYSTEM
PROJECT: ALO EDUCATION ENTERPRISE EMPLOYEE ACCESS, HR, RBAC, PERMISSION, APPROVAL, SECURITY, AUDIT AND WORKFORCE SYSTEM IMPORTANT: This is a PRODUCTION implementation requirement. DO NOT create a demo. DO NOT create mock-only functionality. DO NOT create frontend-only permission checks. DO NOT replace existing functionality. DO NOT redesign unrelated existing CRM pages. DO NOT break the existing CRM. DO NOT modify the Student Dashboard unless explicitly required for integration. Integrate this system into the EXISTING ALO EDUCATION CRM.
                PRIMARY OBJECTIVE
============================================================ Build a complete enterprise-grade Employee Access Control and HR Management System for ALO Education. The system must control:
* Employee accounts
* Employee activation
* Employee profiles
* Employee private information
* Employee roles
* Employee designations
* Departments
* Offices
* Branches
* Reporting managers
* Permissions
* Feature access
* Record-level access
* Field-level access
* Workflow access
* Approval authority
* Employee document management
* HR agreements
* Attendance
* Leave
* Payroll
* Salary
* Devices
* Login security
* Employee communication
* Social media access
* WhatsApp access
* Email access
* Phone/call access
* AI feature access
* Application access
* Student access
* Document access
* Finance access
* Visa access
* Marketing access
* Partner/B2B access
* Quotas
* Audit logs
* Security events
* Temporary permissions
* Permission requests
* Employee suspension
* Employee deactivation
* Employee exit
* Employee replacement/reassignment The system must use: RBAC
* 
ABAC / Scope Control + Object-Level Authorization + Field-Level Authorization + Workflow Authorization + Separation of Duties + Approval Matrix + Audit Trail + Quota Control + Human Approval for High-Risk Actions
            ABSOLUTE SECURITY RULE
============================================================ DO NOT trust the frontend. Hiding a button is NOT authorization. Every sensitive operation MUST be checked by the backend. Every controller/API/service must validate:
1. authenticated user
2. employee status
3. role
4. designation
5. permission
6. department
7. branch
8. assignment
9. record ownership/scope
10. workflow state
11. approval authority
12. temporary access
13. quota
14. feature availability A request must be rejected server-side even if the frontend button is manually invoked. ============================================================ STUDENT DASHBOARD RESTRICTION ============================================================ DO NOT ADD EMPLOYEE HR MANAGEMENT functionality to: STUDENT DASHBOARD The Student Dashboard must remain unchanged. Students may interact with employee-facing features only where existing student workflows explicitly require communication, documents, applications, payments, interview preparation, notifications, etc. Students must NEVER gain access to:
* Employee HR data
* Employee salary
* Employee attendance
* Employee leave
* Employee personal documents
* Employee private profile
* Employee permission system
* Employee audit records
* Employee internal notes
* Employee device records ============================================================ INTERNAL DASHBOARDS ============================================================ Employee Access / HR functionality may be integrated into: Super Admin Admin HR Finance Accounts Marketing Admission Visa Application Compliance Sales Business Development Branch Manager Team Leader Manager Employee Counselor Support Reception IT Operations Partner Management Agent Management University Management Document Officer Interview Team Training QA Call Center and other authorized internal dashboards. Each dashboard must display only the features permitted for that logged-in user. ============================================================ EMPLOYEE DESIGNATIONS ============================================================ Initial supported designations: Chairman CEO Director Office Manager Country Manager Counselor Senior Counselor Application Manager Application Team Visa Officer Finance Officer Marketing Manager Marketing Officer Front Desk HR Manager Support Staff Viewer The architecture MUST support adding future designations. Designation is NOT the same thing as permission. Every designation can have custom permissions. Example: Two Counselors can have different permissions. ============================================================ EMPLOYEE ACCOUNT CREATION ============================================================ Only authorized ALO administrators can create employee accounts. Primary authority: ALO Super Admin Optional delegated authority: HR Manager Admin Chairman ONLY if explicitly granted through permission. Employee account creation form: Full Name Company Email Personal Email Phone Designation Department Office Branch Role Reporting Manager Employment Type Joining Date Permission Package Status Optional: Employee ID Photo Work Schedule Shift Country Timezone After account creation: ACCOUNT_CREATED ↓ ACTIVATION_EMAIL_SENT ↓ EMPLOYEE_ACTIVATES ↓ PASSWORD_CREATED ↓ PROFILE_COMPLETION ↓ DOCUMENT_UPLOAD ↓ PROFILE_SUBMITTED ↓ HR/ADMIN_REVIEW ↓ APPROVED ↓ ACTIVE ============================================================ ACCOUNT STATUS ============================================================ Support: INVITED PENDING_ACTIVATION PENDING_PROFILE PROFILE_SUBMITTED UNDER_REVIEW CORRECTION_REQUIRED APPROVED ACTIVE SUSPENDED INACTIVE TERMINATED REJECTED Never permanently delete employee history. ============================================================ ACTIVATION EMAIL ============================================================ Subject: Activate your ALO Education employee account Email must contain: Employee Name Designation Company Email Activation Link Password Creation Instructions Activation Expiry Support Contact Employee cannot login until password is successfully created. Activation token:
* cryptographically secure
* hashed in database
* one-time use
* configurable expiry
* status tracked
* used_at recorded Expired token: [RESEND ACTIVATION] Only authorized users may resend. ============================================================ EMPLOYEE PERSONAL PROFILE ============================================================ Create a private Employee Profile. Default visibility: Employee ALO Super Admin Chairman HR Manager with explicit permission No other employee can access personal HR information unless explicitly authorized. ============================================================ PERSONAL INFORMATION ============================================================ Store: Employee ID Photo Full Name Father Mother Gender Date of Birth Nationality Religion Blood Group Marital Status NID Passport TIN Driving License Personal Email Official Email Phone Emergency Contact Present Address Permanent Address Bank Account Mobile Banking Education Experience Skills Languages ============================================================ EMPLOYMENT INFORMATION ============================================================ Joining Date Confirmation Date Probation Department Designation Reporting Manager Branch Office Employee Type Employment Status Salary Grade Gross Salary Basic Salary Allowances Tax Provident Fund Insurance Working Hours Shift Weekly Holiday ============================================================ PRIVATE INFORMATION ============================================================ The following must have restricted access: Salary Bank Account Tax Provident Fund Emergency Contact Personal Address NID Passport HR documents Leave records Warning records Termination records Private employee notes Employment agreements Access must be permission-based. ============================================================ PROFILE STATUS ============================================================ Incomplete Submitted Under Review Approved Correction Required Suspended Inactive Terminated ============================================================ EMPLOYEE DOCUMENT CENTER ============================================================ Every employee must have a secure document center. Mandatory/optional document types: Passport NID Photo CV Academic Certificates Experience Letter Appointment Letter Confirmation Letter Increment Letter Promotion Letter Transfer Letter Warning Letter Termination Letter Employment Agreement NDA Confidentiality Agreement Device Agreement IT Policy Data Privacy Agreement International Agreement Bangladesh Employment Agreement Exit Clearance Other HR Documents ============================================================ DOCUMENT DELETE RESTRICTION ============================================================ NO PERMANENT DELETE for official HR documents. Employees may upload documents where permitted. Employees cannot delete official documents. Authorized HR/Admin users may: Review Approve Reject Request Replacement Supersede Archive But historical versions must remain available according to retention policy. ============================================================ DOCUMENT VERSIONING ============================================================ Every official document must support: Version Number Uploaded By Uploaded At Status Reviewer Review Note Effective Date Superseded Date File Hash Audit ID Example: Appointment Letter V1 Appointment Letter V2 Appointment Letter V3 Only one version can be CURRENT. Previous versions remain historical. ============================================================ HR AGREEMENT CENTER ============================================================ Store: Appointment Letter HR Policy Company Policy Leave Policy Salary Policy Notice Policy Provident Fund Policy Gratuity Policy Security Policy Confidentiality Policy International Employment Agreement Bangladesh Employment Agreement Digital Acceptance: Employee Agreement Version Acceptance Date Acceptance IP Acceptance Device Acceptance Timestamp Acceptance history cannot be overwritten. ============================================================ DIGITAL SIGNATURE ============================================================ Support: Document acknowledgement Digital acceptance Timestamp IP Device/session Document version Acceptance record For legally sensitive documents, integrate an appropriate signature provider where required. Do not represent a simple checkbox as a legally valid signature unless legally configured. ============================================================ EMPLOYEE ROLE SYSTEM ============================================================ Roles/designations may include: Chairman CEO Director Office Manager Country Manager Counselor Senior Counselor Application Manager Application Team Visa Officer Finance Officer Marketing Manager Marketing Officer Front Desk HR Manager Support Staff Viewer The system must support: Primary Role Secondary Role Permission Package Custom Permissions Temporary Permissions ============================================================ PERMISSION ACTIONS ============================================================ Permissions must be granular. Supported actions: VIEW CREATE EDIT SUBMIT ACCEPT REJECT APPROVE VERIFY SEND DOWNLOAD UPLOAD EXPORT ASSIGN REASSIGN ARCHIVE CONFIGURE MANAGE ESCALATE GENERATE PUBLISH DELETE DELETE must be separately controlled and should normally mean soft-delete/archive, not permanent destruction. ============================================================ ACCEPTANCE VS APPROVAL ============================================================ These are DIFFERENT permissions. ACCEPT: "I have received/taken responsibility for this task." APPROVE: "I have authority to authorize this action." Example: Counselor ACCEPTS assigned student. Application Officer SUBMITS application. Authorized Manager APPROVES restricted application action. Finance Officer PREPARES payment. Finance Approver APPROVES payment. Employee CANNOT approve their own permission request. ============================================================ SEPARATION OF DUTIES ============================================================ High-risk workflows must use: MAKER → REVIEWER → APPROVER Example: Payment: Finance Officer → creates payment request Reviewer → verifies Authorized Approver → approves The same user must NOT approve their own restricted action. ============================================================ EMPLOYEE PERMISSION MATRIX ============================================================ COUNSELOR: Can: View assigned students Manage assigned students Communicate with students WhatsApp Email Phone Request documents Review documents Reject incorrect student documents Create follow-up tasks Track applications Prepare application information Prepare payment information Prepare interview preparation Escalate cases Cannot by default: Delete official documents Delete students Change protected application stage Approve own restricted actions View employee HR data View salary Approve own payment Change own permissions ============================================================ SENIOR COUNSELOR ============================================================ All permitted Counselor functionality plus: Review counselor work Reassign cases Review SLA Handle escalations Approve permitted operational actions Review document disputes Cannot bypass financial/HR/security controls. ============================================================ APPLICATION OFFICER ============================================================ Can: Create applications Edit authorized application data Manage university requirements Manage offer letters Track conditions Manage application documents Prepare university communication Submit authorized applications Prepare payment information Cannot approve their own restricted financial action. ============================================================ VISA OFFICER ============================================================ Can: Manage visa cases Review visa documents Prepare visa checklist Manage visa workflow Prepare interview guidance Review interview results Record visa decisions Communicate visa requirements AI must not fabricate immigration information. ============================================================ FINANCE OFFICER ============================================================ Can: Create payment records Prepare university payment information Verify receipts Reconcile payments Prepare payment instructions Manage authorized financial records Restricted payment approval requires authorized approver. ============================================================ DOCUMENT OFFICER ============================================================ Can: Review documents Verify documents Reject documents Request replacement Classify documents Manage document checklist Cannot permanently delete official documents. ============================================================ MARKETING OFFICER ============================================================ Can: Marketing dashboard Campaigns Approved social accounts Content creation Approved AI marketing tools Social publishing where authorized Analytics Cannot access confidential HR/visa/finance information unless explicitly permitted. ============================================================ HR MANAGER ============================================================ Can, based on permission: Create employee Review profile Review documents Manage employment records Manage leave Manage attendance Manage agreements Manage employee lifecycle Manage payroll preparation Salary visibility must be separately permission-controlled. ============================================================ FINANCE ============================================================ Finance may access: Payroll Salary calculation Bank sheets Payment Loan Advance Tax Provident Fund Deductions Only authorized finance users can see sensitive calculations. ============================================================ VIEWER ============================================================ VIEWER must be read-only. No: Create Edit Approve Delete Send Export unless explicitly granted. ============================================================ CUSTOM PERMISSION PACKAGE ============================================================ Super Admin can create: Permission Package Name Description Feature Permissions Action Permissions Scope Quota Expiry Approval Requirement Example: COUNSELOR_STANDARD COUNSELOR_SENIOR APPLICATION_MANAGER FINANCE_RESTRICTED VISA_OFFICER MARKETING_STANDARD HR_STANDARD Packages must remain editable. ============================================================ SUPER ADMIN MASTER CONTROL CENTER ============================================================ Route: /admin/access-control-center Sections: ALO Employee Roles Employee Permissions Permission Packages Departments Branches Offices Employee Approval Employee Documents Employee HR Access Salary/Payroll Access AI Feature Access Social Media Access WhatsApp Access Email Access Phone Access Application Access Document Access Visa Access Finance Access Partner Access B2B Visibility Quota Management Audit Logs Security Logs Temporary Permissions Permission Requests ============================================================ SUPER ADMIN CAPABILITIES ============================================================ Super Admin can: Create employee Edit employee Deactivate employee Suspend employee Reactivate employee Assign role Assign designation Assign department Assign branch Assign office Assign manager Assign permission package Create permission package Enable feature Disable feature Set permission scope Grant temporary access Revoke access Review audit Review usage Review security events Super Admin is the master access authority. ============================================================ EMPLOYEE PERMISSION PANEL ============================================================ For each employee: EMPLOYEE DESIGNATION DEPARTMENT BRANCH ROLE STATUS Then: STUDENT APPLICATION DOCUMENT VISA FINANCE HR MARKETING SOCIAL WHATSAPP EMAIL PHONE AI REPORTS EXPORT ADMINISTRATION Each feature: VIEW CREATE EDIT SUBMIT ACCEPT REJECT APPROVE VERIFY SEND DOWNLOAD UPLOAD EXPORT ASSIGN REASSIGN CONFIGURE Each can be: ON OFF ============================================================ ACCESS SCOPE ============================================================ Support: GLOBAL COUNTRY BRANCH OFFICE DEPARTMENT TEAM ASSIGNED OWN RECORD Example: Counselor: ASSIGNED STUDENTS only. Branch Manager: OWN BRANCH. HR: GLOBAL HR records if authorized. Partner: OWN COMPANY only. ============================================================ OBJECT LEVEL SECURITY ============================================================ A permission must identify: USER ROLE FEATURE ACTION OBJECT OBJECT_ID SCOPE Example: COUNSELOR → VIEW → STUDENT → STU-10025 → ASSIGNED Allowed. Same Counselor: STU-99999 → NOT ASSIGNED Denied. ============================================================ FIELD LEVEL SECURITY ============================================================ A user may view a record but not all fields. Example: Counselor can view Student. Cannot view: internal financial notes restricted visa notes private employee information Finance can view authorized financial fields. HR can view authorized employee fields. ============================================================ TEMPORARY ACCESS ============================================================ Support: Permission Start Date End Date Reason Granted By Approved By Automatically revoke after expiry. ============================================================ PERMISSION REQUEST ============================================================ Employee can request: Feature Permission Scope Duration Reason Workflow: REQUESTED → REVIEWING → APPROVED / REJECTED → ACTIVE Approval history must remain. ============================================================ EMERGENCY ACCESS ============================================================ Support controlled: BREAK_GLASS_ACCESS Require: Reason Approver Start Expiry Scope Every action must be audited. ============================================================ ATTENDANCE ============================================================ Support: Clock In Clock Out Present Absent Late Half Day Holiday Leave Working Hours Idle Time Monthly Summary Attendance Calendar Never automatically capture webcam photos. Camera access must require explicit permission. ============================================================ LEAVE SYSTEM ============================================================ Leave types: Casual Leave Annual Leave Medical Leave Maternity Leave Paternity Leave Leave Without Pay Compensatory Leave Track: Balance Request Approval History Dates Reason Documents Approver ============================================================ PAYROLL ============================================================ Generate monthly payroll. Calculate: Attendance Leave Late Holiday Overtime Bonus Allowance Loan Advance Tax Provident Fund Deduction Generate: Salary Slip Payroll Report Bank Sheet ============================================================ PAYROLL AI ============================================================ AI may: Analyze attendance Calculate draft payroll Detect anomalies Prepare payroll draft Prepare salary slip draft Identify missing information Flag inconsistencies AI CANNOT finalize high-risk salary/payment decisions. Workflow: AI PREPARES → HUMAN HR/FINANCE CHECK → HUMAN APPROVAL → FINAL PAYROLL ============================================================ EMPLOYEE DEVICE MANAGEMENT ============================================================ Register: Laptop Desktop Tablet Phone Store: Device Name Serial Number Asset Tag Assigned Date Warranty Status Returned Date Condition ============================================================ LOGIN SECURITY ============================================================ Record: IP Browser Operating System Device Fingerprint where legally appropriate Approximate Location where legally appropriate Login Time Logout Time Failed Login Session History Apply: MFA Session Expiry Login Protection Rate Limiting Suspicious Login Detection ============================================================ EMPLOYEE SOCIAL MEDIA CENTER ============================================================ Every authorized employee dashboard may have: SOCIAL MEDIA CENTER Where permitted: WhatsApp Facebook Instagram LinkedIn X YouTube TikTok Email Other approved channels Access is permission controlled. Employee cannot automatically access every ALO social account. ============================================================ WHATSAPP CENTER ============================================================ WhatsApp is a REQUIRED communication channel where authorized. Employee dashboard can provide: WhatsApp Inbox WhatsApp Messages WhatsApp Calls where provider/platform supports it Documents Images Voice Templates Student-linked conversations Search Follow-up Assignment SLA Unread count ============================================================ WHATSAPP CONTACT MATCHING ============================================================ When a WhatsApp number is received: IF number exists: Match existing student/contact. IF number does not exist: Create a new communication/contact identity. Do NOT create duplicate student records automatically. Use: phone_normalized country_code external_contact_id to identify contacts. If confidence is uncertain: ask/flag for human matching. ============================================================ WHATSAPP DOCUMENT CONTROL ============================================================ Authorized employees may send/upload documents through officially connected WhatsApp channels. Important: A counselor must NOT be able to delete official application documents. Student-submitted documents may be: RECEIVED PENDING_REVIEW ACCEPTED REJECTED REPLACEMENT_REQUIRED REJECT ≠ DELETE ============================================================ COMMUNICATION SLA ============================================================ Every incoming communication may have: Received Time SLA Priority Assigned Employee Due Time Response Time Status If employee does not respond within SLA: Reminder Warning Escalation Repeated SLA violations: 1st 2nd 3rd 4th 5th After configured repeated violations: Manager warning Justification required The system must not unfairly penalize provider outages, system errors or unavailable channels. ============================================================ APPLICATION WORKFLOW ACCESS ============================================================ Applications must use controlled workflow states. Example: LEAD → COUNSELING → DOCUMENT_COLLECTION → DOCUMENT_VERIFICATION → APPLICATION_PREPARATION → APPLICATION_SUBMITTED → OFFER_RECEIVED → CONDITIONS_PENDING → CONDITIONS_MET → PAYMENT_PENDING → PAYMENT_COMPLETED → CAS/COE/etc. → VISA_PREPARATION → VISA_SUBMITTED → VISA_DECISION → COMPLETED Employees cannot arbitrarily jump stages. Each transition requires permission. ============================================================ DOCUMENT REQUIREMENT SYSTEM ============================================================ Every application can have a document checklist. Example: Passport NID Academic Certificate Transcript English Test Financial Documents Bank Documents Sponsor Documents Experience Letter CV Other University Documents Status: MISSING REQUESTED UPLOADED UNDER_REVIEW ACCEPTED REJECTED REPLACEMENT_REQUIRED EXPIRED ============================================================ DOCUMENT FOLLOW-UP ============================================================ If documents are missing: Show checklist/bell/alert. Example: MISSING DOCUMENTS: 4 [Passport] [Bank Statement] [English Certificate] [Experience Letter] Counselor can click a document and: Send Email Send WhatsApp Create Follow-up Add Note Message must use approved templates. ============================================================ OFFER LETTER MANAGEMENT ============================================================ When an offer letter arrives: Record: University Application Student Program Campus Intake Offer Type Conditions Date Received Source Received By Document Version Status Source may include: University Portal University Email Agent Portal API Upload Other Authorized Source Never lose provenance. ============================================================ UNIVERSITY APPLICATION SERIAL ============================================================ Every application must have a unique application number. Example: ALO-UK-2026-000123 All university applications remain consistently numbered. Application record must show: Student University Course Country Intake Application Number Current Stage Documents Offer Conditions Payment Visa Communication Audit ============================================================ TWO TYPES OF APPLICATION COMMENTS ============================================================ Every application must have two separate comment systems.
1. STUDENT-VISIBLE COMMENTS
2. INTERNAL ALO COMMENTS ============================================================ STUDENT-VISIBLE COMMENTS ============================================================ Student-visible comments may be sent to the student. Support: Text Attachment Document Notification Email WhatsApp where authorized If a document is uploaded with a student-visible comment: send notification to student according to configured channel. Example: "Your updated bank document has been uploaded and is now under review." ============================================================ INTERNAL ALO COMMENTS ============================================================ Internal comments are NEVER shown to students. Used for: Counselor notes Manager notes Risk assessment Internal decisions University strategy Visa observations Operational notes Internal comments must have strict access control. ============================================================ UNIVERSITY PAYMENT SYSTEM ============================================================ Before payment: Counselor/Application/Finance team prepares: University Payment Type Amount Currency Deadline Bank Information Account Name Account Number SWIFT IBAN where applicable Payment Reference Invoice Payment Link Payment Method Required Supporting Documents Finance-authorized user verifies information. ============================================================ PAYMENT COMMUNICATION ============================================================ Once verified: Counselor can send student: Payment amount Currency Deadline University Payment method Bank information Payment reference Required documents Instructions Use approved ALO communication template. Never send unverified bank information automatically. Human verification must be required for sensitive payment details. ============================================================ POST-OFFER REQUIREMENT SYSTEM ============================================================ After offer letter: System automatically analyzes university conditions and creates: MANDATORY RECOMMENDED OPTIONAL requirements. Examples: Bank statement Sponsor documents Financial evidence Interview preparation Deposit Tuition payment Additional certificates Affidavit TB test Medical Other country-specific requirements ============================================================ BANK DOCUMENT GUIDANCE ============================================================ AI can prepare guidance for: Bank statement Bank certificate Sponsor letter Financial evidence Source of funds Transaction history The system must clearly label: Official requirement ALO guidance AI-generated explanation Do not fabricate bank requirements. Always use verified current university/country guidance. ============================================================ INTERVIEW PREPARATION ============================================================ System can prepare: University interview questions Country interview questions Visa interview questions Credibility interview questions Financial questions Academic questions Future plan questions Study plan questions Sponsor questions Course knowledge questions University knowledge questions ============================================================ INTERVIEW RESEARCH ENGINE ============================================================ Before generating interview guidance: AI should research available recent information. Target research window: minimum 6 months where reliable data exists. Research: Recent university interview patterns Official university guidance Official visa/immigration guidance Current country requirements Recent student-reported interview themes Known question patterns DO NOT claim access to private or confidential interview data. Do NOT guarantee: "100% visa" "100% pass" "exact questions" The system must state that questions can vary. ============================================================ STUDENT ANSWER PREPARATION ============================================================ Student provides: Financial Plan Future Plan Academic Background Study Reason University Reason Course Reason Career Plan Sponsor Information AI prepares structured answer guidance. Important: Do NOT create false information. Answers must be based on student's real information. ============================================================ INTERVIEW ANSWER FORMAT ============================================================ For each question: Question What the interviewer wants to understand Recommended answer structure Student-specific answer draft Important facts Things to avoid Follow-up questions Practice answer ============================================================ INTERVIEW DOCUMENT DOWNLOAD ============================================================ Student can download interview preparation document. Downloaded document must use: ALO Education official branded document template. Include: ALO Education logo Official header Student name University Course Country Application number Date Version Confidentiality/usage notice where appropriate ============================================================ INTERVIEW PRACTICE WINDOW ============================================================ When student downloads/interview preparation is activated: Start a configurable practice period. Default: 3 days / 72 hours During the period: Student can practice with AI 24/7. Support: Text Voice where technically available Video where technically available AI should behave as an interview practice partner. ============================================================ INTERVIEW AI BEHAVIOR ============================================================ AI must understand: Bangladeshi English Accent variation Pronunciation differences Broken English Slow speech Hesitation Grammar mistakes Code-switching Different speaking speeds Do NOT score students purely on grammar. Evaluate: Content Accuracy Consistency Clarity Confidence Relevance Completeness Pronunciation intelligibility Communication ability AI must distinguish: Language weakness from: Wrong/false information. ============================================================ INTERVIEW SCORING ============================================================ Initial AI assessment may include: Communication Content Confidence Relevance Consistency Question Understanding Answer Quality Pronunciation Intelligibility But: AI preliminary result ≠ final decision. A human reviewer must be able to review the interview. ============================================================ INTERVIEW RECORDING ============================================================ If student consents: Store interview video/audio. Student must be informed: recording purpose storage retention who can access how it is used Access: Student Authorized Interview Team Authorized Counselor Authorized Manager Super Admin according to permission. ============================================================ HUMAN FINAL REVIEW ============================================================ Workflow: Student Practice → AI Preliminary Assessment → Human Interview Team Review → Final Internal Decision AI cannot automatically make a final visa/admission decision. ============================================================ SUCCESS / REVIEW REQUEST ============================================================ After successful visa outcome, where appropriate: Student may be invited to submit: Google Review Facebook Review ALO Education Success Story Use: QR Code Review Link Student Portal Do not force positive reviews. Student must be free to provide an honest review. ============================================================ SUCCESS STORY AUTOMATION ============================================================ If student provides explicit consent and review: Create a Success Story candidate. Possible: Website success page Social media content ALO success gallery Human approval should be available before public publication. ============================================================ STUDENT DOCUMENT SECURITY ============================================================ Students can: Upload documents Download permitted documents View their documents Students cannot: Delete official application documents Delete official HR records Delete application records Change application stages Change verified records ============================================================ APPLICATION DOCUMENT REJECTION ============================================================ Counselor/Application Officer may: Reject student-submitted document Must provide: Reason Optional note Required replacement Rejected document remains in history. Student can upload a replacement into the same document position. Example: Passport Version 1 → REJECTED Version 2 → UNDER REVIEW Version 3 → ACCEPTED Never erase the historical chain. ============================================================ SERVICE CHARGE DECLARATION ============================================================ Before university payment or other configured stage: System may require an official ALO declaration/acknowledgement that clearly states the applicable service-fee arrangement. If ALO policy requires confirmation that no service charge was taken, use an approved legal/compliance template. Do not generate false legal declarations. The document must be approved by authorized ALO management. ============================================================ COURSE FINDER MAPPING ============================================================ Course Finder should include a visual: "ALO 7-Step Journey" When user clicks: [MAPPING / 7 STEPS] generate a branded visual document. The visual must show the actual configured ALO journey. Example:
3. Counseling
4. Course & University Selection
5. Document Preparation
6. Application
7. Offer / Conditions
8. Payment / Visa Preparation
9. Visa / Enrollment Do not hard-code if the existing ALO workflow uses different stages. Allow: View Download Share where authorized ============================================================ HR ANALYTICS ============================================================ HR dashboard: Headcount Attendance Rate Late % Absent % Leave % Payroll Cost Department Cost New Joiners Resignations Probation Employees Upcoming Confirmation Birthdays Work Anniversaries Expiring Contracts Missing Documents ============================================================ ROLE-SPECIFIC HR WIDGETS ============================================================ HR: Pending Leave Payroll Joining Documents Missing Contracts Employee Issues Finance: Payroll Salary Cost Loan Provident Fund Payments Accounts: Payroll Voucher Salary Payment Financial Records Employee: Own Attendance Own Leave Own Salary Slip Own Documents Manager: Team Attendance Team Leave Team Performance IT: Devices Returns Security Alerts Operations: Branch Attendance Branch Leave Branch Staff Super Admin: Complete HR Analytics Employees Branches Documents System Health Payroll Status Security Audit ============================================================ NOTIFICATION ENGINE ============================================================ Notify authorized users about: Employee Joining Profile Submission Correction Required Confirmation Increment Promotion Document Expiry Passport Expiry Visa Expiry Contract Expiry Birthday Work Anniversary Payroll Ready Salary Paid Leave Request Leave Approval SLA Breach Permission Request Permission Approval Permission Rejection Security Alert ============================================================ EMPLOYEE ERROR CONTROL ============================================================ System must track: Human Error System Error Provider Error Student Error University Error Never automatically blame an employee. Every incident: Actor Time Action System Error Workflow Reason Impact must be recorded. ============================================================ AUDIT LOG SYSTEM ============================================================ Audit: LOGIN LOGOUT ACCOUNT_CREATED ACCOUNT_APPROVED ACCOUNT_SUSPENDED ACCOUNT_DEACTIVATED ROLE_CHANGED PERMISSION_GRANTED PERMISSION_REVOKED PROFILE_VIEWED SALARY_VIEWED SALARY_CHANGED DOCUMENT_VIEWED DOCUMENT_DOWNLOADED DOCUMENT_UPLOADED DOCUMENT_REJECTED DOCUMENT_VERIFIED APPLICATION_VIEWED APPLICATION_CHANGED APPLICATION_SUBMITTED PAYMENT_CREATED PAYMENT_VIEWED PAYMENT_APPROVED WHATSAPP_SENT EMAIL_SENT CALL_LOGGED AI_USED AI_RECOMMENDATION AI_APPROVAL EXPORT DOWNLOAD REASSIGNMENT ESCALATION Store: actor_id actor_role action target_type target_id old_value new_value reason approval_id timestamp IP session/device identifier where appropriate ============================================================ NO HISTORY DELETION ============================================================ Never delete: Audit logs Approval history Application history Payment history Document history Employee history Communication history Use archive/soft-delete where applicable. ============================================================ EMPLOYEE DEACTIVATION ============================================================ When employee leaves: Revoke login Revoke sessions Revoke API tokens Revoke WhatsApp access Revoke social access Revoke email integration access Revoke temporary permissions Revoke AI permissions Revoke device access Preserve: Student history Application history Document history Communication history Approval history Audit history ============================================================ WORK REASSIGNMENT ============================================================ Before deactivation: System identifies: Assigned Students Applications Documents Tasks Messages WhatsApp conversations Pending approvals Pending follow-ups Escalations Manager selects replacement. Nothing may silently disappear. ============================================================ AI PERMISSION SYSTEM ============================================================ AI features must also use the same permission engine. Examples: Counselor AI Application AI Visa AI Finance AI HR AI Marketing AI Interview AI Document AI AI can only access data permitted to the logged-in user. AI cannot bypass RBAC. ============================================================ AI ACTION CONTROL ============================================================ AI may: READ ANALYZE SUMMARIZE CLASSIFY DRAFT RECOMMEND PREPARE High-risk actions require human approval: Payment Official university communication Visa communication Document verification Permission changes Employee termination Salary finalization Public publishing ============================================================ PARTNER ACCESS CONTROL ============================================================ Partner system must use the same centralized access engine. Partner roles: Partner Super Admin Partner Employee Partner Counselor Partner Marketing Partner Viewer Partner can access only own organization data. ============================================================ PARTNER PACKAGES ============================================================ STARTER PARTNER: 1 Partner Super Admin 2 Employee seats 15 images/month 10 videos/month 30-second maximum video 3 English mock test vouchers per eligible student 1 interview preparation benefit per eligible student GROWTH PARTNER: Custom seats Custom image quota Custom video quota Optional landing page Additional campaign features PREMIUM PARTNER: Custom agreement Higher quota Dedicated support Advanced integrations All package limits are editable by ALO Super Admin. ============================================================ PARTNER QUOTA ENGINE ============================================================ Track: User Seats Images Videos Video Duration Mock Test Vouchers Interview Preparation Marketing Posts Other configured resources Before action: check quota → allow/reject → record usage ============================================================ EXTRA QUOTA REQUEST ============================================================ Partner requests: Extra Seat Extra Image Quota Extra Video Quota Extra Voucher Other Feature Workflow: REQUESTED → REVIEW → APPROVED / REJECTED Record: requested current limit requested limit reason reviewer review note date ============================================================ PARTNER STUDENT BENEFITS ============================================================ Partner student cannot automatically use restricted ALO benefits. Eligibility rules may require: ALO application eligible university/application approved status benefit availability Example: 3 English mock test vouchers 1 interview preparation benefit Track each voucher. ============================================================ FEATURE ACCESS ENGINE ============================================================ Create backend helpers: canAccessFeature(user_id, feature_key) getQuota(owner_type, owner_id, feature_key) checkQuotaBeforeAction( owner_type, owner_id, feature_key ) recordUsage( owner_type, owner_id, feature_key ) canViewEmployeePrivateProfile( viewer_id, employee_id ) canViewB2BDetails( user_id, application_id ) canUseStudentBenefit( student_id, benefit_type ) canApproveAction( user_id, action_type, target_id ) canAccessApplication( user_id, application_id ) canAccessDocument( user_id, document_id ) canSendCommunication( user_id, channel, target_id ) Every sensitive controller MUST use these checks. ============================================================ DATABASE ============================================================ Create/extend: employees employee_profiles employee_education employee_emergency_contacts employee_salary employee_documents employee_activation_tokens employee_roles employee_permissions employee_permission_packages employee_permission_assignments employee_permission_requests employee_temporary_permissions employee_departments employee_branches employee_offices employee_attendance employee_leave employee_leave_requests employee_payroll employee_payroll_items employee_devices employee_sessions employee_login_logs employee_agreements employee_agreement_acceptances employee_document_versions employee_audit_logs employee_security_events employee_reassignments ============================================================ EMPLOYEES ============================================================ employees: id employee_code user_id full_name company_email personal_email phone designation department_id office_id branch_id joining_date confirmation_date employment_type reporting_manager_id profile_status status created_at updated_at ============================================================ EMPLOYEE PROFILES ============================================================ employee_profiles: id employee_id dob gender marital_status nationality religion blood_group present_address permanent_address photo nid_reference passport_reference tin_reference created_at updated_at Sensitive values must be appropriately encrypted/protected. ============================================================ EMPLOYEE EDUCATION ============================================================ employee_education: id employee_id degree institution passing_year result certificate_path created_at updated_at ============================================================ EMPLOYEE EMERGENCY CONTACT ============================================================ employee_emergency_contacts: id employee_id name relation phone address created_at updated_at ============================================================ EMPLOYEE SALARY ============================================================ employee_salary: id employee_id salary_amount allowance bonus bank_name bank_account payment_method tax_info_reference effective_date visibility created_at updated_at Salary must be protected. ============================================================ EMPLOYEE DOCUMENTS ============================================================ employee_documents: id employee_id document_type file_path status current_version reviewer_id review_note created_at updated_at ============================================================ EMPLOYEE ACTIVATION TOKENS ============================================================ employee_activation_tokens: id employee_id token_hash expires_at used_at status created_at ============================================================ PERMISSION SYSTEM ============================================================ permission definitions: id feature_key action description risk_level requires_approval created_at updated_at ============================================================ FEATURE ACCESS RULES ============================================================ feature_access_rules: id owner_type owner_id feature_key action scope_type scope_id is_enabled limit_value requires_approval created_by updated_by created_at updated_at ============================================================ PARTNER PACKAGES ============================================================ partner_packages: id name description default_user_limit monthly_image_limit monthly_video_limit video_duration_limit_seconds english_mock_voucher_limit interview_prep_limit auto_publish_allowed requires_alo_approval status created_at updated_at ============================================================ PARTNER PACKAGE ASSIGNMENTS ============================================================ partner_package_assignments: id partner_id package_id assigned_by starts_at expires_at status created_at updated_at ============================================================ EXTRA QUOTA REQUESTS ============================================================ extra_quota_requests: id partner_id request_type current_limit requested_limit reason status reviewed_by review_note created_at updated_at ============================================================ SECURITY ============================================================ Implement: RBAC ABAC CSRF Protection Prepared Statements Backend Validation Rate Limiting Secure Sessions MFA where configured Encrypted Sensitive Data Protected File Storage Signed/Authorized Download URLs Access Expiry Audit Logging Soft Delete Version History Never trust: client-provided role client-provided employee ID client-provided permission client-provided branch client-provided approval status ============================================================ FILE STORAGE ============================================================ Sensitive employee documents must NOT be publicly accessible. Do not expose: /uploads/hr/ /uploads/salary/ /uploads/nid/ /uploads/passport/ directly. Use protected download endpoints. Example: GET /api/employee-documents/:id/download Backend checks: authenticated user permission scope document status Then streams/downloads the file. ============================================================ API REQUIREMENT ============================================================ Create secure APIs for: Employee creation Employee activation Employee profile Employee documents Employee document review Employee permissions Permission packages Permission requests Role assignment Attendance Leave Payroll Salary Devices Login history Agreements Audit Partner packages Partner quotas Feature access Usage Notifications Every API must have: authentication authorization validation error handling audit where required ============================================================ NOTIFICATION ENGINE ============================================================ Support: In-App Email WhatsApp where officially configured SMS where configured Do not expose sensitive information in notifications. Example: "Your employee profile requires correction." instead of: "Your NID and salary information are incorrect." ============================================================ COMMUNICATION ACCESS ============================================================ Employees may have: WhatsApp Email Phone SMS Social Media depending on permission. Communication actions must be linked to: Student Lead Application Partner University Task where applicable. ============================================================ SOCIAL MEDIA SECURITY ============================================================ Employee access to official ALO social accounts must be: permission controlled token controlled audited Employee deactivation must trigger: token/session revocation where supported permission removal account disconnect where supported Preserve historical posts/messages. ============================================================ REPORTING SYSTEM ============================================================ Super Admin reports: Employee access report Permission changes Employee profile completion Employee document status Salary access audit Payroll status Attendance Leave Security events Login history B2B visibility audit Partner usage Quota usage Voucher usage AI usage Communication usage ============================================================ PARTNER SUPER ADMIN REPORTS ============================================================ Own: Students Applications Employees Leads Marketing Quota Vouchers Performance Cannot view another partner's data. ============================================================ NOTIFICATION RULES ============================================================ Notify ALO Super Admin: Employee profile submitted Employee permission request Sensitive profile accessed Salary accessed Document accessed Partner extra seat request Partner extra quota request Quota exceeded Restricted feature attempt Security alert Repeated SLA breach Notify Partner Super Admin: Quota near limit Quota finished Extra quota approved/rejected Student benefit activated Voucher generated Application submitted/approved ============================================================ HR DASHBOARD ============================================================ Provide: Employee Directory Employee Requests Profile Review Documents Attendance Leave Payroll Agreements Devices Security Reports Analytics ============================================================ SUPER ADMIN DASHBOARD ============================================================ Provide: Total Employees Active Employees Pending Activation Pending Profile Review Pending Permission Requests Suspended Employees Missing Documents Upcoming Contract Expiry Security Alerts Payroll Status Attendance Leave Permission Changes Recent Audit Activity Partner Usage Quota Usage ============================================================ EMPLOYEE DASHBOARD ============================================================ Employee sees: Own Profile Own Documents Own Agreements Own Attendance Own Leave Own Salary Slip Own Devices Own Notifications Own Permission Requests Own Security Sessions Employee cannot view another employee. ============================================================ MANAGER DASHBOARD ============================================================ Manager sees only permitted team information: Team Employees Team Attendance Team Leave Team Tasks Team Performance Pending Approvals No private salary/HR fields unless explicitly permitted. ============================================================ AUDIT REQUIREMENT ============================================================ Audit every: Permission grant Permission revoke Role change Profile access Salary access Document access Document download Document rejection Document verification Application access Payment action Communication action AI action Quota change Partner access B2B access Export Approval Rejection Audit record cannot be modified by ordinary employees. ============================================================ SELF-AUDIT REQUIREMENTS ============================================================ After implementation automatically verify:
10. Super Admin can create employee.
11. Activation email works.
12. Activation token expires.
13. Employee can create password.
14. Employee can complete own profile.
15. Employee can upload required documents.
16. HR can review.
17. Unauthorized user cannot view employee private profile.
18. Unauthorized user cannot view salary.
19. Unauthorized user cannot download NID/passport.
20. Employee cannot delete official HR document.
21. Document version history works.
22. Counselor can access assigned students only.
23. Counselor cannot access unauthorized students.
24. Counselor can reject student-submitted document.
25. Counselor cannot permanently delete document.
26. Student can upload replacement document.
27. Internal comments remain invisible to student.
28. Student-visible comments can notify student.
29. Application stage cannot be changed arbitrarily.
30. Finance can prepare authorized payment.
31. Restricted payment requires authorized approval.
32. Maker cannot approve own action.
33. AI cannot bypass permissions.
34. AI cannot finalize high-risk payroll.
35. Partner can access only own company.
36. Partner seat limits work.
37. Extra seat approval works.
38. Image quota works.
39. Video quota works.
40. Video duration limit works.
41. Voucher limits work.
42. Student benefits require eligibility.
43. WhatsApp access follows permissions.
44. Employee deactivation revokes access.
45. Existing sessions are revoked.
46. Audit records remain.
47. Student Dashboard remains unchanged.
48. Existing CRM functionality remains intact.
49. No frontend-only authorization exists. ============================================================ PRODUCTION ACCEPTANCE ============================================================ Implementation is NOT considered complete if:
* only UI was created
* permissions are frontend-only
* APIs bypass authorization
* salary is publicly accessible
* documents are publicly accessible
* employees can delete official records
* users can approve themselves
* partners can see other partners
* students can access internal data
* AI bypasses permissions
* audit logs are missing
* application stages can be changed without authority
* payment information can be sent without verification
* deactivated employees can continue accessing systems ============================================================ FINAL RULE ============================================================ Build ALO_EMPLOYEE_ACCESS_SYSTEM as ONE centralized enterprise authorization and employee management system. Do not create separate disconnected permission systems for: CRM HR Finance Visa Application Marketing WhatsApp Social Media AI Partner B2B Documents Interview Communication All of them must use the same central authorization engine. The final architecture must support: ROLE
* 
DESIGNATION + PERMISSION + SCOPE + OBJECT + FIELD + WORKFLOW + APPROVAL + QUOTA + TEMPORARY ACCESS + AUDIT ALO Super Admin has master control. Every other user receives only the minimum access required for their job. Use least privilege. Use separation of duties. Preserve history. Protect sensitive information. Never trust the frontend. Never allow unauthorized access through direct API calls. Never allow an employee to approve their own restricted action. Never allow permanent deletion of critical business history. Never allow AI to bypass human authorization. Student Dashboard must remain untouched.
              FINAL IMPLEMENTATION TASK
============================================================ NOW:
1. Inspect the existing ALO Education codebase.
2. Identify existing:
    * authentication
    * users
    * employees
    * roles
    * permissions
    * dashboards
    * CRM
    * applications
    * documents
    * communication
    * WhatsApp
    * email
    * finance
    * partner
    * AI
    * audit systems
3. DO NOT duplicate existing systems.
4. Reuse existing architecture where safe.
5. Extend existing tables/models where appropriate.
6. Create migrations.
7. Create backend authorization engine.
8. Create frontend permission UI.
9. Create Super Admin Access Control Center.
10. Create employee profile system.
11. Create employee document system.
12. Create HR system.
13. Create permission package system.
14. Create approval system.
15. Create audit system.
16. Integrate WhatsApp/social/email permissions.
17. Integrate application/document permissions.
18. Integrate AI permission controls.
19. Integrate partner permission/quota controls.
20. Run backend authorization tests.
21. Run role-by-role security tests.
22. Test direct API access.
23. Test unauthorized document downloads.
24. Test unauthorized salary access.
25. Test self-approval prevention.
26. Test employee deactivation.
27. Test permission revocation.
28. Test quota enforcement.
29. Test audit logging.
30. Test Student Dashboard regression.
31. Fix every discovered issue.
32. Do not stop at creating files.
33. Do not report "implemented" until actual functionality has been verified.
34. Provide evidence-based completion report. ============================================================ DELIVERY REPORT ============================================================ At completion report: A. Files Created B. Files Modified C. Database Tables Added D. Database Migrations E. APIs Added F. Permissions Added G. Roles Added H. Approval Workflows I. Security Controls J. Audit Controls K. Employee Features L. Partner Features M. AI Features N. Communication Features O. Tests Executed P. Tests Passed Q. Tests Failed R. Remaining External Authorization S. Deployment Instructions T. Rollback Instructions IMPORTANT: Do not claim functionality is complete merely because code exists. Only mark a feature COMPLETE after: Implementation
* 
Integration + Backend authorization + UI verification + Database verification + Security verification + Test verification are all complete.
          END OF MASTER SPECIFICATION
============================================================



GLOBAL DESIGN SYSTEM + AI COMMAND CENTER + MARKETING STUDIO + EMPLOYEE KNOWLEDGE + UNIVERSITY DATA + REVIEW AUTOMATION + WEBSITE/WEB CRM CONTROL CENTER ============================================================ ROLE You are the Lead Product Designer, Principal UX Architect, Design Systems Engineer, Senior Full-Stack Engineer, AI Agent Architect, Security Engineer, Data Architect, QA Engineer and Production Release Engineer for ALO Education. You are working on the EXISTING ALO EDUCATION PLATFORM. IMPORTANT: DO NOT rebuild the existing project from zero. DO NOT replace working functionality. DO NOT create a demo. DO NOT create fake data. DO NOT create placeholder AI agents. DO NOT create fake social media integrations. DO NOT create fake Google/Facebook reviews. DO NOT create fake university information. DO NOT remove existing working dashboards. FIRST inspect the entire existing project. If a feature already exists: KEEP IT. IMPROVE IT. EXTEND IT. FIX IT if incomplete. If a feature does not exist: IMPLEMENT IT. If an existing implementation partially satisfies this task: COMPLETE it instead of creating a duplicate system. Do not conduct a meeting. Do not wait for another instruction. Implement the complete task directly. ============================================================ PART 1 — WORLD-CLASS DESIGN RESEARCH ============================================================ Before implementing the new visual system, research current high-quality SaaS, CRM and enterprise product interfaces. Use at least 10 strong references. Study the following categories: • Salesforce • HubSpot • Microsoft Dynamics 365 • Zoho CRM • Linear • Notion • Stripe • Shopify • Intercom • Slack • Asana • Monday.com You may select the strongest 10 after research. IMPORTANT: DO NOT clone any company's interface. DO NOT copy logos. DO NOT copy proprietary illustrations. DO NOT reproduce exact layouts. Study their design principles. Analyze: • Navigation • Sidebar • Top navigation • Dashboard cards • KPI cards • Metric hierarchy • Tables • Filters • Search • Command palettes • Modal design • Drawer design • Forms • Tabs • Status badges • Progress bars • Charts • Empty states • Error states • Loading states • Notification systems • Activity timelines • Approval interfaces • AI interfaces • Settings pages • Permission management • Mobile responsiveness • Typography • Spacing • Border radius • Shadows • Card hierarchy • Color hierarchy • Information density • Accessibility • Dark/light modes Create a NEW ALO Education design language inspired by the best principles across these products. Do not make the interface look like Salesforce, HubSpot, Linear or any single reference. It must look like: ALO Education. ============================================================ PART 2 — ALO EDUCATION DESIGN LANGUAGE ============================================================ Brand identity: ALO Orange: #F37021 Education Blue: #0066CC Sunshine Accent: #FFB347 Create a refined extended palette. Use: Primary Secondary Success Warning Danger Info Neutral Background Surface Border Text Muted text Disabled Create semantic design tokens. Example: --alo-primary --alo-primary-hover --alo-primary-soft --alo-blue --alo-blue-soft --alo-orange --alo-orange-soft --alo-success --alo-warning --alo-danger --alo-info --alo-bg --alo-surface --alo-border --alo-text --alo-muted Do not overuse orange. Orange should communicate ALO identity and important actions. Blue should communicate trust, education and navigation. Use neutral surfaces for enterprise dashboards. ============================================================ PART 3 — TYPOGRAPHY ============================================================ Introduce a professional modern font system. The font must support: • English • Bangla • Numbers • International names • University names Use a high-quality UI font stack. Ensure: • consistent heading hierarchy • readable body text • compact dashboard text • accessible contrast • consistent line height • responsive typography Typography must be part of the design tokens. ============================================================ PART 4 — GLOBAL COMPONENT SYSTEM ============================================================ Create/reuse a unified component library. Components: • Button • IconButton • Input • Search • Select • MultiSelect • DatePicker • FileUploader • Textarea • RichTextEditor • Card • KPI Card • Stat Card • Status Badge • Avatar • Avatar Group • Tooltip • Dropdown • Command Palette • Modal • Drawer • Tabs • Accordion • Table • DataTable • Pagination • Timeline • Activity Feed • Notification • Toast • Alert • Progress • Stepper • Breadcrumb • Empty State • Loading Skeleton • Error State • Approval Card • AI Suggestion Card • AI Agent Card • Source Evidence Card • Document Card • University Card • Course Card • Scholarship Card • Social Post Card • Campaign Card • Review Card • Audit Card Every dashboard must use the same component language.



FINAL PUBLIC WEBSITE — NAVBAR + HOMEPAGE + FOOTER PROMPT Read the existing project first. Do not create duplicate pages/components. Check the existing implementation before changing anything. Build/refine ONLY:
1. Public Navbar
2. Public Homepage
3. Public Footer Do not modify portal/dashboard navigation in this task. ━━━━━━━━━━━━━━━━━━━━
4. PUBLIC NAVBAR ━━━━━━━━━━━━━━━━━━━━ Create a premium, modern ALO Education navbar. Design:
* White background #FFFFFF
* Sticky top
* Thin #E2E8F0 border/shadow
* ALO logo on left
* Clean typography
* Primary blue #0057B8
* CTA orange #E8501A
* No dark background
* No black hero/navbar
* No duplicate login buttons
* Fully responsive Menu: ALO Education → / Destinations ▼
* United Kingdom
* USA
* Canada
* Australia
* Ireland
* New Zealand
* Dubai / UAE
* More Countries Course Finder → /course-finder Services → /services Language Prep ▼
* IELTS
* IELTS UKVI
* PTE Academic
* TOEFL iBT
* Duolingo English Test
* OIETC / ELLT
* Oxford ELLT
* LanguageCert
* Kaplan
* OET
* MOI Guidance
* English Test Comparison Resources ▼
* Blogs
* Articles
* Scholarships
* Visa Guides
* Success Stories
* Application Tips
* Pre-Departure
* FAQs Portals ▼
* Student Portal
* Partner Portal
* Employee Portal Right: Book Free Consultation → /book-consultation Every navbar item MUST have a real working destination. Dropdowns:
* Desktop hover + click
* Mobile accordion
* No broken links
* No empty dropdowns
* No duplicate menu items Mobile:
* Logo
* Hamburger
* Slide/expand menu
* Large touch targets
* Full-width consultation button
* No horizontal overflow ━━━━━━━━━━━━━━━━━━━━
1. HOMEPAGE ━━━━━━━━━━━━━━━━━━━━ Create a world-class premium education consultancy homepage. Use: Background: #FFFFFF Primary Blue: #0057B8 CTA Orange: #E8501A Text: #0F172A Soft Background: #F8FAFC Border: #E2E8F0 Avoid:
* Dark hero overlays
* Large black sections
* Cheap-looking gradients
* Excessive animation
* Empty placeholder sections
* Fake statistics
* Fake testimonials
* Unverified claims Use:
* High-quality country/education imagery
* Clean image cards
* Premium grid cards
* Consistent spacing
* Rounded modern cards
* Subtle shadows
* Strong visual hierarchy
* Responsive layouts
* Elegant hover effects ━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━ White premium hero. Left: "Study Abroad in the World" Dynamic headline: "Study Abroad in [Country] & More" Supporting text: "Honest, verified guidance for Bangladeshi students — from course match to visa decision." Buttons: Book Free Consultation Find Courses Check Eligibility WhatsApp: 01805020101 Right: Large high-quality country image. Automatically rotate: United Kingdom Canada Australia USA Ireland New Zealand Dubai / UAE Every 5 seconds change together:
* Country name
* Country image
* Flag
* Country description
* Popular city
* Popular intake
* CTA destination Use smooth transition. No dark overlay. Pause on hover. Respect prefers-reduced-motion. Manual country dots must work. If an image is unavailable: use a clean generated/owned illustration or elegant country card. Never use copyrighted/stolen imagery. ━━━━━━━━━━━━━━━━━━━━
1. SMART COURSE FINDER ━━━━━━━━━━━━━━━━━━━━ Create a visually strong card immediately below hero. Title: "Find Your Perfect Course" Fields:
* Destination
* Study Level
* Subject
* Intake
* Budget
* English Test Buttons: Find Courses AI Course Match The complete card must link to: /course-finder When a user searches: pass filters through URL/query parameters. Example: /course-finder?country=uk&level=masters&subject=computer-science ━━━━━━━━━━━━━━━━━━━━
1. DESTINATIONS ━━━━━━━━━━━━━━━━━━━━ Create premium country grid cards. Countries: UK USA Canada Australia Ireland New Zealand Dubai / UAE Europe Each card MUST link to a complete country page: /destinations/{country-slug} Each card contains:
* High-quality country image
* Flag
* Country name
* Popular cities
* Popular intakes
* Study levels
* University count
* Course count
* Scholarship availability
* Short description
* View Country Guide
* Find Courses No dead card. Clicking anywhere meaningful on the card should open the country page. ━━━━━━━━━━━━━━━━━━━━
1. SERVICES ━━━━━━━━━━━━━━━━━━━━ Create premium service grid. Cards:
* Personalized Counseling
* University Selection
* Course Matching
* Application Assistance
* SOP & CV Support
* Document Checking
* Visa Guidance
* Interview Preparation
* English Test Preparation
* Financial Planning
* Scholarship Guidance
* Pre-Departure Orientation
* Post-Arrival Support
* Career Counseling EVERY CARD MUST LINK TO ITS OWN COMPLETE SERVICE PAGE. Example: /services/personalized-counselling /services/university-selection /services/course-matching /services/application-assistance /services/sop-cv-support /services/document-checking /services/visa-guidance /services/interview-preparation /services/english-test-preparation /services/financial-planning /services/scholarship-guidance /services/pre-departure /services/post-arrival /services/career-counselling Do not create cards that only show information without navigation. ━━━━━━━━━━━━━━━━━━━━
1. POPULAR COURSES ━━━━━━━━━━━━━━━━━━━━ Create premium 3/4-column course grid. Each course card:
* Course image
* Course name
* University
* Country
* City
* Study level
* Duration
* Tuition
* Intake
* English requirement
* Scholarship badge if verified
* View Course
* Compare
* Apply Every course card links to: /courses/{course-slug} University name links to: /universities/{university-slug} "View All Courses" → /course-finder Only use real database courses. ━━━━━━━━━━━━━━━━━━━━
1. UNIVERSITIES ━━━━━━━━━━━━━━━━━━━━ Premium university grid cards. Each card:
* University name
* Country
* City
* Ranking if available
* Popular subjects
* Intake
* Scholarship availability
* Last verified date
* View University
* View Courses Every university card links to: /universities/{university-slug} University detail page must contain:
* Overview
* Location
* Courses
* Tuition
* Intakes
* Entry requirements
* English requirements
* Scholarships
* Application information
* Related courses Do not use stolen university logos. ━━━━━━━━━━━━━━━━━━━━
1. SCHOLARSHIPS ━━━━━━━━━━━━━━━━━━━━ Create scholarship grid cards. Each card:
* Scholarship name
* Country
* University
* Funding amount
* Eligibility
* Deadline
* Last verified date
* View Details
* Check Eligibility Every card links to: /scholarships/{scholarship-slug} "Find All Scholarships" → /scholarships Only publish verified scholarship information. ━━━━━━━━━━━━━━━━━━━━
1. ENGLISH LANGUAGE TESTS ━━━━━━━━━━━━━━━━━━━━ Create premium test cards. Tests: IELTS IELTS UKVI PTE Academic TOEFL iBT Duolingo OIETC / ELLT Oxford ELLT LanguageCert Kaplan OET MOI Guidance Each card:
* Test name
* Logo/text treatment
* Best for
* Accepted destinations
* Score range
* Result time if verified
* Learn More
* Start Mock Test Every card links to: /language-prep/{test-slug} Add: English Test Comparison → /language-prep/comparison Free Placement Test → /language-prep/placement-test ━━━━━━━━━━━━━━━━━━━━
1. RESOURCES ━━━━━━━━━━━━━━━━━━━━ Create high-quality resource grid. Categories:
* Blogs
* Visa Guides
* Scholarships
* Application Tips
* Pre-Departure
* Accommodation
* Financial Planning
* English Tests
* Student Visa FAQs
* Study Abroad Guides Every resource card MUST link to a complete article/detail page. Example: /resources/blogs/{slug} /resources/visa-guides/{slug} /resources/scholarships/{slug} /resources/application-tips/{slug} No card should be visually clickable but lead nowhere. ━━━━━━━━━━━━━━━━━━━━
1. SUCCESS STORIES ━━━━━━━━━━━━━━━━━━━━ Create elegant student story cards. Only show approved/consented stories. Each card:
* Student name
* Destination
* University
* Course
* Outcome
* Short story
* Read Story Link: /success-stories/{slug} No fabricated testimonials. ━━━━━━━━━━━━━━━━━━━━
1. FINAL CTA ━━━━━━━━━━━━━━━━━━━━ Premium white/light section. "Ready to Start Your Study Abroad Journey?" Buttons: Book Free Consultation Find Courses Check Eligibility WhatsApp Lead form:
* Name
* Phone
* Email
* Country
* Level
* Subject
* Intake
* Budget
* English Test
* English Score
* Message Submit must create a real CRM lead. ━━━━━━━━━━━━━━━━━━━━
1. PUBLIC FOOTER ━━━━━━━━━━━━━━━━━━━━ Footer appears ONLY on public website pages. LEFT: ALO Education Logo Tagline: "From your ambition to admission, we’re with you all the way." Social: Facebook Instagram LinkedIn YouTube DESTINATIONS: United Kingdom United States Australia Canada New Zealand Europe QUICK LINKS: Course Finder Services English Test Prep Blogs COMPANY: About Us Team Find Us Contact Us Every footer link must work. ━━━━━━━━━━━━━━━━━━━━
2. GRADUATION CAP ANIMATION ━━━━━━━━━━━━━━━━━━━━ Under main footer create elegant full-width animation strip. Multiple graduation-cap icons. 3 layers: Layer 1: slow Layer 2: medium Layer 3: slightly faster Movement: left → right Effects:
* gentle translateX
* subtle translateY
* rotation around 5°
* different animation delays
* opacity 100%, 70%, 40% Colors: Orange Blue Gray No bouncing. No chaotic movement. No huge movement. Respect prefers-reduced-motion. ━━━━━━━━━━━━━━━━━━━━
1. BOTTOM FOOTER BAR ━━━━━━━━━━━━━━━━━━━━ Background: #F5F5F5 Left: © ALO Education. All Rights Reserved Right: Cookie Policy ━━━━━━━━━━━━━━━━━━━━
2. CARD-LINK QUALITY RULE ━━━━━━━━━━━━━━━━━━━━ THIS IS CRITICAL. Every grid card used anywhere on the homepage must have a real destination. Country card → Country detail page Course card → Course detail page University card → University detail page Scholarship card → Scholarship detail page Service card → Service detail page English Test card → Test detail page Blog card → Blog detail page Resource card → Resource detail page Success Story card → Story detail page Team card → Team member detail page where applicable Do NOT create decorative cards pretending to be functional. If a detail page does not exist: CREATE THE DETAIL PAGE. Every detail page must contain:
* Real content
* Related records
* Breadcrumb
* CTA
* Contact/consultation option
* Mobile responsive design
* SEO metadata
* Working navigation
* Back/browse pathway ━━━━━━━━━━━━━━━━━━━━
1. QUALITY CHECK ━━━━━━━━━━━━━━━━━━━━ Before reporting completion: Check every homepage section visually. Check every card. Check every card link. Check every navbar item. Check every footer item. Check every CTA. Check mobile navigation. Check country rotation. Check hero images. Check Course Finder navigation. Check database-driven content. Check there are no dead links. Check there are no empty placeholder cards. Check there are no duplicate components. Check there are no fake statistics. Check there are no unverified claims. Check the complete homepage on: Mobile Tablet Desktop FINAL OUTPUT: ALO_PUBLIC_NAVBAR_HOMEPAGE_FOOTER_HIGH_QUALITY_READY



============================================================ ALO EDUCATION UNIFIED UNIVERSITY + COURSE FINDER + COURSE INFO SYSTEM MASTER BUILD SPECIFICATION
PROJECT: ALO Education Web + CRM IMPORTANT: DO NOT rebuild the existing ALO Education project from zero. This is an enhancement and unification task. Use and preserve the existing:
* Country pages
* University pages
* Course Finder
* CRM
* Student Portal
* Partner Portal
* Admin Portal
* Authentication
* RBAC
* Database
* Existing design system
* Existing routes where compatible
* Existing APIs/services
* Existing university/course data Do not delete working functionality. Do not create a second disconnected University database. Do not create a second disconnected Course database. The final result must be ONE unified University + Course database powering:
1. Public University pages
2. Public Course Finder
3. Public Course Information pages
4. Student Course Finder
5. Student Course Information
6. Student shortlist/compare/apply
7. Partner Course Finder
8. Partner Course Information
9. Staff CRM Course Finder
10. Staff University/Course management
11. Super Admin University/Course management
12. Country pages
13. Weekly AI University/Course update system ============================================================
14. CORE ARCHITECTURE ============================================================ Create one canonical data model. COUNTRY ↓ UNIVERSITY ↓ CAMPUS ↓ COURSE ↓ INTAKE ↓ ENTRY REQUIREMENTS ↓ ENGLISH REQUIREMENTS ↓ SCHOLARSHIPS ↓ APPLICATION All public and private interfaces must read from these same database records. Example: University page: /universities/{university_slug} Course Finder: /course-finder Course page: /course/{course_slug} Country page: /destinations/{country_slug} CRM: /crm/universities /crm/courses /crm/course-finder Admin: /admin/universities /admin/courses /admin/import-center Student: /student/course-finder /student/course/{id} /student/shortlist /student/compare /student/apply/{course_id} Partner: /partner/search-programs /partner/program/{id} /partner/apply/{student_id}/{course_id} ============================================================
15. ALO BRAND ============================================================ Background: #FFFFFF Primary Blue: #0057B8 CTA Orange: #E8501A Text: #0F172A Soft Background: #F8FAFC Border: #E2E8F0 Success: #10B981 Warning: #F59E0B Danger: #EF4444 Design requirements:
* Premium education consultancy design
* White-first interface
* No black hero overlay
* No dark overlay
* No placeholder lorem ipsum
* No fake statistics
* Cards must have consistent height
* Buttons minimum 48px height
* Mobile-first
* 1 column mobile
* 2 columns tablet
* 3/4 columns desktop
* Accessible typography
* Keyboard accessible controls
* Clean spacing
* Professional data tables
* Clear empty states
* Clear loading states
* Clear error states ============================================================
1. USER ROLES ============================================================ PUBLIC Can:
* Search courses
* Search universities
* View university pages
* View course pages
* View country pages
* View public tuition
* View public requirements
* View public scholarships
* Compare courses temporarily
* Start application
* Book consultation Cannot see:
* Commission
* Internal notes
* Partner notes
* Staff notes
* Internal risk information
* Student information
* Private university agreements
* Internal source notes

STUDENT Can:
* Everything public users can do
* Save courses
* Shortlist courses
* Compare courses
* See eligibility
* See AI match score
* See missing requirements
* See missing documents
* See scholarship match
* Apply
* Track applications
* Ask counselor Cannot see:
* Commission
* Partner commission
* Internal staff notes
* Internal university agreement
* Other student data

PARTNER Can:
* Search courses
* Search universities
* Select their own student
* Check student eligibility
* View partner-specific course information
* Apply for their own students
* Upload required documents
* Track application
* View their own commission where permitted Cannot see:
* Other partner students
* Other partner commissions
* Internal ALO notes
* Staff risk notes
* Full finance information

STAFF / CRM Based on RBAC permissions can:
* Search universities
* Search courses
* Edit course data
* Verify sources
* Review requirements
* Review applications
* Review data quality
* See internal notes
* See approved internal information
* Manage university/course records

SUPER ADMIN Full access:
* Universities
* Campuses
* Courses
* Intakes
* Requirements
* English requirements
* Scholarships
* Sources
* Imports
* Duplicates
* Update requests
* Approval
* Publishing
* Audit logs
* Commission
* Merge records
* Delete/archive records ============================================================
1. DATABASE ============================================================ Use MySQL. Never hardcode database password. Use environment variables for credentials. Use prepared statements only.

COUNTRIES
countries id country_code name slug flag currency overview visa_overview work_rights cost_of_living status sort_order created_at updated_at
UNIVERSITIES
universities id university_code country_id name slug logo website ranking ranking_source_url city state address overview public_description partner_description international_student_url application_url scholarship_url contact_email admission_notes status visibility source_url last_verified_at last_approved_update_at created_by updated_by created_at updated_at IMPORTANT: University must always connect to country_id. Do not duplicate universities.
CAMPUSES
campuses id university_id country_id name city state address campus_type status created_at updated_at
STUDY LEVELS
study_levels id name slug sort_order status Examples: Foundation International Year One Bachelor Top-up Pre-Masters Masters MBA PhD Diploma Certificate
STUDY AREAS
study_areas id name slug status Examples: Business Computer Science Engineering Healthcare Law Education Hospitality Finance Data Science Artificial Intelligence
DISCIPLINES
disciplines id study_area_id name slug status
COURSES
courses id course_code university_id campus_id country_id study_level_id study_area_id discipline_id name slug description duration_months delivery_mode degree_type tuition_fee currency application_fee deposit_amount average_scholarship min_scholarship max_scholarship deadline ranking_note career_outcomes work_placement_available internship_available co_op_available high_demand fast_offer high_acceptance low_deposit no_interview moi_accepted university_own_english_test application_fee_waiver open_program status visibility source_url last_verified_at last_approved_update_at created_by updated_by created_at updated_at IMPORTANT: Every course MUST have: country_id university_id campus_id when applicable study_level_id study_area_id discipline_id when applicable Never allow an orphan course.
COURSE INTAKES
course_intakes id course_id intake_month intake_year status deadline seats_available created_at updated_at
ENTRY REQUIREMENTS
entry_requirements id course_id qualification_level academic_requirement min_gpa gpa_scale backlog_allowed work_experience_required portfolio_required interview_required remarks source_url last_verified_at created_at updated_at
ENGLISH REQUIREMENTS
english_requirements id course_id test_type overall_score listening_score reading_score writing_score speaking_score no_band_less_than waiver_available remarks source_url last_verified_at created_at updated_at Supported test types: IELTS IELTS UKVI PTE TOEFL Duolingo OIETC Oxford ELLT LanguageCert MOI OET University English Test Other
SCHOLARSHIPS
scholarships id scholarship_code country_id university_id course_id name amount amount_type currency eligibility deadline description source_url last_verified_at status created_at updated_at
COURSE TAGS
course_tags id course_id tag_name tag_type created_at Examples: Scholarship Available Fast Offer High Acceptance Low Deposit MOI Accepted No Interview High Demand Co-op Internship Application Fee Waiver Open Program
APPLICATIONS
applications id application_code student_id partner_id counselor_id course_id university_id campus_id intake_id status review_status document_status payment_status commission_status created_at updated_at
1. UNIVERSITY PAGE ============================================================ PUBLIC ROUTE: /universities/{university_slug} Create ONE unified premium University Information Page. The page must dynamically load the university from database.

UNIVERSITY HERO
Show: University name Country City State Campus Official website University image/logo if legally available Ranking if verified Last verified date Buttons: View Courses Find Courses Check Eligibility Apply Through ALO Book Free Consultation Do not use stolen logos. If official logo is not available or licensing is unclear: Use:
* text-based university identity card
* generated neutral visual
* legally supplied asset Never scrape copyrighted images without permission.

UNIVERSITY OVERVIEW
Show: Overview Location Country City Campus information International student information Official website International student URL Application URL Scholarship URL Only show verified data.
UNIVERSITY QUICK FACTS
Cards: Country City Campus count Course count Popular study areas Popular study levels Intakes Scholarship availability Last verified Counts must come from database. Do not hardcode counts.
POPULAR COURSES
Load courses: WHERE university_id = current university Show: Course name Study level Subject Duration Tuition Scholarship Intakes English requirement Deadline Buttons: View Course Compare Apply CTA: View All Courses
COURSE SEARCH INSIDE UNIVERSITY PAGE
Add filters: Study Level Subject Intake Tuition Scholarship English Test Duration Results must use same Course Finder database.
1. UNIVERSITY ENTRY REQUIREMENTS ============================================================ Show verified requirements. Sections: Foundation Bachelor Top-up Masters MBA PhD Only show levels that actually exist for this university. Do not invent requirements. If requirements are missing: Show: "Requirement information is currently being verified. Please check with an ALO Education counselor." Do not show fake values. ============================================================
2. UNIVERSITY ENGLISH REQUIREMENTS ============================================================ Show course-specific English requirements. Example: IELTS PTE TOEFL Duolingo MOI University English Test IMPORTANT: Never say a university accepts a test unless database/source verification exists. Always show: Source Last verified ============================================================
3. UNIVERSITY TUITION ============================================================ Calculate from actual linked courses. Show: Undergraduate tuition range Postgraduate tuition range MBA tuition range Scholarship range Currency must be displayed. Do not convert to BDT unless exchange rate is verified. If conversion is available: Show: "Indicative BDT estimate" and display exchange rate/date. ============================================================
4. UNIVERSITY SCHOLARSHIPS ============================================================ Load scholarships connected to: university_id Show: Scholarship name Amount Eligibility Deadline Course applicability Source Last verified Button: Check Scholarship Eligibility ============================================================
5. UNIVERSITY INTAKES ============================================================ Load from course_intakes. Show: January May September etc. Only display actual available intakes. Show: Course Intake Deadline Seats if public and verified ============================================================
6. UNIVERSITY APPLICATION PROCESS ============================================================ Show general application steps:
7. Select course
8. Check eligibility
9. Prepare documents
10. Submit application
11. Receive offer
12. Meet conditions
13. Prepare visa documents
14. Complete visa process
15. Pre-departure Do not use country-specific visa terminology incorrectly. Course-specific requirements must override generic content. ============================================================
16. UNIVERSITY FAQ ============================================================ Generate/display database-backed FAQs. Questions may include: What courses are available? What are the tuition fees? Which intakes are available? What English tests are accepted? Are scholarships available? What documents are required? Can international students apply? How do I apply? Can ALO Education help? How long does application processing take? Do not fabricate university-specific claims. ============================================================
17. UNIVERSITY CTA ============================================================ Final CTA: Interested in studying at [University Name]? Buttons: Find Courses Check Eligibility Apply Through ALO Book Free Consultation WhatsApp ALO ============================================================
18. UNIFIED PUBLIC COURSE FINDER ============================================================ ROUTE: /course-finder This is the central course discovery engine. It must search the same courses table used everywhere else.

SEARCH
Search: Course name University Country City Campus Subject
FILTERS
Country City University Campus Study Level Study Area Discipline Intake Year Tuition Range Scholarship Application Fee Deposit Duration Deadline English: IELTS PTE TOEFL Duolingo OIETC Oxford ELLT MOI Quick filters: Open Programs Scholarship Available Low Deposit Fast Offer High Scholarship Popular Courses No Application Fee No Interview MOI Accepted Co-op Internship High Demand
1. PUBLIC COURSE CARD ============================================================ Each card shows: Course name University Country City Campus Study level Subject Duration Tuition Scholarship Deposit Application fee Intakes English requirement Deadline Relevant tags Buttons: View Course Compare Apply Now Book Consultation Save button: If logged out: "Login to Save" Never show: Commission Partner notes Staff notes Internal university agreement ============================================================
2. COURSE INFORMATION PAGE ============================================================ ROUTE: /course/{course_slug} Create one premium unified Course Information page. This is the canonical public course page.

COURSE HERO
Show: Course name University Country City Campus Study level Degree type Duration Quick facts: Tuition Scholarship Deposit Application fee Intake Deadline Buttons: Apply Now Check Eligibility Compare Book Free Consultation
COURSE OVERVIEW
Show: Course description Career outcomes Delivery mode Duration Degree type Internship Placement Co-op Only show values available in database.
TUITION & FEES
Show: Tuition Currency Application fee Deposit Scholarship Show source and verification date. If unavailable: "Fee information requires counselor verification."
INTAKES
Show: Month Year Deadline Status Use course_intakes.
ACADEMIC REQUIREMENTS
Show: Qualification Academic requirement Minimum GPA Backlog rule Work experience Portfolio Interview Only display verified values.
ENGLISH REQUIREMENTS
Table: Test Overall Listening Reading Writing Speaking No band below Waiver Show: Source URL Last verified
DOCUMENTS
Show course-specific document checklist where available: Passport Academic certificates Academic transcripts English test CV SOP Recommendation letters Portfolio Work experience Other Do not claim a document is mandatory unless the database/source says so.
SCHOLARSHIP
Show scholarships linked to course.
CAREER OUTCOMES
Show: Career directions Industry Internship Placement Co-op Do not promise employment.
VISA / INTERNATIONAL STUDENT NOTES
Only show public-safe verified information. Do not provide guaranteed visa claims. Show: "Visa requirements can change. Final requirements must be verified against current official guidance."
SIMILAR COURSES
Recommend based on: same university same subject same country same study level Do not create fake courses.
COURSE CTA
Apply Now Check Eligibility Compare Book Free Consultation WhatsApp ALO
1. STUDENT COURSE FINDER ============================================================ ROUTE: /student/course-finder Same database. Add personalized logic. Student profile inputs: Nationality Education country Highest qualification GPA/CGPA English test English score Study gap Work experience Backlogs Budget Preferred country Preferred subject Preferred intake Calculate: Eligibility Score AI Match Score Labels: Eligible Likely Eligible Need Review Not Eligible Missing Information Never guarantee admission or visa. ============================================================
2. STUDENT COURSE PAGE ============================================================ /student/course/{id} Public course information PLUS: Eligibility score AI match score Missing requirements Missing documents Scholarship match Profile match reasons Visa readiness warning Saved status Buttons: Save Compare Apply Ask Counselor ============================================================
3. STUDENT APPLY ============================================================ When Apply clicked:
4. Verify authentication.
5. Load student profile.
6. Validate course.
7. Validate intake.
8. Check required documents.
9. Create application draft.
10. Link: student_id course_id university_id campus_id intake_id
11. Create document checklist.
12. Create timeline entry.
13. Notify counselor.
14. Redirect to student applications. Do not create duplicate application drafts for same student/course/intake unless intentionally allowed. ============================================================
15. STUDENT SHORTLIST ============================================================ /student/shortlist Show: Saved courses University Country Tuition Scholarship Intake Eligibility Match score Actions: Compare Apply Remove ============================================================
16. STUDENT COMPARE ============================================================ /student/compare Compare maximum sensible number of courses. Columns: University Course Country Study level Duration Tuition Scholarship Deposit Application fee Intake Deadline English Academic requirement Eligibility Match score ============================================================
17. PARTNER COURSE FINDER ============================================================ /partner/search-programs Partner selects ONLY their own student. Search by: Country University City Study level Subject Intake Tuition Scholarship English Academic profile Show: Eligible Need Review Not Eligible Partner can: Save Compare Apply Upload documents Track application Commission: Partner can see ONLY their own permitted commission. Backend must enforce this. ============================================================
18. STAFF CRM COURSE FINDER ============================================================ /crm/course-finder Staff can search all courses. Show internal columns based on permissions: Source Last verified Data quality Internal deadline Risk status Application note University agreement Commission where authorized Add: Duplicate warning Verification warning Missing source warning Expired data warning ============================================================
19. MANUAL UNIVERSITY MANAGEMENT ============================================================ SUPER ADMIN / AUTHORIZED STAFF: /admin/universities Actions: Create Edit View Archive Publish Unpublish Merge duplicate

CREATE UNIVERSITY
/admin/universities/create FORM TABS:
1. Basic Information
2. Location
3. Official Links
4. International Student Information
5. Ranking
6. Description
7. Scholarship
8. Source Verification
9. SEO
10. Visibility
11. Publish Fields: University code University name Country City State Address Logo Website Ranking Ranking source Overview Public description Partner description International student URL Application URL Scholarship URL Contact email Admission notes Source URL Last verified Status Visibility Validation: University name required. Country required. Official website required where available. Source URL required for verified data. ============================================================
12. MANUAL COURSE MANAGEMENT ============================================================ SUPER ADMIN / AUTHORIZED STAFF: /admin/courses Actions: Create Edit View Archive Publish Unpublish Duplicate Merge

CREATE COURSE
/admin/courses/create TABS:
1. Basic Information
2. University & Campus
3. Tuition & Fees
4. Intakes
5. Academic Requirements
6. English Requirements
7. Scholarships
8. Tags
9. Source Verification
10. SEO
11. Visibility
12. Publish

BASIC
Course code Course name Slug Description Study level Study area Discipline Duration Delivery mode Degree type
UNIVERSITY
Country University Campus These must be relational dropdowns. Do not allow free-text university names if matching database entity exists.
FEES
Tuition Currency Application fee Deposit Scholarship Allow: Minimum Maximum Average Never invent exact figures.
INTAKES
Add multiple: Month Year Deadline Seats Status
ACADEMIC REQUIREMENTS
Academic requirement Minimum GPA GPA scale Backlogs Work experience Portfolio Interview Remarks
ENGLISH
Add multiple tests: IELTS PTE TOEFL Duolingo OIETC Oxford ELLT MOI Other Fields: Overall Listening Reading Writing Speaking No band below Waiver Remarks
TAGS
Scholarship Available Fast Offer High Acceptance Low Deposit No Interview MOI Accepted High Demand Co-op Internship Application Fee Waiver Open Program
SOURCE VERIFICATION
Source URL Source name Last verified Verified by Verification status Statuses: Verified Needs Review Expired Unverified If Unverified: Do not display sensitive exact claim publicly.
1. CSV IMPORT CENTER ============================================================ Routes: /admin/import-center/universities /admin/import-center/courses /admin/import-center/scholarships Support: CSV Excel where existing infrastructure supports it Process:
2. Upload
3. Detect columns
4. Validate
5. Preview
6. Show errors
7. Confirm import
8. Save batch
9. Import
10. Report result

UNIVERSITIES CSV
university_code country_code name slug logo website ranking ranking_source_url city state address overview public_description partner_description international_student_url application_url scholarship_url contact_email admission_notes status source_url last_verified_at
COURSES CSV
course_code university_code campus_name country_code study_level study_area discipline name slug description duration_months delivery_mode degree_type tuition_fee currency application_fee deposit_amount average_scholarship min_scholarship max_scholarship deadline career_outcomes work_placement_available internship_available co_op_available high_demand fast_offer high_acceptance low_deposit no_interview moi_accepted university_own_english_test application_fee_waiver open_program status visibility source_url last_verified_at
IMPORT VALIDATION
Before import:
* Required columns
* Country exists
* University exists
* Course code uniqueness
* Numeric fees
* Valid dates
* Valid status
* Valid relationships
* Duplicate detection
* Source validation Show: Total rows Valid rows Invalid rows Duplicate rows Warnings Do not import invalid rows automatically. Save errors. ============================================================
1. DUPLICATE DETECTION ============================================================ University duplicate matching: Normalized university name Country Official website Source URL Course duplicate matching: University Normalized course name Country Study level Official source URL If similar record exists: Do NOT create another record. Show: Possible duplicate detected. Options: View Existing Merge Cancel Create Anyway with Super Admin confirmation Keep history. ============================================================
2. WEEKLY AI UNIVERSITY + COURSE UPDATE AGENT ============================================================ Add weekly update system. The AI agent must check ONLY:
* Official university website
* Official course page
* Official international student page
* Official scholarship page
* Official admissions page Respect: robots.txt rate limits website terms Do not scrape aggressively.

WEEKLY PROCESS
1. Run once per week.
2. Load universities/courses requiring verification.
3. Open official source URLs.
4. Extract relevant current information.
5. Compare against database.
6. Detect changes.
7. Create update_request.
8. Save source URL.
9. Save evidence/reference.
10. Show old value.
11. Show new value.
12. Assign confidence.
13. Wait for Super Admin. AI MUST NOT publish automatically.

DETECT CHANGES
Course name Course status Tuition Currency Intake Deadline Application fee Deposit Academic requirement English requirement Scholarship International student eligibility Course duration Application process University: Website International student page Application URL Scholarship URL Campus Ranking Admission information
UPDATE REQUEST
Create: update_requests id entity_type entity_id field_name old_value new_value source_url evidence confidence status detected_at reviewed_by reviewed_at created_at Statuses: Pending Approved Rejected Edited Needs Manual Review
1. APPROVAL WORKFLOW ============================================================ SUPER ADMIN: /admin/university-data-updates Show: Weekly scan status Last scan Next scan Changes found Pending approval Approved Rejected Needs review Each change: OLD VALUE NEW VALUE SOURCE EVIDENCE CONFIDENCE Actions: Approve Reject Edit Approve & Publish Only after approval: Update database Update Course Finder Update University page Update Course page Update Country page Update CRM Create approval log. ============================================================
2. SOURCE LOGS ============================================================ source_logs id entity_type entity_id source_name source_url source_type checked_at checked_by verification_status notes created_at Source types: Official University Government Official Visa Authority Official Scholarship Other Approved Source For university/course facts: Prefer official university source. ============================================================
3. AUDIT LOG ============================================================ Every create/edit/delete/import/approve/publish/merge action must be logged. audit_logs: user_id role action entity_type entity_id old_value new_value ip_address created_at ============================================================
4. PUBLIC DATA SAFETY ============================================================ Backend-level field filtering. Do NOT rely only on React/UI hiding. Public API must never return: commission internal_notes partner_notes staff_notes private agreements internal risk notes other student data Student API must never return: commission other partner data staff-only information Partner API must return: only own permitted commission. Staff: permission-based fields. Super Admin: full data. ============================================================
5. COURSE SEARCH API ============================================================ Create one canonical course search service. Example: GET /api/courses/search Parameters: q country city university campus study_level study_area discipline intake year min_tuition max_tuition scholarship application_fee deposit english_test english_score duration deadline tag open_program The same service must power: Public Student Partner Staff Role-based response filtering must happen server-side. ============================================================
6. UNIVERSITY API ============================================================ Create canonical university service. Examples: GET /api/universities GET /api/universities/{slug} Include: country campuses course_count study_areas popular_courses scholarships intakes Only return fields allowed by role. ============================================================
7. COURSE API ============================================================ Canonical: GET /api/courses/{slug} Include: University Country Campus Study level Study area Discipline Tuition Scholarship Intakes Academic requirements English requirements Tags Career outcomes Source verification Role-filter response. ============================================================
8. SEO ============================================================ University: Dynamic title: Study at [University] | Courses, Fees, Scholarships & Admissions | ALO Education Course: [Course Name] at [University] | Fees, Requirements & Intakes | ALO Education Use: Canonical URL Meta description OpenGraph Breadcrumb schema University schema where appropriate Course/EducationalOccupationalProgram structured data where appropriate Do not keyword stuff. ============================================================
9. PERFORMANCE ============================================================
* Server-side pagination where appropriate
* Lazy-load images
* Optimized image sizes
* Debounced search
* Indexed database filters
* Avoid N+1 queries
* Cache safe public queries
* No unnecessary heavy JS
* Mobile-first
* Accessible controls Recommended indexes: courses.country_id courses.university_id courses.study_level_id courses.study_area_id courses.status courses.visibility courses.slug course_intakes.course_id entry_requirements.course_id english_requirements.course_id scholarships.course_id scholarships.university_id universities.country_id universities.slug ============================================================
1. MANUAL ADMIN UX ============================================================ University list: Search Country City Status Verified Last updated Actions: View Edit Courses Verify Archive Merge Course list: Search Country University Study Level Subject Intake Status Verification Actions: View Edit Duplicate Verify Archive Bulk actions: Publish Unpublish Verify Update status Export ============================================================
2. EMPTY / ERROR STATES ============================================================ No university: "No universities match your search." No course: "No courses match your current filters." No verified tuition: "Tuition information is currently being verified." No English requirement: "English requirement information is currently being verified." No scholarship: "No verified scholarship is currently listed for this course." Never show fake information. ============================================================
3. DATA QUALITY SCORE ============================================================ Calculate internal quality score based on: University relationship Country relationship Official source Last verified date Tuition Intake Entry requirement English requirement Scholarship Application deadline Example: 90-100: Excellent 70-89: Good 50-69: Needs Review Below 50: Incomplete This score is internal unless explicitly configured for public display. ============================================================
4. UNIVERSITY + COURSE RELATIONSHIP RULE ============================================================ ONE UNIVERSITY: Can have: Many campuses Many courses Many scholarships ONE COURSE: Belongs to: One country One university One campus when applicable One study level One study area One discipline when applicable ONE COURSE: Can have: Many intakes Many academic requirements Many English requirements Many scholarships Many tags ============================================================
5. COUNTRY PAGE INTEGRATION ============================================================ Existing country pages must automatically use unified data. Country page: Top universities Popular courses Tuition range Scholarships Intakes Course Finder CTA All data must be dynamically calculated. Example: Country: United Kingdom Top Universities: Query universities.country_id Popular Courses: Query courses.country_id Scholarships: Query scholarships.country_id Never hardcode course/university lists. ============================================================
6. COURSE FINDER RESULT SORTING ============================================================ Public default sorting: Relevance Popular Lowest Tuition Highest Scholarship Latest Intake Student: Best Match Eligibility AI Match Lowest Tuition Scholarship Partner: Eligibility Offer TAT Scholarship Acceptance Tuition Staff: Data quality Last updated Verification status ============================================================
7. SAVE / COMPARE ============================================================ Public: Temporary compare allowed. Save requires login. Student: course_shortlists course_comparisons Use unique constraints to prevent duplicates. ============================================================
8. APPLICATION CREATION ============================================================ Apply Now: Public: Prompt login or start lead/application process. Student: Create application draft. Partner: Create application for selected own student. Staff: Can create application where permission allows. Every application: student_id course_id university_id intake_id must be linked. ============================================================
9. SECURITY ============================================================ Mandatory: RBAC CSRF Prepared statements Output escaping Input validation Rate limiting for public search/forms Authentication Authorization Audit logs Secure file upload File type validation File size validation Never expose: DB credentials API secrets internal notes commission to unauthorized users student information partner information ============================================================
10. NO FAKE DATA ============================================================ Critical rule: If database has verified information: USE DATABASE INFORMATION. If information is not verified: DO NOT INVENT IT. Use: "Check with counselor" or "Data pending verification" or "Needs manual review" Never fabricate: Tuition Scholarship Visa rule Work right English score Admission requirement Ranking Acceptance rate Visa success rate Offer TAT ============================================================
11. NO COPYRIGHT / LOGO VIOLATION ============================================================ University logos: Use only:
* legally provided asset
* official permitted asset
* existing licensed asset If uncertain: Use text-based university identity. Images: Do not copy copyrighted images from university websites. Use licensed images or generated visuals where appropriate. Do not copy university text word-for-word. Summarize and rewrite. ============================================================
1. FINAL SYSTEM FLOW ============================================================ PUBLIC: Homepage ↓ Country ↓ University ↓ Course Finder ↓ Course Information ↓ Check Eligibility ↓ Apply / Consultation STUDENT: Student Profile ↓ Course Finder ↓ AI/Eligibility Match ↓ Course ↓ Shortlist ↓ Compare ↓ Apply ↓ Documents ↓ Application Tracking PARTNER: Partner ↓ Select Own Student ↓ Course Finder ↓ Eligibility ↓ Course ↓ Apply ↓ Documents ↓ Application Tracking ↓ Own Commission STAFF: CRM ↓ Course Finder ↓ University ↓ Course ↓ Verification ↓ Application SUPER ADMIN: Admin ↓ University Management ↓ Course Management ↓ Import Center ↓ Duplicate Detection ↓ AI Update Center ↓ Approval ↓ Publish ↓ Audit Log ============================================================
2. REQUIRED ADMIN PAGES ============================================================ /admin/universities /admin/universities/create /admin/universities/edit/:id /admin/courses /admin/courses/create /admin/courses/edit/:id /admin/import-center/universities /admin/import-center/courses /admin/import-center/scholarships /admin/university-data-updates ============================================================
3. REQUIRED CRM PAGES ============================================================ /crm/universities /crm/university/:id /crm/courses /crm/course-finder /crm/course/:id ============================================================
4. REQUIRED PUBLIC PAGES ============================================================ /universities /universities/:slug /course-finder /course/:slug /destinations/:country /scholarships ============================================================
5. REQUIRED STUDENT PAGES ============================================================ /student/course-finder /student/course/:id /student/shortlist /student/compare /student/apply/:course_id ============================================================
6. REQUIRED PARTNER PAGES ============================================================ /partner/search-programs /partner/program/:id /partner/apply/:student_id/:course_id ============================================================
7. FINAL SELF-AUDIT ============================================================ DO NOT SAY "DONE" UNTIL THESE ARE ACTUALLY TESTED. DATABASE: [ ] University saves correctly [ ] Course saves correctly [ ] Course connects to university [ ] Course connects to country [ ] Course connects to campus [ ] Course connects to study level [ ] Course connects to study area [ ] Course connects to discipline [ ] Intakes connect to course [ ] Requirements connect to course [ ] English requirements connect to course [ ] Scholarships connect correctly [ ] No orphan courses [ ] Duplicate prevention works PUBLIC: [ ] /universities works [ ] /universities/:slug works [ ] /course-finder works [ ] /course/:slug works [ ] Public search works [ ] Filters work [ ] Pagination works [ ] University cards work [ ] Course cards work [ ] Course detail works [ ] Compare works [ ] Apply CTA works [ ] No commission visible [ ] No private data visible STUDENT: [ ] Student search works [ ] Eligibility calculation works [ ] Match score works [ ] Shortlist works [ ] Compare works [ ] Apply creates application [ ] Documents are linked [ ] Counselor notification works [ ] Commission is hidden PARTNER: [ ] Partner can select own student [ ] Other partner students are blocked [ ] Partner search works [ ] Partner eligibility works [ ] Partner application works [ ] Partner sees only own commission STAFF: [ ] CRM search works [ ] University management works [ ] Course management works [ ] Source verification works [ ] Internal fields protected by permission SUPER ADMIN: [ ] Manual university creation works [ ] Manual course creation works [ ] Edit works [ ] Archive works [ ] Publish/unpublish works [ ] CSV import works [ ] Import validation works [ ] Duplicate detection works [ ] Merge works [ ] AI update center works [ ] Approval works [ ] Publish after approval works [ ] Audit logs work AI UPDATE: [ ] Weekly schedule exists [ ] Official sources only [ ] Changes detected [ ] Old/new values shown [ ] Source URL stored [ ] Evidence stored [ ] Update request created [ ] No automatic publishing [ ] Super Admin approval required [ ] Approved data updates all connected pages SECURITY: [ ] No hardcoded DB password [ ] Prepared statements [ ] CSRF protection [ ] RBAC enforced server-side [ ] Commission backend protected [ ] Student data protected [ ] Partner data protected [ ] Admin routes protected [ ] Audit logs working [ ] No secrets exposed in frontend PERFORMANCE: [ ] No N+1 queries [ ] Search is indexed [ ] Images lazy-loaded [ ] Mobile responsive [ ] No console errors [ ] No broken API calls [ ] No broken links [ ] Accessible buttons [ ] Keyboard navigation ============================================================ FINAL DELIVERY REQUIREMENT ============================================================ The final implementation must be ONE unified system: UNIVERSITY DATABASE + COURSE DATABASE + UNIVERSITY PAGE + COURSE FINDER + COURSE INFO PAGE + STUDENT MATCHING + PARTNER SEARCH + CRM MANAGEMENT + SUPER ADMIN MANAGEMENT + CSV IMPORT + DUPLICATE DETECTION + WEEKLY AI UPDATE + SUPER ADMIN APPROVAL + SOURCE VERIFICATION + AUDIT LOG No duplicate systems. No disconnected mock data. No fake information. No hardcoded database credentials. No public commission leakage. No automatic AI publishing. No stolen university logos. No copied university content. Everything must be database-driven. ============================================================ FINAL STATUS OUTPUT ============================================================ Only after live testing and self-audit: ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_READY If anything is incomplete: ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_INCOMPLETE Then list the exact failed items with:
* Route
* Feature
* Database table
* API
* Error
* Required fix Do NOT claim completion based only on code existence. Do NOT claim completion based only on build success. Test the actual live flows. ============================================================


PROJECT: ALO Education Web + CRM MODULE: UNIFIED ENGLISH LANGUAGE PREPARATION + INDIVIDUAL TEST DETAIL SYSTEM IMPORTANT: Do not rebuild the existing ALO Education project from zero. Use the existing:
* Public website
* Navbar
* Country pages
* University pages
* Course Finder
* Course Info pages
* CRM
* Student Portal
* Partner Portal
* Admin system
* Authentication
* RBAC
* Database
* Lead system
* Existing ALO branding Add and integrate the complete English Language Preparation system into the existing architecture. FINAL OUTPUT: ALO_LANGUAGE_PREPARATION_10X_READY ============================================================
1. CORE OBJECTIVE ============================================================ Build a premium, modern, highly visual: /language-prep English Language Preparation landing page. Then create individual test detail pages: /language-prep/ielts /language-prep/ielts-ukvi /language-prep/pte-academic /language-prep/toefl-ibt /language-prep/duolingo /language-prep/oietc /language-prep/oxford-ellt /language-prep/languagecert /language-prep/kaplan /language-prep/oet /language-prep/gre /language-prep/gmat /language-prep/sat /language-prep/act /language-prep/moi The architecture must be dynamic. Do NOT create separate hardcoded page designs for every test. Create:
2. One reusable Language Preparation landing page template.
3. One reusable Test Detail Page template.
4. Database-driven content.
5. Dynamic routing by test slug. Example: /language-prep/ielts and /language-prep/pte-academic must use the same high-quality template while displaying completely test-specific information. ============================================================
6. ALO BRANDING ============================================================ Use: Background: #FFFFFF Primary Blue: #0057B8 CTA Orange: #E8501A Text: #0F172A Soft Background: #F8FAFC Border: #E2E8F0 Success: #10B981 Warning: #F59E0B Danger: #EF4444 Rules:
* Premium white-first design
* No black hero overlay
* No dark image overlay
* No excessive gradients
* No generic template appearance
* No lorem ipsum
* No fake testimonials
* No fake score claims
* No fake acceptance claims
* No fake test pricing
* No unverified result time
* No copied competitor content
* No stolen images
* No stolen logos
* No copyrighted images without permission Use:
* clean cards
* soft shadows
* subtle borders
* rounded corners
* excellent typography
* whitespace
* responsive grids
* micro-interactions
* smooth hover states
* modern iconography
* accessible contrast Buttons: 48px minimum height. Mobile: 1 column. Tablet: 2 columns. Desktop: 3 or 4 columns where appropriate. ============================================================
1. IMPORTANT DESIGN REQUIREMENT ============================================================ The Language Preparation page must feel like a premium education platform. Do NOT make it look like:
* a basic WordPress page
* a text-heavy article
* a generic CRM page
* a collection of cards It should feel like a complete: ENGLISH TEST DISCOVERY + PREPARATION + COMPARISON + COUNSELLING HUB. The user should immediately understand: "What English test do I need?" "What score do I need?" "Which test is suitable for my destination?" "How long does preparation take?" "How does ALO help me?" "Can I practice?" "Can I compare tests?" "Can I speak with a counselor?" ============================================================
1. GLOBAL SIDE TEST PREPARATION WIDGET ============================================================ IMPORTANT SPECIAL REQUIREMENT: Throughout the website, whenever relevant, show a small reusable side/card widget promoting English Test Preparation. This widget should NOT dominate the page. Create reusable component: <TestPreparationMiniCard />
Example design:
TEST PREPARATION Prepare for English proficiency tests IELTS PTE OIETC Duolingo TOEFL Find the right test for your university and destination. [View All Test Prep]
Use: White card Blue border/accent Small icon/illustration Compact spacing Premium design CTA: View All Test Prep Route: /language-prep This component may appear beside:
* Country information
* University information
* Course information
* Course Finder results
* Visa preparation
* Application pages
* Student profile
* Relevant resource pages Do not show it on every section. Use intelligently. For example: University page: MAIN CONTENT SIDE COLUMN University information Test Preparation Popular courses Scholarship Entry requirements Consultation Course page: COURSE INFORMATION SIDE COLUMN Requirements Test Preparation Fees Book Consultation Intakes Similar Courses ============================================================
1. LANGUAGE PREPARATION LANDING PAGE ============================================================ ROUTE: /language-prep SECTION ORDER:
2. Hero
3. Test Discovery
4. Why English Proficiency Matters
5. Why Take an English Test
6. Find the Right Test
7. English Test Cards
8. Test Comparison
9. Destination Acceptance Explorer
10. Score Requirement Explorer
11. Preparation Roadmap
12. ALO Preparation Support
13. Practice Tools
14. Student Success Stories
15. FAQ
16. Final CTA
17. Footer ============================================================
18. HERO SECTION ============================================================ Hero must be significantly better than the supplied format. Headline: English Language Preparation Subheadline: Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning. Secondary text: Choose the right English test, understand your target score, prepare strategically, and move closer to your university admission goal. CTA: Book Free Counselling Secondary CTA: Find Your English Test Optional: Take Free English Assessment Hero visual: Create a premium education-focused visual. Possible visual: A student preparation dashboard showing: IELTS PTE TOEFL Duolingo with: Target Score Current Score Preparation Progress Mock Test Speaking Practice Do not use dark overlay. Use white/light visual environment. If suitable legal imagery exists in existing assets, use it. Otherwise create an original illustration/UI visualization. Hero should have floating mini cards: Target Score Preparation Progress Mock Tests Expert Review ============================================================
19. HERO QUICK ACTIONS ============================================================ Under hero: [Find My Test] [Check Required Score] [Compare Tests] [Book Counselling] ============================================================
20. TEST DISCOVERY SECTION ============================================================ Headline: Which English Test Is Right for You? Description: The right test depends on your university, destination, course, visa pathway, timeline, and personal strengths. Create an interactive test recommendation tool. Inputs: Destination Study Level University Course Preferred Intake Current English Level Target Score Preferred Test Format Preparation Time Output: Recommended Tests Example: Recommended: IELTS Also Consider: PTE Academic TOEFL iBT Show: Why this test is recommended Acceptance information Estimated preparation path Target score Next action CTA: Explore Test ============================================================
21. WHY ENGLISH PROFICIENCY MATTERS ============================================================ Create premium content section. Headline: Why English Language Proficiency Matters Explain: English proficiency is often an important part of international university admission and, depending on the destination and immigration pathway, may also be relevant to visa or immigration requirements. ALO helps students understand:
* university requirements
* course-specific requirements
* destination-specific requirements
* test selection
* target score
* preparation strategy
* documentation Do not claim every visa requires an English test. Use: "Requirements vary by country, visa route, university and course." ============================================================
1. WHY TAKE AN ENGLISH TEST ============================================================ Create 4 premium cards:
2. Meet Admission Requirements
3. Strengthen Your Application
4. Prepare for Academic Study
5. Plan Your Study Abroad Journey Each card: Icon Heading 2-3 lines Learn More ============================================================
6. FIND THE CORRECT TEST ============================================================ Create visual 4-step journey: STEP 01 Choose Destination STEP 02 Check University Requirements STEP 03 Select Suitable Test STEP 04 Prepare for Target Score Each step should connect logically. ============================================================
7. ENGLISH TEST CARDS ============================================================ Create dynamic cards. Default tests: IELTS IELTS UKVI PTE Academic TOEFL iBT Duolingo English Test OET OIETC Oxford ELLT LanguageCert Kaplan English Test Additional academic tests: GRE GMAT SAT ACT MOI Guidance should be a guidance resource, not incorrectly represented as an English proficiency test. TEST CARD DESIGN: Large test identity. Example: IELTS International English Language Testing System Accepted For: UK Australia Canada USA Ireland New Zealand Europe Test Format: Paper / Computer Duration: ~2h 45m Scoring: Band 0-9 Result Timeline: Show only if verified. Cost: Show only if verified. Best For: University admission / destination-specific requirements Status badge: Popular CTA: Learn More Secondary: Compare IMPORTANT: Do not hardcode current price/result time unless verified. If not verified: "Check current provider information" Do not invent data. ============================================================
8. TEST CARD VISUAL DESIGN ============================================================ Each card should contain: Test icon/logo only if legally usable. Otherwise: Text-based branded visual. Use: Top: Test name Middle: Short explanation Data grid: Duration Scoring Results Format Acceptance chips Bottom: [Learn More] [Compare] Cards must be equal height. ============================================================
9. TEST COMPARISON ============================================================ Headline: Compare English Tests Create responsive comparison table. Columns: Test Duration Format Scoring Typical Result Timeline Acceptance Best For Preparation Style Desktop: Full comparison table. Mobile: Scrollable cards. CTA: View Full Comparison ============================================================
10. DESTINATION ACCEPTANCE EXPLORER ============================================================ Create interactive destination selector. Countries: UK Canada Australia USA Ireland New Zealand Dubai/UAE Europe When country is selected: Show relevant English tests from database. Example: UK IELTS IELTS UKVI PTE TOEFL Duolingo Other university-specific options But: DO NOT claim universal acceptance. Display: "Acceptance varies by university, course and visa route." Each test: Accepted by: X verified institutions or if unavailable: "Check university-specific acceptance" ============================================================
11. SCORE REQUIREMENT EXPLORER ============================================================ User selects: Country University Course Study Level System retrieves: English test Minimum overall Minimum component scores Waiver availability Remarks Source URL Last verified Example: IELTS Overall: 6.5 No band below: 6.0 But only if actual course data exists. If data is unavailable: "Requirement not available in database. Check university course page." ============================================================
12. PREPARATION ROADMAP ============================================================ Create visual roadmap: STEP 1 Free Assessment STEP 2 Target Score STEP 3 Diagnostic Test STEP 4 Study Plan STEP 5 Module Practice STEP 6 Mock Tests STEP 7 Expert Feedback STEP 8 Final Readiness Use timeline design. Mobile-friendly. ============================================================
13. ALO EDUCATION LANGUAGE PREPARATION SUPPORT ============================================================ Headline: ALO Education Language Preparation Support Create premium cards: Test Selection Understand which test fits your destination and university. Free Assessment Evaluate your current level. Target Score Planning Set a realistic target based on your course requirement. Study Materials Structured learning resources. Mock Tests Practice under exam-style conditions. Writing Feedback Improve structure, grammar and coherence. Speaking Practice Build confidence and fluency. Score Strategy Focus on the areas that matter most. University-Specific Guidance Check requirements before booking your test. ============================================================
14. PRACTICE TOOLS ============================================================ Create interactive tool cards: IELTS Mock Test PTE Mock Test Speaking Practice Writing Evaluation Reading Practice Listening Practice Vocabulary Builder Grammar Assessment AI Interview Practice English Placement Test If a tool is not actually implemented: Do NOT show it as active. Show: Coming Soon or connect to existing implementation. ============================================================
15. STUDENT PERSONALIZATION ============================================================ If user is logged in: Show: My English Preparation Current Test Target Score Current Score Preparation Progress Recommended Test Upcoming Mock Weakest Module Counselor Recommendation Example: IELTS Target: 7.0 Current estimated: 6.0 Progress: 64% Weakest: Writing CTA: Continue Preparation ============================================================
16. INDIVIDUAL TEST DETAIL PAGE ============================================================ ROUTE: /language-prep/{test_slug} This is the most important page after the landing page. Use one reusable dynamic template. ============================================================
17. TEST DETAIL HERO ============================================================ Example IELTS: IELTS Preparation Prepare strategically to achieve your required IELTS score for university admission and your relevant study/visa pathway. Badges: IELTS Academic General Training if applicable Paper Computer CTA: Book Free IELTS Counselling Secondary: Start IELTS Assessment Right side: Test overview card. Duration Scoring Format Results Acceptance Only show verified data. ============================================================
18. TEST OVERVIEW ============================================================ Headline: IELTS Test Overview Create: Test Details Format Duration Scoring Result timeline Test type Validity information if verified Official provider Modules: Listening Reading Writing Speaking Each module gets: duration question style skills assessed preparation advice Do not invent current test structure. Data should be database-driven and source verified. ============================================================
19. TEST MODULES ============================================================ Create beautiful 4-card module layout. LISTENING READING WRITING SPEAKING Each card: Module icon Duration What it assesses Common challenge Preparation tip Practice CTA ============================================================
20. SCORE SYSTEM ============================================================ Create visual score section. Example IELTS: Band Score 0-9 Explain: Overall score Component scores How scoring works If official scoring data is stored, use database. Otherwise: "See official test provider guidance." ============================================================
21. TEST ACCEPTANCE ============================================================ Section: Where Is This Test Accepted? Show destination cards. UK Australia Canada USA Ireland New Zealand Europe Important: Acceptance is university/course specific. Do not claim universal acceptance. ============================================================
22. TEST FOR UNIVERSITY ADMISSION ============================================================ Create: University Requirement Checker Inputs: Country University Course Output: Required test Minimum score Component requirements Waiver Source Last verified CTA: Find Matching Courses ============================================================
23. TEST FOR VISA / IMMIGRATION ============================================================ Create careful section. Headline: English Tests and Visa Requirements Explain: Visa or immigration requirements vary by country and route. Never say: "IELTS is mandatory everywhere." Instead show verified country-specific information. For each country: Visa relevance Official source Last verified date If no verified data: "Check current official immigration guidance." ============================================================
24. PREPARATION PROCESS ============================================================ Create:
25. Assessment
26. Target Score
27. Study Plan
28. Module Training
29. Mock Tests
30. Feedback
31. Final Assessment
32. Exam Readiness ============================================================
33. IELTS-SPECIFIC CONTENT ============================================================ For IELTS page include: IELTS Academic IELTS General Training IELTS UKVI must be a separate test page if relevant. Explain differences carefully. Do not confuse: IELTS IELTS Academic IELTS General Training IELTS for UKVI Use official source verification. ============================================================
34. IELTS PREPARATION WITH ALO ============================================================ Headline: IELTS Preparation with ALO Education Cards: Free Initial Assessment Target Band Planning Listening Preparation Reading Strategy Writing Feedback Speaking Practice Mock Tests Exam Readiness University Requirement Guidance ============================================================
35. TEST-SPECIFIC PREPARATION PLAN ============================================================ Dynamic based on test. IELTS: Listening Reading Writing Speaking PTE: Speaking & Writing Reading Listening TOEFL: Reading Listening Speaking Writing OET: Listening Reading Writing Speaking Do not blindly reuse IELTS modules for every test. Each test has its own structure. ============================================================
36. TEST SCORE PLANNER ============================================================ Interactive tool. Inputs: Current score Target score Exam date Available study hours/week Output: Target gap Weekly preparation recommendation Module priority Suggested mock schedule Do not claim AI prediction guarantees. ============================================================
37. TEST COMPARISON FROM DETAIL PAGE ============================================================ On every individual test page: "Not sure this is the right test?" Show: Compare with: IELTS PTE TOEFL Duolingo CTA: Compare English Tests ============================================================
38. SIDE WIDGET ============================================================ Every individual test page should have a compact sidebar. Example:

TEST PREPARATION Explore other tests IELTS PTE TOEFL Duolingo OET [View All Test Prep]
Also:
NEED HELP? Not sure which test your university requires? [Book Free Counselling]
On mobile: Move widgets below main content or convert to horizontal cards.
1. SUCCESS STORIES ============================================================ Only display approved real records. Database: success_stories Fields: student country test previous_score final_score destination university course testimonial photo consent_status status Only show: consent_status = approved and status = published Never fabricate scores. If no verified stories: Hide section or show: "Student success stories will appear here after approved publication." ============================================================
2. FAQ ============================================================ Create minimum 15-20 FAQs for each test. IELTS examples: What is IELTS? Which IELTS test do I need? IELTS Academic vs General Training? What is IELTS UKVI? What score do I need? Can I take IELTS on computer? Can I retake IELTS? How long are results valid? Which universities accept IELTS? Does IELTS satisfy visa requirements? Can I apply without IELTS? Is IELTS accepted in Canada? Is IELTS accepted in Australia? Can I use IELTS for the UK? How does ALO help with IELTS? Each test must have test-specific FAQs. ============================================================
3. FINAL CTA ============================================================ Headline: Not Sure Which English Test You Need? Subheadline: Tell us your destination, university and study plan. Our team can help you understand the relevant English requirement and preparation route. Buttons: Book Free Counselling Find My Test Chat with Counselor WhatsApp: +880 180 502 0101 Email: info@aloeducation.com ============================================================
4. LEAD CAPTURE ============================================================ When user clicks: Book Counselling Find My Test English Assessment Test Preparation Create CRM lead. Store: name phone email country university course test target_score current_score intake source source_section Example: source: language_prep source_section: ielts_hero Do not create duplicate leads unnecessarily. ============================================================
5. DATABASE ============================================================ Create or update: english_tests Fields: id name slug short_description long_description test_type provider logo icon official_url format duration_minutes scoring_system result_timeline cost_summary validity_summary best_for status sort_order last_verified_at created_at updated_at english_test_modules id test_id module_name slug duration_minutes description skills_assessed question_format preparation_tips sort_order status english_test_acceptance id test_id country_id acceptance_type summary source_url last_verified_at status english_test_requirements id test_id country_id university_id nullable course_id nullable study_level_id nullable minimum_score component_requirements waiver_available remarks source_url last_verified_at status english_test_faqs id test_id question answer sort_order status english_test_resources id test_id title description resource_type resource_url status english_test_success_stories id test_id student_id nullable student_name country_id university_id course_id previous_score final_score testimonial photo consent_status status language_prep_leads id name phone email country_id university_id course_id test_id current_score target_score intake source source_section status assigned_counselor_id created_at updated_at ============================================================
6. ADMIN LANGUAGE TEST MANAGEMENT ============================================================ Create: /admin/language-tests /admin/language-tests/create /admin/language-tests/edit/:id /admin/language-tests/import Admin tabs: Basic Information Test Format Modules Scoring Acceptance Requirements Preparation Content FAQs Resources Success Stories SEO Sources Publish Super Admin can: Create test Edit test Archive test Reorder tests Add modules Add acceptance rules Add university requirements Add FAQs Add resources Approve content Publish/unpublish ============================================================
7. SOURCE VERIFICATION ============================================================ Every factual test information should support: source_url source_name last_verified_at verified_by verification_status For: duration scoring result timeline acceptance requirements visa relevance test format cost If not verified: DO NOT invent. Show: "Check official provider information." ============================================================
8. SEO ============================================================ Language preparation: Title: English Language Preparation | IELTS, PTE, TOEFL & More | ALO Education Description: Explore English language tests, compare requirements, prepare for university admission, and get expert guidance from ALO Education. Individual: IELTS: IELTS Preparation for Study Abroad | Requirements, Test Format & Guidance | ALO Education Dynamic: {Test Name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education Add: canonical OpenGraph Twitter metadata FAQ schema Breadcrumb schema EducationalOrganization/service structured data where appropriate ============================================================
9. INTERNAL LINKING ============================================================ Language Preparation must connect with: Country pages University pages Course pages Course Finder Scholarships Visa guides Student portal Counselling Examples: Course page: "English Requirement" [Check Accepted Tests] links to: /language-prep and specific test page. University page: "English Requirements" [Explore Test Options] Country page: "English Test Requirements" [Compare English Tests] Course Finder: English Test filter [Learn About Test Requirements] ============================================================
10. COURSE FINDER CONNECTION ============================================================ Course Finder must use: english_requirements When user selects: IELTS show courses accepting IELTS. When: PTE show PTE-compatible courses. When: MOI show only verified MOI-compatible courses. Never assume acceptance. ============================================================
11. STUDENT PORTAL CONNECTION ============================================================ Student profile should store: preferred_test current_test current_score target_score test_date preparation_status Student dashboard: English Preparation Target: IELTS 7.0 Current: 6.0 Progress: 64% Weakest: Writing CTA: Continue Preparation ============================================================
12. PARTNER CONNECTION ============================================================ Partner can see: English requirement Accepted tests Minimum score Waiver availability Source Last verified Partner cannot modify requirements. ============================================================
13. CRM CONNECTION ============================================================ Counselor can see: Student preferred destination University Course Required English test Current score Target score Preparation status Test date Missing requirement Counselor action: Recommend Test Assign Preparation Add Note Book Assessment ============================================================
14. NAVIGATION ============================================================ Public navbar: Language Prep Dropdown: IELTS IELTS UKVI PTE Academic TOEFL iBT Duolingo OET OIETC Oxford ELLT LanguageCert More Tests View All Test Prep ============================================================
15. MOBILE EXPERIENCE ============================================================ Must be excellent on mobile. Requirements:
* no horizontal overflow
* cards stack cleanly
* comparison becomes horizontal scroll
* sticky CTA where useful
* large tap targets
* accessible accordion
* mobile-friendly test selector
* side widgets become bottom cards
* no layout shift ============================================================
1. ACCESSIBILITY ============================================================ Use: semantic HTML ARIA where needed keyboard navigation visible focus state accessible labels proper heading hierarchy alt text sufficient contrast reduced motion support ============================================================
2. PERFORMANCE ============================================================ Do not add heavy unnecessary libraries. Use: lazy images optimized assets code splitting where appropriate minimal JavaScript database pagination server-side filtering where appropriate cached public test data where safe ============================================================
3. SECURITY ============================================================ Use existing authentication and RBAC. Public: read-only public test information. Student: own preparation data. Partner: read-only test requirements. Staff: CRM access according to permission. Admin: manage test information. Super Admin: full management. Use: CSRF prepared statements output escaping authorization checks audit logging Never trust frontend role restrictions. Backend must enforce access. ============================================================
4. NO FAKE CONTENT RULE ============================================================ Absolutely do NOT create fake:
* student success stories
* test scores
* university acceptance claims
* visa claims
* test prices
* result timelines
* university requirements
* scholarship claims If database/source does not contain verified information: Hide the claim OR display: "Information requires verification." ============================================================
1. DESIGN QUALITY TARGET ============================================================ The final page must be at least 10x more polished than the supplied basic format. Improve:
* visual hierarchy
* hero composition
* typography
* cards
* comparison UI
* interactive filters
* destination explorer
* score planner
* preparation roadmap
* micro-interactions
* responsive design
* internal linking
* CTA placement
* sidebar widgets
* mobile experience Do not merely add more text. The quality improvement must be visible in the actual UI. ============================================================
1. FINAL SELF-AUDIT ============================================================ Before declaring complete, verify: [ ] /language-prep works [ ] Every test has dynamic detail route [ ] IELTS page works [ ] PTE page works [ ] TOEFL page works [ ] Duolingo page works [ ] OET page works [ ] Other tests work [ ] Test cards are database-driven [ ] Test comparison works [ ] Destination acceptance explorer works [ ] Score requirement explorer works [ ] Course Finder connects to English requirements [ ] University page connects to English requirements [ ] Course page connects to English requirements [ ] Student English profile works [ ] Counselor can view preparation status [ ] Partner can view requirements [ ] Admin can manage tests [ ] Source verification works [ ] Last verified date appears [ ] Unverified data is not presented as fact [ ] No fake success stories [ ] No fake scores [ ] No fake visa claims [ ] Side Test Preparation widget works [ ] Mobile responsive [ ] Keyboard accessible [ ] No horizontal overflow [ ] No broken links [ ] No console errors [ ] No API errors [ ] No database password hardcoded [ ] RBAC enforced server-side [ ] Audit logs work [ ] Lead capture works [ ] Existing ALO website remains functional [ ] Existing Country Pages remain functional [ ] Existing University Pages remain functional [ ] Existing Course Finder remains functional [ ] Existing CRM remains functional [ ] Existing Student Portal remains functional [ ] Existing Partner Portal remains functional FINAL STATUS: ALO_LANGUAGE_PREPARATION_10X_READY Do NOT say "complete" until the actual routes, database connections, UI interactions, forms, and responsive behavior have been tested.


SERVICES + SCHOLARSHIPS + RESOURCES COMPLETE UNIFIED REQUIREMENTS Build and integrate only these three systems into the existing ALO Education website:
1. Services
2. Scholarships
3. Resources
Do not rebuild the existing website from zero. Use the existing ALO Education architecture, authentication, database, CRM, public navbar, branding, routing, and admin system. The goal is to make these three areas deep, trustworthy, interconnected, searchable, database-driven, and genuinely useful enough that a student can understand the subject independently and then confidently proceed with ALO Education.
	1	GLOBAL ALO DESIGN SYSTEM Use:

Background: #FFFFFF
Primary Blue: #0057B8
CTA Orange: #E8501A
Text: #0F172A
Soft Background: #F8FAFC
Border: #E2E8F0
Success: #10B981
Warning: #F59E0B
Danger: #EF4444
Rules:
* Premium education consultancy design
* White-first interface
* No black/dark hero overlays
* No fake information
* No lorem ipsum
* No fabricated statistics
* No unverified scholarship claims
* No fake success rates
* No stolen/copyrighted images
* Use official sources wherever applicable
* Every factual time-sensitive item must have last_verified_at
* Responsive mobile/tablet/desktop
* Cards should have consistent height
* Buttons minimum height: 48px
* Accessible keyboard navigation
* Proper semantic HTML
* SEO-friendly pages
* Lazy-load images
* Breadcrumb navigation
* Related-content system
* FAQ accordion
* Search where appropriate
* Internal linking between related pages
	2	CORE PRINCIPLE These must NOT be simple grid pages. The architecture must be:

LIST / DIRECTORY
      ↓
DETAIL PAGE
      ↓
COMPLETE INFORMATION
      ↓
FAQ
      ↓
RELATED QUESTIONS
      ↓
RELATED SERVICES
      ↓
RELATED SCHOLARSHIPS
      ↓
RELATED RESOURCES
      ↓
COURSE FINDER / CONSULTATION / APPLICATION
For example:

Services
   ↓
Visa Guidance
   ↓
Complete Visa Guidance Page
   ↓
Country-specific visa information
   ↓
Required documents
   ↓
Timeline
   ↓
Common mistakes
   ↓
FAQs
   ↓
Related resources
   ↓
Related scholarships
   ↓
Book Consultation
The same architecture applies to Scholarships and Resources. 3. SERVICES SYSTEM Public route

/services
/services/{service-slug}
Example:

/services
/services/personalized-counselling
/services/university-selection
/services/course-matching
/services/application-assistance
/services/sop-cv-support
/services/document-checking
/services/visa-guidance
/services/interview-preparation
/services/english-test-preparation
/services/financial-planning
/services/scholarship-guidance
/services/pre-departure-orientation
/services/post-arrival-support
/services/career-counselling
1. SERVICES DIRECTORY PAGE Create a premium /services page. Hero Headline: Complete Support for Your Study Abroad Journey Subtitle: Provide professional guidance from course selection and university applications to visa preparation, pre-departure planning and post-arrival support. CTA:
* Book Free Consultation
* Explore Course Finder
1. SERVICE GRID Create these service cards:
2. Personalized Counseling
3. University Selection
4. Course Matching
5. Application Assistance
6. SOP & CV Support
7. Document Checking
8. Visa Guidance
9. Interview Preparation
10. English Test Preparation
11. Financial Planning
12. Scholarship Guidance
13. Pre-Departure Orientation
14. Post-Arrival Support
15. Career Counseling
Every card MUST link to:

/services/{service-slug}
No dead cards. 6. COMPLETE SERVICE DETAIL PAGE Every service must have its own complete page. Example:

/services/visa-guidance
The page structure should be reusable through database-driven content. Header Show:
* Breadcrumb
* Service category
* Service title
* Short description
* Hero illustration/image
* Book Consultation CTA
* Start Application CTA where applicable
1. SERVICE DETAIL CONTENT Every service page should contain: What This Service Is Explain the service clearly in student-friendly language. Why It Matters Explain why the service is important. Who Needs It? Explain:
* Undergraduate students
* Postgraduate students
* International applicants
* Students changing countries
* Students with study gaps
* Students with complex academic profiles
Only show categories relevant to that service. What ALO Helps With Detailed bullet/list sections. Step-by-Step Process Example:

1. Initial Consultation
2. Profile Assessment
3. Requirement Review
4. Recommendation
5. Document Preparation
6. Submission
7. Follow-up
8. Final Review
Required Documents Dynamic checklist where applicable. Eligibility / Requirements Clearly explain what the student needs. Estimated Timeline Only show verified/general guidance. If timeline varies: Processing times vary by institution, country, intake and applicant circumstances. Confirm your individual timeline with an ALO counselor. Fees If publicly approved: Show service fee. Otherwise: Contact ALO for current service pricing. Never invent a price. 8. SERVICE-SPECIFIC INFORMATION Each service must contain substantially different, relevant information. For example: University Selection Include:
* How university selection works
* Ranking vs suitability
* Location
* Tuition
* Entry requirements
* English requirements
* Scholarships
* Employability considerations
* Intake availability
* Budget matching
* Student profile matching
* Common mistakes
* University comparison
* Final shortlist process
Course Matching Include:
* Subject selection
* Career goals
* Previous education
* Academic eligibility
* Course duration
* Tuition
* Intake
* English requirement
* Career outcomes
* Course Finder connection
* Compare courses
* Application pathway
Application Assistance Include:
* Application process
* Required documents
* Application form
* Document verification
* University submission
* Offer monitoring
* Conditional/unconditional offers
* Deadline management
* Deposit stage
SOP & CV Support Include:
* SOP purpose
* SOP structure
* What universities expect
* Common mistakes
* CV structure
* Academic vs professional CV
* Originality requirements
* Editing process
* Student review process
Do not encourage fabricated experiences or false documents. Document Checking Include:
* Passport
* Academic certificates
* Transcripts
* English test
* Financial documents
* Employment documents
* Sponsor documents
* Translation requirements
* Document consistency
Visa Guidance Include:
* Visa preparation
* Country-specific requirements
* Financial documentation
* Credibility/interview preparation
* Document checklist
* Application preparation
* Common errors
* Official-source verification
Clearly state: Visa rules can change. Current requirements must be verified against official government and visa-authority sources before submission. English Test Preparation Include:
* IELTS
* IELTS UKVI
* PTE
* TOEFL
* Duolingo
* OET
* Other supported tests
Link directly to the existing Language Preparation system. Scholarship Guidance Include:
* Finding scholarships
* Eligibility assessment
* Deadline tracking
* Required documents
* Application strategy
* Scholarship-specific requirements
Link to:

/scholarships
	9	SERVICE FAQ SYSTEM Every service page must have its own FAQ section. Example:

How does ALO help with university selection?
Can ALO compare universities?
How long does the process take?
What documents are required?
Can I use the service before choosing a course?
Can I apply myself after receiving guidance?
FAQs must be database-driven. Clicking a question opens the answer. Use accordion behavior. 10. RELATED QUESTIONS At the bottom of every service page: You May Also Want to Know Show 5-8 related questions. Example:

What documents are needed for UK admission?
Can I study abroad with a study gap?
How do I choose the right university?
Can I apply without IELTS?
How much does studying abroad cost?
How do scholarships work?
Clicking opens the relevant resource/article/FAQ. 11. RELATED CONTENT Every service detail page should dynamically show: Related Services Related Scholarships Related Resources Related Courses Related Countries Do not show unrelated random content. Use database relationships/tags. 12. SERVICE FINAL CTA Every service detail page ends with: Ready to Take the Next Step? Buttons:

Book Free Consultation
Start Course Finder
Check Eligibility
Chat with Counselor
WhatsApp:

+880 180 502 0101
	13	SCHOLARSHIP SYSTEM Routes:

/scholarships
/scholarships/{scholarship-slug}
1. SCHOLARSHIP DIRECTORY Create a premium scholarship discovery page. Hero: Find Scholarships for Your Study Abroad Journey Subtitle: Discover verified scholarship opportunities and understand their eligibility, funding, deadlines and application requirements.
2. SCHOLARSHIP FILTERS Include:
* Country
* University
* Study level
* Subject
* Scholarship type
* Funding type
* Amount
* Fully funded
* Partially funded
* Tuition reduction
* Merit-based
* Need-based
* International students
* Application open
* Deadline
* Intake
* Search
Never show a scholarship as available unless its database status permits publication. 16. SCHOLARSHIP CARD Each card must show:
* Scholarship name
* University
* Country
* Scholarship type
* Funding amount
* Funding description
* Eligibility summary
* Deadline
* Application status
* Last verified date
Buttons:

View Details
Check Eligibility
Every card MUST link to:

/scholarships/{scholarship-slug}
1. SCHOLARSHIP DETAIL PAGE This must be a complete information page, not a short card expanded into a page. Structure: Scholarship Overview
* Scholarship name
* University
* Country
* Study level
* Subject
* Scholarship type
* Funding type
What Does It Cover? Clearly separate:
* Tuition
* Living costs
* Accommodation
* Travel
* Insurance
* Other funding
Only display what is verified. Scholarship Amount Show exact amount where officially verified. Otherwise: Funding varies. Check official scholarship terms. Eligibility Detailed requirements:
* Nationality
* Academic qualification
* GPA/CGPA
* English requirement
* Course eligibility
* Study level
* Financial criteria if applicable
* Other requirements
Minimum Requirements Clearly distinguish:

Minimum academic requirement
English requirement
Course requirement
Application requirement
Additional requirement
Application Opening Date Application Deadline Expected Decision Timeline Only if officially available. Never invent "results within X days." Required Documents Examples:
* Passport
* Academic certificates
* Transcript
* English test
* CV
* SOP/personal statement
* Recommendation letters
* Financial documents
* Other scholarship-specific documents
Only show applicable documents. 18. HOW TO APPLY FOR SCHOLARSHIP Provide a detailed process:

1. Check eligibility
2. Select eligible course/university
3. Review scholarship conditions
4. Prepare documents
5. Complete admission application if required
6. Complete scholarship application
7. Submit before deadline
8. Monitor application
9. Respond to requests
10. Receive decision
Clearly distinguish scholarships that require a separate scholarship application from those automatically considered with admission. 19. SCHOLARSHIP APPLICATION STRATEGY Include:
* How to improve eligibility
* How to prepare documents
* How to write scholarship statements
* How to demonstrate academic achievement
* How to demonstrate leadership/experience where relevant
* Common mistakes
* Deadline planning
* Application checklist
Never promise scholarship success. 20. SCHOLARSHIP STATUS Show:

Open
Closing Soon
Closed
Upcoming
Needs Verification
Use database status. If verification is outdated:

Needs Manual Verification
Do not present it as currently open. 21. SCHOLARSHIP OFFICIAL SOURCE Every scholarship must store:

source_url
source_name
last_verified_at
verification_status
Show: Official information last verified: [date] Provide a link to the official source where appropriate. Do not copy the official page word-for-word. 22. SCHOLARSHIP FAQ Every scholarship detail page must contain scholarship-specific FAQs. Examples:

Who can apply?
Is this scholarship fully funded?
Do I need IELTS?
Can international students apply?
Is a separate application required?
When does the application open?
What is the deadline?
When are results announced?
Can I apply after receiving an offer?
Can I apply for more than one scholarship?
Answers must come from verified database/source information. 23. SCHOLARSHIP RELATED CONTENT At bottom: Related Scholarships Related Universities Related Courses Related Countries Related Services Related Resources Only relevant items. 24. SCHOLARSHIP FINAL CTA

Check My Scholarship Eligibility
Find Matching Courses
Book Free Consultation
Chat with Counselor
	25	RESOURCES SYSTEM Routes:

/resources
/resources/{category}
/resources/{category}/{article-slug}
Supported categories:
* Blogs
* Visa Guides
* Scholarships
* Application Tips
* Pre-Departure
* Accommodation
* Financial Planning
* English Tests
* Student Visa FAQs
* Study Abroad Guides
1. RESOURCE HUB Create a premium resource hub. Hero: Your Complete Study Abroad Knowledge Hub Subtitle: Practical, updated and student-friendly guidance for researching courses, universities, applications, scholarships, visas and life abroad.
	27	RESOURCE SEARCH Search:

Search articles...
Filters:
* Category
* Country
* Study level
* Topic
* Date
* Popular
* Recently updated
1. RESOURCE CARDS Each resource card:
* Category
* Title
* Short summary
* Reading time
* Country/topic
* Last updated
* Last verified where applicable
* Author
* Featured image if legally available
Button:

Read Full Guide
Every card MUST link to its own complete article page. 29. RESOURCE DETAIL PAGE Every article must be comprehensive. Structure:

Breadcrumb
Category
Title
Summary
Last Updated
Last Verified
Author
Table of Contents
Main Content
Important Notes
Action Checklist
FAQ
Related Questions
Related Resources
Related Services
Related Scholarships
Related Courses
Final CTA
	30	TABLE OF CONTENTS For long articles automatically generate a table of contents. Example:

1. Overview
2. Eligibility
3. Required Documents
4. Application Process
5. Costs
6. Timeline
7. Common Mistakes
8. FAQs
Clicking a TOC item scrolls to that section. 31. RESOURCE CONTENT DEPTH Articles must be detailed enough that students do not immediately need to search another website for basic explanations. Where relevant include:
* What it means
* Why it matters
* Who needs it
* Eligibility
* Requirements
* Documents
* Costs
* Timeline
* Step-by-step process
* Examples
* Common mistakes
* What happens next
* Official-source guidance
* Checklist
* FAQs
Do not deliberately hide important information just to force consultation. ALO consultation should be the next step, not a substitute for useful information. 32. VISA RESOURCE EXAMPLE A Visa Guide should cover:
* Visa overview
* Who needs it
* Eligibility
* Financial requirements
* Documents
* Application process
* Fees if verified
* Biometrics
* Interview/credibility process where applicable
* Timeline
* Common refusal reasons
* Common mistakes
* Pre-submission checklist
* Official sources
* FAQs
Country-specific rules must never be mixed together. 33. APPLICATION TIPS EXAMPLE Include:
* How to choose a course
* How to shortlist universities
* How to prepare documents
* How to complete applications
* How to avoid inconsistent information
* How to meet deadlines
* How to respond to offers
* Deposit considerations
* CAS/I-20/COE or equivalent country-specific stages where relevant
1. PRE-DEPARTURE RESOURCE Include:
* Passport
* Visa
* Accommodation
* Flights
* Insurance
* Finance
* Banking
* SIM
* Travel documents
* University documents
* Airport arrival
* Local transport
* Emergency planning
* First-week checklist
1. FINANCIAL PLANNING RESOURCE Include:
* Tuition
* Deposit
* Living costs
* Accommodation
* Insurance
* Visa costs
* Travel
* Banking
* Currency
* Emergency fund
* Budget planning
Do not display fabricated cost figures. If figures are dynamic:

Last verified: [date]
Source: [source]
	36	ENGLISH TEST RESOURCES Connect resources to the existing Language Preparation system. Examples:

/resources/english-tests/ielts
/resources/english-tests/pte
/resources/english-tests/toefl
/resources/english-tests/duolingo
Also connect to:

/language-prep
/language-prep/{test-slug}
The same English test should not have conflicting information across pages. Use one canonical database record. 37. RESOURCE FAQ SYSTEM Every article can have contextual FAQs. FAQ questions should be generated/selected based on article topic. Example: Visa article:

What documents are required?
How much financial evidence is needed?
Can I apply after receiving an offer?
How long does processing take?
What causes refusal?
Click question → answer expands. 38. RELATED QUESTIONS ENGINE At the end of each resource page: Related Questions Show relevant questions in clickable accordion cards. Example:

Can I study abroad without IELTS?
How much money do I need?
Can I apply with a study gap?
How do I choose a university?
How do scholarships work?
When clicked:
* Expand answer, OR
* Open the relevant resource page.
Do not send users to irrelevant pages. 39. UNIFIED RELATED CONTENT ENGINE Services, Scholarships and Resources must use the same relationship system. Example:

Visa Guidance
   ↕
UK Student Visa Guide
   ↕
UK Scholarships
   ↕
UK Courses
   ↕
UK Universities
Another:

Scholarship Guidance
   ↕
Scholarship Guide
   ↕
University Scholarship
   ↕
Eligible Courses
   ↕
Course Finder
This creates a connected knowledge ecosystem instead of isolated pages. 40. DATABASE REQUIREMENTS Use existing database tables where available. If missing, add/update:

services
service_faqs

scholarships
scholarship_faqs
scholarship_requirements
scholarship_sources

resources
resource_categories
resource_faqs
resource_tags

content_relationships
content_sources
content_verifications
	41	SERVICES TABLE Minimum:

id
title
slug
short_description
description
icon
hero_image
content
eligibility
requirements
process
timeline
documents
faq_enabled
status
sort_order
last_verified_at
created_at
updated_at
	42	SCHOLARSHIPS TABLE Minimum:

id
scholarship_code
name
slug
country_id
university_id
course_id
study_level
subject
funding_type
amount
currency
coverage
eligibility
minimum_requirements
documents_required
application_method
application_url
opening_date
deadline
decision_date
status
verification_status
source_url
source_name
last_verified_at
created_at
updated_at
	43	RESOURCES TABLE Minimum:

id
category_id
title
slug
excerpt
content
author_id
featured_image
country_id
study_level
reading_time
status
published_at
updated_at
last_verified_at
source_url
seo_title
seo_description
created_at
updated_at
	44	CONTENT RELATIONSHIPS Create:

content_relationships
Fields:

id
source_type
source_id
target_type
target_id
relationship_type
sort_order
status
created_at
Examples:

service → resource
service → scholarship
service → course
scholarship → resource
scholarship → service
scholarship → course
resource → service
resource → scholarship
resource → course
	45	ADMIN MANAGEMENT Super Admin must be able to manage all three systems. Services

Add Service
Edit Service
Delete Service
Reorder
Publish/Unpublish
Add FAQ
Add Related Content
Verify Content
Scholarships

Add Scholarship
Edit Scholarship
Delete Scholarship
Verify
Publish
Unpublish
Set Deadline
Set Funding
Set Eligibility
Add Official Source
Add FAQ
Connect University
Connect Course
Resources

Create Article
Edit Article
Publish
Unpublish
Schedule
Assign Category
Add Tags
Add FAQ
Add Related Content
Set Source
Set Last Verified
SEO
	46	MANUAL ADD OPTIONS The admin must have obvious manual creation buttons:

+ Add Service
+ Add Scholarship
+ Add Resource
+ Add FAQ
+ Add Related Content
+ Add Official Source
No developer/database editing should be required for normal content management. 47. VERIFICATION SYSTEM For time-sensitive information:

Verified
Needs Verification
Expired
Unverified
Public pages should only show verified information when verification is required. For expired information: Information may have changed. Please verify the latest requirements before applying. 48. SOURCE RULE For scholarships, visa information, admission requirements, fees and deadlines: Prefer:

Official university website
Official government website
Official visa authority
Official test provider
Official scholarship provider
Store:

source_url
source_name
last_verified_at
Do not copy source text word-for-word. 49. SEO Every service, scholarship and resource detail page must have:

SEO title
Meta description
Canonical URL
Open Graph title
Open Graph description
Open Graph image
Schema.org structured data
Breadcrumb schema
FAQ schema where valid
Article schema for resources
Use clean slugs. 50. INTERNAL SEARCH Search should index:

Services
Scholarships
Resources
Universities
Courses
Countries
FAQs
Example search: "IELTS" Can return:

IELTS Preparation Service
IELTS Scholarship Resources
IELTS Guide
IELTS FAQ
IELTS Course Requirements
IELTS University Requirements
	51	FINAL PAGE EXPERIENCE Every detail page should finish with: Still Have Questions? Show 4-8 contextual FAQ questions. Then: Explore More Show:

Related Services
Related Scholarships
Related Resources
Related Courses
Related Universities
Then: Ready to Start?

Book Free Consultation
Find Courses
Check Eligibility
Chat with Counselor
1. IMPORTANT CONTENT RULE The website must educate first and sell second. Do not create thin pages whose only purpose is: "Contact us for more information." Instead, provide the useful information directly. The student should be able to understand:
* what the service is
* why they need it
* what they need
* how the process works
* what documents are required
* what deadlines matter
* what mistakes to avoid
* what the next step is
Then ALO becomes the trusted execution/support layer. 53. SECURITY
* RBAC for admin management
* CSRF protection
* Prepared SQL statements
* Output escaping
* No hardcoded database passwords
* No internal notes publicly
* No private CRM information publicly
* No commission information publicly
* Audit log all content changes
* Validate uploaded images/files
* Restrict admin routes
* Sanitize rich text content
1. FINAL SELF-AUDIT Before declaring complete, verify: SERVICES
* /services works
* Every service card opens its own detail page
* Every service has detailed content
* Service FAQs work
* Related content works
* Consultation CTA works
* No dead links
SCHOLARSHIPS
* /scholarships works
* Filters work
* Every scholarship opens /scholarships/{slug}
* Eligibility is displayed
* Requirements are displayed
* Opening/deadline information is displayed where verified
* Application process is explained
* Official source is stored
* Last verified date is shown
* FAQ works
* Related scholarships/resources/services work
* No fake scholarship information
RESOURCES
* /resources works
* Categories work
* Search works
* Every resource opens its own detail page
* Long-form content works
* Table of contents works
* FAQs work
* Related questions work
* Related content works
* SEO metadata exists
* Official sources are preserved where relevant
GLOBAL
* Mobile responsive
* No horizontal overflow
* No fake data
* No lorem ipsum
* No broken links
* No console errors
* No API errors
* No hardcoded DB password
* Database-driven content
* Admin CRUD works
* Audit logs work
* Verification status works
* Accessibility checks pass
* Loading states work
* Empty states work
* Error states work
FINAL ACCEPTANCE CONDITION Do not say the implementation is complete until the three systems are actually connected to the existing ALO Education database, routes are tested, detail pages open correctly, CRUD works from the admin side, and the public pages have no broken links or console/API errors.

ALO_SERVICES_SCHOLARSHIPS_RESOURCES_COMPLETE

 ALO UNIFIED COMMUNICATION & SOCIAL COMMAND CENTER
============================================================

THIS MODULE IS MANDATORY.

Every authorized ALO Education employee dashboard and every
authorized Partner dashboard must have a unified communication
workspace.

The purpose is to bring authorized communication channels into
ONE operational workspace instead of forcing employees to switch
between multiple applications.

The workspace must integrate, where officially supported and
authorized:

- WhatsApp
- WhatsApp Business
- Email
- SMS
- Phone Calls
- Social Inbox
- Website Chat
- Portal Messages
- Internal CRM Communication

IMPORTANT:

Do not build fake social-media integrations.

Use official APIs/OAuth/business integrations where available.

If a provider requires authorization, API credentials, webhook
verification or business approval, show:

CONFIGURATION REQUIRED

instead of pretending the integration is active.

============================================================
122. EMPLOYEE SOCIAL MEDIA HUB
============================================================

Every authorized ALO Education employee dashboard should contain:

SOCIAL & COMMUNICATION HUB

Example:

[WhatsApp]
[Email]
[Facebook]
[Instagram]
[LinkedIn]
[SMS]
[Phone]
[Website Chat]

The exact channels shown depend on:

- employee role
- permissions
- connected account
- ALO policy

Do NOT give every employee unrestricted access to company social
accounts.

============================================================
123. PARTNER COMMUNICATION HUB
============================================================

Partners must have their own communication workspace.

Partner dashboard can show authorized:

- WhatsApp
- Email
- Partner communication
- Student communication
- Application communication

Partner must only see students/applications explicitly assigned
or authorized for that partner.

Partner must never see:

- other partner's students
- internal ALO notes
- confidential employee communication
- restricted financial information
- internal AI risk scores
- ALO-only operational information

============================================================
124. WHATSAPP IS A FIRST-CLASS CHANNEL
============================================================

WhatsApp is mandatory.

Do not treat WhatsApp as an optional secondary feature.

Create:

WHATSAPP COMMAND CENTER

Features:

- incoming messages
- outgoing messages
- attachments
- images
- PDFs
- documents
- voice messages where supported
- voice notes
- message status
- delivery status
- read status
- timestamps
- conversation history
- application context
- student context
- assigned counselor
- SLA timer
- templates
- quick replies
- AI draft reply
- human approval
- escalation

============================================================
125. WHATSAPP CONTACT AUTO-MATCHING
============================================================

When an incoming WhatsApp message arrives:

STEP 1:
Read the authorized WhatsApp sender identifier/phone number.

STEP 2:
Normalize phone number to international format.

STEP 3:
Search existing authorized contact records.

If phone number already exists:

MATCH EXISTING CONTACT.

If the number is linked to a Student:

automatically open the SAME Student record.

If linked to an Application:

automatically open the relevant Application.

If no existing record exists:

CREATE NEW CONTACT / LEAD ID.

Example:

WhatsApp Number:
+8801XXXXXXXXX

No matching contact found.

System creates:

Lead ID:
LEAD-2026-XXXXX

Do not automatically create a full Student record without the
required onboarding/identity workflow.

============================================================
126. PHONE NUMBER DEDUPLICATION
============================================================

A phone number must not create unlimited duplicate students.

Before creating a new contact:

1. normalize number
2. search exact number
3. search alternate phone fields
4. check verified WhatsApp identity where available
5. check email if available
6. check existing lead
7. check existing student
8. check existing partner contact

If likely duplicate:

show:

POSSIBLE EXISTING CONTACT

[Open Existing]
[Merge Request]
[Create New - Authorized Role Only]

Never silently merge two students.

============================================================
127. WHATSAPP CONVERSATION MEMORY
============================================================

When a WhatsApp number matches an existing Student:

Open the existing Student context automatically.

Show:

Student Name
Student ID
Phone
Assigned Counselor
Active Applications
Current Stage
Missing Documents
Latest Offer
Payment Status
Interview Status
Last Communication
SLA
Next Best Action

The counselor must not need to manually search for the student
again.

============================================================
128. WHATSAPP MESSAGE → CRM EVENT
============================================================

Incoming WhatsApp message can create:

communication event

and, where appropriate:

document request
student question
application question
payment question
interview question
urgent issue
follow-up task

AI can classify the message.

Example:

Student:
"Sir, university asked for bank statement. What should I send?"

AI classification:

Intent:
DOCUMENT_REQUIREMENT

Application:
AE-2026000123-02

Next Best Action:
Show Bank Statement requirement.

The system can prepare a reply.

============================================================
129. AI WHATSAPP ASSISTANT
============================================================

AI may draft replies using:

Student profile
Application
Document checklist
Offer conditions
Approved ALO knowledge
Verified university information
Previous conversation
Current workflow state

AI must NOT invent information.

For high-risk subjects:

payment
visa
immigration
legal
financial evidence

AI must either:

use verified source

OR

escalate to counselor.

============================================================
130. HUMAN APPROVAL FOR WHATSAPP
============================================================

Provide modes:

AI Draft Only
AI Draft + Human Send
Approved Automation
Restricted Automation

For high-risk communications:

AI Draft
→ Human Review
→ Send

The system must clearly show:

AI GENERATED DRAFT

before sending.

============================================================
131. WHATSAPP FILE UPLOAD
============================================================

From the WhatsApp Command Center, authorized staff can send:

- PDF
- image
- document
- approved ALO guide
- payment information
- interview preparation document
- missing-document request

Where supported by the official provider API.

Every outgoing attachment must be recorded in CRM.

Store:

message_id
student_id
application_id
document_id if applicable
sender
recipient
file_id
file_name
file_type
timestamp
delivery_status

============================================================
132. WHATSAPP RECEIVED DOCUMENT
============================================================

When a student sends a document through WhatsApp:

Example:

Student sends:

passport.pdf

System:

1. receives file
2. validates file
3. stores securely
4. identifies sender
5. matches Student ID
6. identifies active application where possible
7. creates document upload event
8. classifies document
9. updates document checklist
10. notifies counselor
11. preserves WhatsApp message reference

Student's original message/comment must remain associated with
the uploaded file.

============================================================
133. WHATSAPP DOCUMENT POSITION
============================================================

If the student sends:

"Here is my bank statement."

and attaches:

bank_statement.pdf

The system should create/attach it to:

Application
→ Document Requirement
→ Bank Statement

If the exact application cannot be confidently determined:

DO NOT guess.

Create:

DOCUMENT MATCH REVIEW REQUIRED

and ask counselor to select the application.

============================================================
134. IMMUTABLE DOCUMENT POLICY
============================================================

THIS IS MANDATORY.

Official application documents must NEVER be physically deleted
through the normal CRM UI.

Student:
CANNOT delete.

Counselor:
CANNOT delete.

Partner:
CANNOT delete.

Even Admin should not casually delete official application
documents.

Use lifecycle states instead.

============================================================
135. DOCUMENT REJECTION
============================================================

Counselor may REJECT a submitted document.

But:

REJECT ≠ DELETE.

Example:

Passport
Status:
REJECTED

Reason:

"Image is unclear. Please upload a higher-quality scan."

The rejected document remains in history.

The student can upload a replacement.

============================================================
136. SAME DOCUMENT SLOT / VERSIONING
============================================================

Example:

Requirement:

BANK STATEMENT

Version 1:
Uploaded
→ Rejected

Version 2:
Uploaded
→ Rejected

Version 3:
Uploaded
→ Verified

The document requirement remains ONE requirement.

Do not create confusing duplicate document requirements.

Timeline:

Bank Statement
├── Version 1 - Rejected
├── Version 2 - Rejected
└── Version 3 - Verified

All versions remain auditable.

============================================================
137. DOCUMENT REJECTION RULE
============================================================

Counselor can reject ONLY when the document is in:

STUDENT_SUBMITTED / UNDER_REVIEW

state.

After:

VERIFIED

the counselor cannot simply delete or replace it.

If a correction is necessary:

Create:

SUPERSEDE / CORRECTION WORKFLOW

with reason and authorization.

============================================================
138. DOCUMENT REJECTION REASON
============================================================

Rejection MUST require a reason.

Examples:

- blurry
- incomplete
- wrong document
- expired
- wrong student
- wrong format
- missing page
- inconsistent information
- university-specific requirement not met

Allow:

predefined reason
+
optional counselor comment

Student receives the reason through approved communication.

============================================================
139. DOCUMENT RE-SUBMISSION
============================================================

After rejection:

Student sees:

DOCUMENT REJECTED

Reason:
"Page 2 is missing."

Button:

[UPLOAD REPLACEMENT]

The replacement is stored as:

Version 2

Never overwrite Version 1.

============================================================
140. PHONE CALL CENTER
============================================================

Where supported by the configured telephony provider:

Counselor can initiate calls from the CRM.

Example:

[Call Student]

The system should:

1. initiate authorized call
2. identify counselor
3. identify student
4. link call to student
5. link call to application if selected
6. record timestamp
7. record duration
8. record outcome
9. optionally record call recording/transcript where legally
   permitted and consent requirements are satisfied

============================================================
141. INCOMING CALLS
============================================================

When an incoming call arrives:

Use caller number to match:

Student
Lead
Partner
Contact

If matched:

Open:

Student/Contact Communication Panel

Automatically show:

Name
ID
Applications
Counselor
Current Stage
SLA
Last Message
Last Call
Pending Tasks

============================================================
142. UNKNOWN CALLER
============================================================

If number is unknown:

Create:

UNKNOWN INCOMING CONTACT

Allow authorized employee to:

Create Lead
Link Existing
Create Partner Contact
Mark Spam

Never automatically assign as Student without verification.

============================================================
143. CALL NOTES
============================================================

After call:

Counselor sees:

CALL OUTCOME

Answered
No Answer
Busy
Callback Requested
Wrong Number
Resolved
Escalated

Then:

Call Summary

Student-visible note:
[optional]

Internal note:
[restricted]

============================================================
144. CALL RECORDING
============================================================

If call recording is enabled:

Store securely.

Apply:

consent
retention
role-based access
audit
privacy policy

Never make recordings publicly accessible.

============================================================
145. UNIFIED INBOX
============================================================

Create:

/crm/communications/inbox

Columns:

Priority
SLA
Channel
Student
Application
Sender
Message
Assigned Counselor
Intent
Status
Last Response
Deadline

Channels:

WhatsApp
Email
SMS
Phone
Portal
Social

============================================================
146. ONE CONVERSATION, MULTIPLE CHANNELS
============================================================

Where technically and provider-wise possible, unify conversation
history.

Example:

10:00 WhatsApp
10:15 Email
11:00 Phone
12:00 Portal

All appear in:

STUDENT COMMUNICATION TIMELINE

But retain the original channel.

Never falsely represent different channels as one provider message.

============================================================
147. COUNSELOR SLA ENGINE
============================================================

Every inbound communication can have an SLA.

Example:

WhatsApp:
Response required within 15 minutes.

Email:
Response required within 2 hours.

Urgent:
Response required within 10 minutes.

Normal:
Response required within 4 hours.

The exact SLA must be configurable by:

channel
priority
student type
application stage
message intent
business hours
holiday calendar

============================================================
148. SLA COUNTDOWN
============================================================

Every pending inbound message displays:

RESPONSE DUE IN:

14:32

or:

OVERDUE BY:

01:24

Use visual states:

NORMAL
WARNING
OVERDUE
CRITICAL

Do not depend only on color.

============================================================
149. SLA WARNING SYSTEM
============================================================

Example:

SLA:
30 minutes

At:

20 minutes:
WARNING

At:

28 minutes:
URGENT WARNING

At:

30 minutes:
OVERDUE

At:

45 minutes:
ESCALATION

Exact thresholds configurable.

============================================================
150. COUNSELOR RESPONSE TRACKING
============================================================

For every assigned inbound message:

Record:

received_at
assigned_at
first_viewed_at
first_response_at
response_time
SLA_deadline
SLA_status
overdue_duration
resolution_time

Metrics:

First Response Time
Average Response Time
SLA Compliance
Overdue Count
Escalation Count

============================================================
151. MISSED RESPONSE DETECTION
============================================================

If counselor does not respond within SLA:

STEP 1:
Create warning.

STEP 2:
Notify counselor.

STEP 3:
Notify supervisor according to escalation policy.

STEP 4:
Create escalation event.

STEP 5:
Optionally reassign to backup counselor if configured.

Never silently lose the message.

============================================================
152. REPEATED SLA FAILURE
============================================================

Create counselor SLA incident counter.

Example configurable rule:

5 SLA breaches within a defined rolling period

→ WARNING REQUIRED

IMPORTANT:

Do not count every minor system/provider failure as a counselor
failure.

Exclude:

provider outage
system outage
incorrect assignment
holiday/non-working hours
approved leave
technical failure
message not requiring response
duplicate message

============================================================
153. FIVE-INCIDENT WARNING
============================================================

When the configured threshold is reached:

COUNSELOR PERFORMANCE WARNING

show:

Counselor
Period
Total assigned messages
Required responses
SLA breaches
Valid exclusions
Average response time
Worst delays
Related message IDs

Then:

JUSTIFICATION REQUIRED

============================================================
154. COUNSELOR JUSTIFICATION
============================================================

Counselor must provide:

Reason
Category
Explanation
Optional evidence

Categories:

Student unavailable
University waiting
System issue
Wrong assignment
High workload
Emergency
Approved leave
Other

Do not allow:

blank justification.

============================================================
155. MANAGER REVIEW
============================================================

Supervisor can:

Accept justification
Reject justification
Request clarification
Exclude incident
Keep incident
Create coaching task

All decisions are audited.

============================================================
156. FAIR SLA GOVERNANCE
============================================================

SLA analytics must NOT automatically punish counselors without
context.

Use:

valid working hours
timezone
holiday
leave
system outage
channel outage
assignment timing
message complexity

A counselor should not be penalized because WhatsApp API was down.

============================================================
157. COUNSELOR PERFORMANCE DASHBOARD
============================================================

Show:

Assigned
Responded
Pending
Overdue
SLA %
Average response time
5-minute warning count
Escalations
Justifications
Accepted exceptions
Manager reviews

Also show:

Top unresolved conversations.

============================================================
158. AI SLA ASSISTANT
============================================================

AI can identify:

messages likely requiring urgent response
messages requiring counselor
messages that can be auto-drafted
messages requiring finance
messages requiring visa officer
messages requiring manager

Example:

Student:
"My CAS deadline is tomorrow and payment is not showing."

AI:

Priority:
CRITICAL

Route:
Counselor + Finance/Visa Officer

Reason:
Deadline + payment issue

Do not let AI silently resolve critical cases.

============================================================
159. SOCIAL ACCOUNT OWNERSHIP
============================================================

Every connected social account must have:

platform
account_id
account_name
owner
organization
connection_status
permissions
token_status
last_sync
webhook_status

Never store social credentials in frontend code.

Use secure backend credential/token storage.

============================================================
160. EMPLOYEE ACCOUNT SECURITY
============================================================

Each employee's connected social accounts must be permission
scoped.

Example:

Employee A:
Can send WhatsApp from assigned company number.

Employee B:
Can manage Facebook inbox.

Employee C:
Can view but cannot send.

Admin:
Can manage account permissions.

============================================================
161. OFFICIAL ALO SOCIAL IDENTITY
============================================================

Distinguish:

ALO Official Account
vs
Employee Personal Account

Do not allow employees to connect personal social accounts
to the official ALO communication engine unless explicitly
authorized by company policy.

============================================================
162. SOCIAL MESSAGE AUDIT
============================================================

Every outgoing official communication:

employee
platform
account
student
application
message
timestamp
approval
delivery status

must be logged.

============================================================
163. SOCIAL MEDIA DASHBOARD
============================================================

Create:

/crm/social

Sections:

WhatsApp
Facebook
Instagram
LinkedIn
Email
SMS
Phone

Each shows:

Unread
Assigned
Pending
SLA
Resolved
Escalated

============================================================
164. COMMUNICATION SEARCH
============================================================

Search:

Student
Phone
Application ID
Message
Channel
Date
Counselor
Intent
Status

Example:

"Show all WhatsApp messages from students with payment
deadlines within 48 hours."

============================================================
165. AI CONVERSATION SUMMARY
============================================================

For long conversations:

AI creates:

Summary
Open Issues
Student Request
Application
Missing Information
Next Action
Responsible Employee
Deadline

The original conversation remains accessible.

============================================================
166. AI CONTEXT PROTECTION
============================================================

AI must only retrieve conversations authorized for the current
employee.

Never allow:

Employee A asking AI about Student B outside authorization.

Backend permission must be enforced BEFORE retrieval.

============================================================
167. COMMUNICATION ESCALATION
============================================================

Example:

Student sends payment issue.

Counselor SLA expires.

→ Counselor warning
→ Supervisor escalation
→ Finance notification if applicable

All events appear in timeline.

============================================================
168. COMMUNICATION TASKS
============================================================

Every unresolved communication can become:

TASK

Task fields:

task_id
student_id
application_id
message_id
assigned_to
priority
deadline
status
created_by
source
resolution

============================================================
169. MESSAGE RESOLUTION
============================================================

Counselor can mark:

Resolved
Waiting for Student
Waiting for University
Waiting for Partner
Escalated
Follow-up Required

If:

Follow-up Required

system creates next reminder.

============================================================
170. NO MESSAGE LOSS
============================================================

Every incoming message must enter:

RECEIVED

before any AI processing.

If AI fails:

message remains.

If CRM fails:

retry mechanism.

If integration fails:

provider message reference remains where available.

Never silently discard incoming communication.

============================================================
171. COMMUNICATION IDEMPOTENCY
============================================================

Webhook/message processing must be idempotent.

The same WhatsApp webhook must not create duplicate:

messages
documents
leads
students
tasks

Use provider message IDs/event IDs.

============================================================
172. WEBHOOK SECURITY
============================================================

Validate:

provider signature
webhook secret
timestamp where supported
event ID
source

Reject unauthorized webhook requests.

============================================================
173. WHATSAPP MESSAGE STATUS
============================================================

Track:

SENT
DELIVERED
READ
FAILED

Where provider supports these states.

Do not confuse:

API accepted

with:

delivered

============================================================
174. OFFICIAL COMMUNICATION TEMPLATE ENGINE
============================================================

Templates:

Document Request
Offer Notification
Payment Instruction
Payment Reminder
Interview Reminder
Visa Reminder
Success
Review Request

Each template:

template_id
channel
language
version
approval
status
last_updated

Counselors cannot edit locked official templates unless authorized.

============================================================
175. COMMUNICATION AI SAFETY
============================================================

AI must never automatically send:

fake university information
fake payment details
fake visa requirements
false deadlines
guaranteed visa promises
guaranteed interview success

High-risk communications require human approval.

============================================================
176. FINAL COMMUNICATION ACCEPTANCE TEST
============================================================

Test:

1. Student sends WhatsApp.
2. Existing phone number matches Student ID.
3. Existing application appears.
4. Counselor receives message.
5. SLA starts.
6. Countdown appears.
7. AI classifies message.
8. AI drafts response.
9. Counselor edits.
10. Counselor sends.
11. WhatsApp status updates.
12. Message enters timeline.
13. Student sends PDF.
14. PDF becomes document upload.
15. Correct application is selected.
16. Counselor sees document.
17. Counselor can REJECT.
18. Counselor CANNOT DELETE.
19. Student sees rejection reason.
20. Student uploads replacement.
21. Version 1 remains.
22. Version 2 is created.
23. Counselor verifies Version 2.
24. Five valid SLA breaches trigger warning.
25. Counselor provides justification.
26. Manager reviews.
27. Everything appears in audit log.

============================================================
177. FINAL RULE FOR THIS MODULE
============================================================

COMMUNICATION IS NOT A SEPARATE CHAT FEATURE.

It is part of the student's official journey.

Every:

WhatsApp
Email
SMS
Phone call
Portal message
Social message
Document
Offer
Payment
Interview

must be connected to the correct:

Student
Application
Counselor
Timeline
Task
SLA
Audit

This creates ONE ALO operational communication graph.

============================================================
END UNIFIED COMMUNICATION MODULE
============================================================


GENERATION AI-NATIVE STUDENT JOURNEY
OPERATING SYSTEM
============================================================

PROJECT TYPE:
Enterprise Education CRM + Student Portal + Partner Portal
+ Agentic AI + RAG + Document Intelligence
+ Application Management + Offer Management
+ Payment Workflow + Interview Intelligence
+ Visa Readiness + Communication Automation
+ Student Success + Alumni/Review Engine

PRIMARY OBJECTIVE:
Transform ALO Education from a conventional CRM/student portal
into a production-grade AI-native Student Journey Operating System.

IMPORTANT:
DO NOT build this as a simple chatbot.
DO NOT build isolated AI features.
DO NOT rebuild or delete working functionality unnecessarily.

The system must operate as one connected lifecycle:

LEAD
→ STUDENT ID
→ ONBOARDING
→ PROFILE
→ COURSE DISCOVERY
→ UNIVERSITY SELECTION
→ APPLICATION
→ DOCUMENT MANAGEMENT
→ OFFER
→ PAYMENT
→ POST-OFFER DOCUMENTS
→ INTERVIEW PREPARATION
→ AI INTERVIEW PRACTICE
→ HUMAN REVIEW
→ VISA READINESS
→ VISA
→ SUCCESS
→ REVIEW
→ ALUMNI / REFERRAL

============================================================
1. CORE ARCHITECTURAL PRINCIPLE
============================================================

Build ALO as:

"AI-NATIVE STUDENT JOURNEY OPERATING SYSTEM"

not:

"AI chatbot attached to CRM"

The architecture must combine:

1. Traditional deterministic application logic
2. Agentic AI reasoning
3. RAG
4. Structured database
5. Student memory
6. Event-driven workflows
7. Tool calling
8. Human approval
9. Role-based permissions
10. Audit logging
11. Security policy enforcement
12. AI observability
13. AI evaluation
14. Cost/model routing
15. Multimodal document intelligence

Use AI where reasoning is valuable.

Use deterministic backend rules where exactness is required.

NEVER allow an LLM to directly mutate critical database state.

All critical mutations must go through:
AI
→ Tool
→ Backend authorization
→ Business rules
→ Database

============================================================
2. EXISTING SYSTEM PRESERVATION
============================================================

FIRST:
Inspect the entire existing project.

DO NOT:
- delete existing pages
- delete working APIs
- delete existing entities
- replace working CRM functionality
- replace existing student workflow
- create duplicate pages unnecessarily
- create duplicate database tables unnecessarily
- rewrite the whole application without evidence

Before implementation produce:

A. Existing architecture map
B. Existing frontend pages
C. Existing backend routes
D. Existing database schema
E. Existing entities
F. Existing authentication
G. Existing RBAC
H. Existing AI functions
I. Existing communication functions
J. Existing application workflow
K. Existing document workflow
L. Existing university workflow
M. Existing student portal
N. Existing CRM
O. Existing integrations
P. Existing automation/n8n workflows

Then extend the existing architecture.

If an existing feature already satisfies a requirement:
IMPROVE/INTEGRATE it.

Do not duplicate it.

============================================================
3. HIGH-LEVEL ARCHITECTURE
============================================================

                 ALO AI COMMAND CORE
                         |
                 AI ORCHESTRATOR
                         |
        +----------------+----------------+
        |                |                |
   AGENT LAYER      MEMORY LAYER     POLICY LAYER
        |                |                |
        |                |                |
 Admission Agent    Student Memory     RBAC
 Course Agent       Conversation       Consent
 Document Agent     Episodic Memory    Permissions
 Offer Agent        Semantic Memory    Approvals
 Payment Agent      Event Memory       Security
 Interview Agent    World State        Audit
 Visa Agent
 Communication
 Research Agent
 Risk Agent
 PDF Agent
 Success Agent
 Analytics Agent
 Security Agent
 Human Handoff Agent
        |
        |
    TOOL GATEWAY
        |
 +------+------+------+------+------+------+
 |      |      |      |      |      |      |
 CRM    DB    RAG   Email WhatsApp Files  Workflow
        |
        |
    EVENT BUS
        |
 +------+-------+---------+---------+
 |              |         |         |
Website       Portal    WhatsApp   CRM
 |
 STUDENT ID
 |
 STUDENT WORLD MODEL
 |
 NEXT BEST ACTION
 |
 HUMAN / AI ACTION
 |
 AUDIT

============================================================
4. AI ORCHESTRATOR
============================================================

Create a central AI Orchestrator.

Responsibilities:

- detect intent
- detect event
- identify student
- identify application
- identify relevant university
- determine required context
- retrieve memory
- retrieve RAG evidence
- select specialized agent
- create plan
- execute approved tools
- validate result
- request human approval where required
- update task state
- create audit event
- generate next best action

Example:

Student uploads passport.

Event:
PASSPORT_UPLOADED

Orchestrator:

1. Identify Student
2. Identify active application(s)
3. Send document to Document Agent
4. Classify document
5. Extract fields
6. Validate fields
7. Compare with existing student profile
8. Detect conflicts
9. Update document state
10. Create notification
11. Recalculate missing-document checklist
12. Generate next-best-action

============================================================
5. SPECIALIZED AI AGENTS
============================================================

Create these agents:

1. Student Identity Agent
2. Onboarding Agent
3. Profile Agent
4. Admission Agent
5. Course Matching Agent
6. University Research Agent
7. Scholarship Agent
8. Document Intelligence Agent
9. Document Request Agent
10. Application Agent
11. Offer Letter Agent
12. Payment Information Agent
13. Communication Agent
14. Notification Agent
15. Deadline Agent
16. Interview Research Agent
17. Interview Question Agent
18. Interview Answer Coach Agent
19. AI Interviewer Agent
20. Interview Assessment Agent
21. English Communication Coach
22. Visa Readiness Agent
23. Risk Prediction Agent
24. Next Best Action Agent
25. RAG Knowledge Agent
26. PDF Generation Agent
27. Success Agent
28. Review Request Agent
29. Alumni Agent
30. Analytics Agent
31. Security Agent
32. Human Handoff Agent
33. Quality Assurance Agent
34. Admin Copilot Agent

Agents must NOT have unlimited permissions.

Every agent must have:

- agent_id
- role
- description
- allowed_tools
- allowed_data
- forbidden_tools
- maximum autonomy
- approval requirements
- audit policy

============================================================
6. AUTONOMY LEVELS
============================================================

Create:

LEVEL 0:
AI provides information only.

LEVEL 1:
AI drafts.

LEVEL 2:
AI prepares action and waits for human approval.

LEVEL 3:
AI executes low-risk predefined actions.

LEVEL 4:
Controlled autonomous workflow.

LEVEL 5:
Never allow unrestricted autonomy for critical financial,
legal, immigration, application submission or identity actions.

Examples:

LOW RISK:
- reminder
- internal summary
- document classification
- draft email
- draft WhatsApp
- generate interview questions

MEDIUM RISK:
- send student document request
- generate payment email
- generate application checklist

HIGH RISK:
- application submission
- payment instruction approval
- financial verification
- visa-related final decision
- legal declaration
- changing official application status

High-risk actions require human approval.

============================================================
7. STUDENT IDENTITY
============================================================

Every student must have one permanent Student ID.

Example:

AE-2026000123

Student ID must remain stable throughout the entire journey.

Student ID links:

- profile
- applications
- documents
- offers
- payments
- communications
- interview sessions
- visa records
- success records
- alumni records
- AI memory
- audit events

Do not create separate unrelated student identities for different
universities.

============================================================
8. APPLICATION SERIAL SYSTEM
============================================================

Every student can have multiple applications.

Example:

Student:
AE-2026000123

Applications:

AE-2026000123-01
University A

AE-2026000123-02
University B

AE-2026000123-03
University C

Each application has:

- application_id
- student_id
- university_id
- course_id
- intake
- application_serial
- status
- status_history
- submission_date
- offer_status
- payment_status
- interview_status
- visa_status
- assigned_counselor
- deadlines
- documents
- communications
- internal notes
- student-visible comments

============================================================
9. APPLICATION HUB
============================================================

Create:

/student/applications

and:

/crm/applications

Student sees only their own applications.

Counselor sees assigned/authorized applications.

Admin sees all authorized applications.

Display every application in consistent serial order.

Example:

01 University of Birmingham
02 University of Hertfordshire
03 Coventry University
04 University of Greenwich

Each application card must show:

University
Course
Intake
Application ID
Application date
Current stage
Progress %
Missing documents
Offer status
Payment status
Interview status
Visa status
Deadline
Assigned counselor
Next best action

============================================================
10. APPLICATION TIMELINE
============================================================

Every application must have an immutable event timeline.

Example:

08 Aug
Application Created

09 Aug
Documents Verified

10 Aug
Application Submitted

12 Aug
Offer Received

12 Aug
Offer Verified

13 Aug
Payment Instructions Received

14 Aug
Payment Requested

15 Aug
Payment Proof Uploaded

16 Aug
Interview Preparation Started

Each event must record:

timestamp
actor
actor_type
source
old_state
new_state
comment
related document
related message
audit ID

============================================================
11. APPLICATION STATUS STATE MACHINE
============================================================

Student MUST NOT directly change official application stages.

Example:

DRAFT
→ DOCUMENTS_PENDING
→ READY_TO_SUBMIT
→ SUBMITTED
→ UNDER_REVIEW
→ OFFER_RECEIVED
→ OFFER_VERIFIED
→ PAYMENT_PENDING
→ PAYMENT_VERIFIED
→ CONDITIONS_PENDING
→ INTERVIEW_REQUIRED
→ INTERVIEW_READY
→ INTERVIEW_COMPLETED
→ CAS_PENDING
→ CAS_RECEIVED
→ VISA_PREPARATION
→ VISA_SUBMITTED
→ VISA_APPROVED
→ SUCCESS

Allow valid transitions only.

Backend controls transitions.

============================================================
12. DOCUMENT INTELLIGENCE ENGINE
============================================================

Create complete document lifecycle:

UPLOAD
→ MALWARE/FILE CHECK
→ CLASSIFICATION
→ OCR
→ LAYOUT UNDERSTANDING
→ FIELD EXTRACTION
→ VALIDATION
→ STUDENT MATCH
→ APPLICATION MATCH
→ REQUIREMENT MATCH
→ COUNSELOR REVIEW
→ VERIFIED / REJECTED

Document statuses:

MISSING
REQUESTED
UPLOADED
PROCESSING
UNDER_REVIEW
VERIFIED
REJECTED
EXPIRED
SUPERSEDED

============================================================
13. DOCUMENT CHECKLIST
============================================================

Every application must dynamically generate a document checklist.

Example:

DOCUMENT CHECKLIST

✓ Passport
✓ Academic Certificate
✓ Transcript
✓ IELTS
✓ CV

⚠ Bank Statement
⚠ Sponsor Letter
⚠ TB Certificate

Each document requirement must know:

- requirement_id
- application_id
- document_type
- mandatory
- status
- deadline
- source
- reason_required
- requested_at
- received_at
- verified_at
- expiry_date

============================================================
14. MISSING DOCUMENT REQUEST ENGINE
============================================================

Counselor can click any missing document.

Example:

Bank Statement
Status: MISSING

Actions:

[Request from Student]

Channels:

☐ Email
☐ WhatsApp
☐ Both

Template:
[approved template]

Personal message:
[optional]

[PREVIEW]
[SEND]

Also support:

Select multiple missing documents.

[Request Selected Documents]

System generates one consolidated request.

============================================================
15. AI DOCUMENT REQUEST AGENT
============================================================

Counselor can say:

"Request all missing documents from this student."

AI must:

1. identify application
2. identify missing mandatory documents
3. identify optional documents where appropriate
4. select approved template
5. generate personalized request
6. create email draft
7. create WhatsApp draft
8. show preview
9. require approval if policy requires
10. send
11. record communication
12. update request status

Never send a request for a document that is already verified.

============================================================
16. STUDENT DOCUMENT UPLOAD
============================================================

Student can:

UPLOAD
VIEW
DOWNLOAD
COMMENT
RESPOND

Student cannot:

DELETE official document
DELETE verified document
DELETE application record
DELETE audit history

Upload screen:

Document
File
Optional Comment

Example:

Bank Statement.pdf

Comment:
"This is my latest bank statement."

After upload:

Document status:
UPLOADED

Comment:
visible to authorized counselor.

============================================================
17. DUAL COMMENT SYSTEM
============================================================

Every application/document must support TWO separate comment streams.

A. STUDENT COMMUNICATION

Visible to:
Student
Counselor
Authorized staff

Purpose:
Student-facing communication.

B. INTERNAL ALO NOTE

Visible to:
Authorized ALO employees only.

Never expose internal notes to students or partners.

Database must separate these streams.

Never rely only on frontend hiding.

Backend authorization must enforce visibility.

============================================================
18. DOCUMENT UPLOAD NOTIFICATION
============================================================

When student uploads a document:

EVENT:
DOCUMENT_UPLOADED

System:

1. Save document
2. Link to Student ID
3. Link to Application ID
4. Save student comment
5. Notify assigned counselor
6. Update checklist
7. Trigger AI validation
8. Send student confirmation email if enabled
9. Record audit event

Email may include the student's optional comment.

Example:

Subject:
Document Received – University X

Your Bank Statement has been received.

Student Comment:
"This is my latest bank statement."

Do NOT state "verified" until human/system verification is complete.

============================================================
19. OFFER LETTER INTELLIGENCE
============================================================

When an offer letter arrives:

Offer Document
→ classify
→ extract
→ identify university
→ identify application
→ validate
→ create offer record
→ create conditions
→ update application
→ notify counselor

Extract:

University
Course
Campus
Intake
Offer type
Conditional/unconditional
Tuition fee
Deposit
Scholarship
Deadline
Conditions
Interview requirement
CAS requirements
Payment requirements

============================================================
20. OFFER SOURCE TRACKING
============================================================

Every offer must record:

source_type:

UNIVERSITY_PORTAL
UNIVERSITY_EMAIL
PARTNER_PORTAL
COUNSELOR_UPLOAD
STUDENT_UPLOAD
API
OTHER

Record:

received_at
received_from
original_filename
source_email
source_reference
uploaded_by
verified_by
verified_at

Display:

OFFER SOURCE

Received via:
University Email

Received:
08 Aug 2026

From:
admissions@...

Original file:
offer-letter.pdf

Verified:
YES

============================================================
21. OFFER VERSIONING
============================================================

Offer letters can be revised.

Store:

Offer Version 1
Offer Version 2
Offer Version 3

Never overwrite historical offer documents.

Keep immutable versions.

AI must compare versions.

Example:

VERSION 1:
Deposit £5,000

VERSION 2:
Deposit £4,000

Create alert:

"Offer condition changed."

Human review required.

============================================================
22. OFFER CONDITION ENGINE
============================================================

After offer verification:

Automatically create:

POST-OFFER REQUIREMENTS

✓ Accept offer
☐ Deposit payment
☐ Bank statement
☐ Sponsor documents
☐ Financial evidence
☐ TB certificate
☐ Interview
☐ CAS documents

Each requirement links to source evidence from the offer.

============================================================
23. UNIVERSITY PAYMENT MANAGEMENT
============================================================

Counselor can manage university payment information.

Fields:

University
Application
Payment type
Amount
Currency
Deadline
Bank name
Account name
Account number
IBAN if applicable
SWIFT/BIC
Sort code
Payment reference
Payment portal URL
Additional instructions
Source document
Verified by
Verified at

AI may EXTRACT payment information.

AI must NOT independently approve payment instructions.

Counselor must verify.

============================================================
24. PAYMENT EMAIL
============================================================

After counselor approval:

[Send Payment Instructions]

Generate official ALO-branded email.

Include:

Student
University
Course
Application ID
Payment amount
Currency
Deadline
Verified payment instructions
Reference
Important warning
ALO contact details

Record:

payment_instruction_id
approved_by
sent_at
recipient
email_log_id

============================================================
25. PAYMENT PROOF
============================================================

Student can upload:

Bank transfer receipt
Transaction receipt
Payment confirmation
Reference

Student comment optional.

AI extracts:

transaction date
amount
currency
reference
bank
sender
recipient

AI can detect obvious mismatches.

Counselor must verify official payment.

Status:

UPLOADED
UNDER_REVIEW
VERIFIED
REJECTED

============================================================
26. NO-SERVICE-CHARGE DECLARATION
============================================================

Before university payment where required by ALO policy:

Show approved ALO declaration.

Example structure:

Student Name
Student ID
University
Application ID

Declaration:
"I confirm that I have not been charged a service fee by
ALO Education for this university application, except where
explicitly stated in a separate written agreement."

Signature/confirmation
Date

IMPORTANT:
Final legal wording must be approved by ALO management/legal
advisor before production.

Do not let AI invent legal terms.

Store signed/confirmed declaration immutably.

============================================================
27. POST-OFFER DOCUMENT GUIDE
============================================================

After offer:

AI creates university-specific guide.

Example:

FINANCIAL DOCUMENT GUIDE

Required:
Bank Statement
Bank Solvency Certificate
Sponsor Declaration
Source of Funds
Financial Affidavit

For each:

What it is
Why it may be required
Who normally provides it
Required information
Common mistakes
Official source
Last verified date

Never advise fraud, fabrication or manipulation.

============================================================
28. COURSE FINDER
============================================================

Course Finder must support:

country
university
course
discipline
degree
intake
tuition
scholarship
English requirement
academic requirement
location
ranking where appropriate
application deadline

AI Course Advisor can personalize recommendations.

Input:

Academic background
IELTS/English
budget
country
course
intake
career goal

Output:

BEST MATCH
SAFE MATCH
AMBITIOUS MATCH
BUDGET MATCH
SCHOLARSHIP MATCH
ALTERNATIVE

Every important recommendation should show source/evidence.

============================================================
29. COURSE MAPPING
============================================================

Course Finder must contain:

[VIEW 7-STEP JOURNEY]

Generate branded visual map.

Seven-step example:

01 DISCOVER
02 COUNSELING
03 COURSE & UNIVERSITY
04 APPLICATION
05 OFFER
06 PAYMENT & DOCUMENTS
07 VISA & SUCCESS

Provide:

[Download PNG]
[Download PDF]

Use official ALO branding.

Also generate personalized map:

✓ completed
⏳ current
○ upcoming

Never expose internal-only information.

============================================================
30. INTERVIEW INTELLIGENCE
============================================================

After interview requirement is detected:

Automatically create:

Interview Preparation Workspace

Sections:

University Questions
Course Questions
Country Questions
Visa Questions
Financial Questions
Future Plan Questions
Academic Questions
English Questions
Credibility Questions
Personal Background Questions

============================================================
31. SIX-MONTH RESEARCH ENGINE
============================================================

When generating interview preparation:

Research the previous minimum 6 months where reliable data exists.

Sources:

Official university sources
Official government/visa sources
Official immigration guidance
ALO verified historical interview reports
Counselor-approved records
Student-reported experiences
Reliable public sources

Store:

source
publication date
retrieval date
country
university
topic
confidence
evidence
last verified

Do not claim:

"This exact question will definitely be asked."

Instead say:

"Recent reported themes/questions."

Use confidence levels.

============================================================
32. INTERVIEW QUESTION GENERATOR
============================================================

Generate university-specific questions.

Examples:

Why did you choose this university?
Why did you choose this course?
Why this country?
Why not another country?
How does the course relate to your previous education?
What modules interest you?
What are your career plans?
Who will fund your education?
What is your total tuition?
How will you support living expenses?
Why do you believe this is a genuine academic progression?

Generate questions based on actual student profile.

Do not generate generic answers disconnected from the student.

============================================================
33. PERSONALIZED ANSWER ENGINE
============================================================

Student enters factual information:

Financial Sponsor:
[student input]

Future Plan:
[student input]

Why University:
[student input]

Why Course:
[student input]

AI creates:

Answer Framework
Natural Answer
Short Answer
Expanded Answer
Key Points
Possible Follow-up
What NOT to say

IMPORTANT:

AI must NEVER fabricate:

- employment
- income
- bank balance
- family relationship
- travel history
- academic result
- future plan
- sponsor
- motivation

Answers must be based on verified student facts.

============================================================
34. FINANCIAL + FUTURE PLAN COACH
============================================================

Special module:

"Financial Interview Coach"

and:

"Future Plan Coach"

AI helps student convert their actual facts into:

1. Clear answer
2. Natural English
3. Short interview answer
4. Follow-up answer
5. Difficult-question response

No false information.

============================================================
35. INTERVIEW ANSWER QUALITY
============================================================

Evaluate:

Accuracy
Truthfulness
Relevance
Consistency
Course knowledge
University knowledge
Financial understanding
Future plan
English clarity
Fluency
Pronunciation intelligibility
Confidence
Response structure

Do NOT use one raw "AI score" as the only criterion.

============================================================
36. BANGLADESHI ENGLISH / ACCENT SUPPORT
============================================================

The AI Interviewer must understand:

Bangladeshi English
Bangla-influenced pronunciation
Slow speech
Hesitation
Broken English
Grammar errors
Code-switching
Repeated words
Different accents

Do NOT penalize a student simply for having a Bangladeshi accent.

Separate:

ACCENT
from
INTELLIGIBILITY

Evaluate whether the answer can be understood.

Content and correctness must have greater weight than accent.

============================================================
37. AI INTERVIEW PRACTICE
============================================================

Create human-like adaptive interview.

Flow:

AI asks question
→ student answers
→ AI analyzes
→ AI identifies weakness
→ AI asks follow-up
→ student answers
→ AI continues

Do not use only fixed question lists.

The AI interviewer should adapt to student answers.

============================================================
38. 72-HOUR INTERVIEW WINDOW
============================================================

When interview preparation pack is downloaded/generated:

Start a configurable 72-hour practice window.

Dashboard:

INTERVIEW PRACTICE

Time Remaining:
XX:XX:XX

Sessions:
X

Questions:
X

Weak Areas:
X

Improvement:
X%

AI Coach:
AVAILABLE 24/7

After 72 hours:
practice access may expire or move to counselor-controlled extension.

Never silently delete practice records.

============================================================
39. VIDEO INTERVIEW
============================================================

Student can complete recorded mock interview.

Record:

video
audio
transcript
questions
answers
timestamps
session metadata
AI preliminary assessment

Store securely.

Student can view their own recording if policy allows.

Counselor can review authorized recording.

============================================================
40. AI PRELIMINARY INTERVIEW ASSESSMENT
============================================================

AI assesses:

Course knowledge
University knowledge
Financial answer
Future plan
Consistency
Communication
Question comprehension
Answer relevance
Pronunciation intelligibility
Hesitation
Missing answers
Contradictions

Output:

READY
READY WITH IMPROVEMENT
NEEDS MORE PRACTICE

AI must NOT guarantee visa/interview success.

Never say:
"100% pass"

Use:
"Interview readiness"

============================================================
41. HUMAN FINAL INTERVIEW REVIEW
============================================================

After AI assessment:

Create:

HUMAN REVIEW REQUIRED

Counselor/Supervisor can see:

Video
Transcript
AI analysis
Weaknesses
Questions
Student profile
Application data

Human makes final decision:

READY
MORE PRACTICE
NOT READY

Human decision overrides AI.

Store reviewer
timestamp
decision
comments

============================================================
42. INTERVIEW PDF GENERATION
============================================================

Generate official ALO branded documents.

Documents:

Interview Question Pack
Personalized Answer Guide
Financial Interview Guide
Future Plan Guide
University Interview Guide
Country Interview Guide
Visa Interview Preparation Guide
Final Interview Checklist

Every PDF must contain:

ALO Education logo
official brand
student name
student ID
university
course
application ID
generation date
version
confidentiality footer

Do not allow arbitrary unbranded "official" PDFs.

============================================================
43. PDF VERSION CONTROL
============================================================

Generated documents:

Version 1
Version 2
Version 3

Never overwrite.

Keep history.

Latest version is downloadable.

Internal staff can compare versions.

============================================================
44. STUDENT DOCUMENT PERMISSIONS
============================================================

Student:

CAN:
upload
view
download
comment
respond
practice
request help

CANNOT:
delete official records
delete application
change official application status
change offer status
change payment verification
delete internal notes
delete audit logs
delete profile
modify verified data without controlled workflow

Backend must enforce all restrictions.

Do not rely on frontend UI hiding.

============================================================
45. STUDENT PROFILE LOCK
============================================================

Student cannot delete profile.

If account closure is required:

Use:

DEACTIVATION / RETENTION WORKFLOW

not physical deletion of legally/business-required records.

============================================================
46. COMMUNICATION ENGINE
============================================================

Support:

Email
WhatsApp
SMS where configured
Portal notification
Internal CRM message
Website chat

Every message must link to:

student_id
application_id
document_id if applicable
thread_id
campaign/request ID
sender
recipient
timestamp

============================================================
47. DOCUMENT REQUEST COMMUNICATION
============================================================

Example:

Student missing:

Bank Statement
Sponsor Letter
TB Certificate

Counselor clicks:

[REQUEST MISSING DOCUMENTS]

AI creates:

Email
WhatsApp

Counselor sees preview.

Then:

[APPROVE & SEND]

Record communication.

============================================================
48. EMAIL AUTOMATION
============================================================

Automate:

document request
document received
document rejected
document verified
offer received
offer condition
payment instruction
payment reminder
interview preparation
interview reminder
visa readiness
success message
review request

Every automated email must have:

template ID
version
trigger
recipient
approval mode
timestamp
delivery status

============================================================
49. WHATSAPP AUTOMATION
============================================================

Use approved WhatsApp Business API templates where required.

Support:

missing documents
payment reminder
offer notification
interview reminder
appointment
success message

Respect consent and channel preferences.

============================================================
50. STUDENT COMMUNICATION PREFERENCES
============================================================

Student controls:

Email
WhatsApp
SMS
Portal

Preferences:

marketing
transactional
application
urgent

Transactional/legal/application notifications must follow applicable
consent and policy rules.

============================================================
51. STUDENT MEMORY
============================================================

Create four memory layers:

STRUCTURED MEMORY
profile, education, applications

SEMANTIC MEMORY
preferences, long-term context

EPISODIC MEMORY
important conversations and events

TIMELINE MEMORY
what happened and when

Create:

student_world_state

Example:

goal
countries
course
intake
academic_state
english_state
financial_state
application_state
document_state
interview_state
visa_state
risk_state
engagement_state
next_best_action

============================================================
52. RAG 2.0
============================================================

Do NOT rely only on vector similarity.

Use hybrid retrieval:

Vector search
Keyword search
Structured database
Metadata filtering
Reranking
Relationship/graph context

RAG sources:

University data
Course data
Country rules
Visa guidance
Scholarships
English requirements
ALO SOP
Internal policies
Approved FAQs
Verified interview research
Student-safe knowledge

Every high-impact answer should expose:

Source
Last verified
Confidence

============================================================
53. KNOWLEDGE PROVENANCE
============================================================

Every knowledge item:

source_url
source_type
publisher
published_at
retrieved_at
verified_at
expires_at if applicable
confidence
approved_by

AI must prefer official/current sources for:

visa
immigration
university requirements
payment
application rules

============================================================
54. KNOWLEDGE EXPIRY
============================================================

Critical information must have freshness rules.

Example:

Visa rule:
short freshness window

University requirement:
refresh regularly

Course tuition:
refresh regularly

Interview trend:
6-month rolling window

Expired information must be flagged.

============================================================
55. EVENT-DRIVEN SYSTEM
============================================================

Create events:

STUDENT_CREATED
PROFILE_UPDATED
DOCUMENT_UPLOADED
DOCUMENT_VERIFIED
DOCUMENT_REJECTED
DOCUMENT_REQUESTED
APPLICATION_CREATED
APPLICATION_SUBMITTED
OFFER_RECEIVED
OFFER_VERIFIED
OFFER_UPDATED
PAYMENT_REQUESTED
PAYMENT_PROOF_UPLOADED
PAYMENT_VERIFIED
INTERVIEW_REQUIRED
INTERVIEW_PACK_GENERATED
INTERVIEW_PACK_DOWNLOADED
PRACTICE_STARTED
PRACTICE_COMPLETED
HUMAN_REVIEW_REQUESTED
VISA_READY
VISA_APPROVED
SUCCESS_CREATED
REVIEW_REQUESTED

Events trigger appropriate workflows.

============================================================
56. NEXT BEST ACTION ENGINE
============================================================

For every active student/application calculate:

NEXT BEST ACTION

Based on:

deadline
risk
missing documents
application state
offer condition
payment
interview
visa
student engagement

Example:

HIGH PRIORITY:
Upload bank statement

MEDIUM:
Complete interview practice

LOW:
Review scholarship options

============================================================
57. RISK ENGINE
============================================================

Calculate:

Document Risk
Application Risk
Deadline Risk
Financial Risk
Interview Risk
Engagement Risk
Visa Readiness Risk

Example:

No login 12 days
+
deadline in 18 days
+
3 missing documents

→ HIGH ENGAGEMENT/APPLICATION RISK

Notify:

Student
Counselor

============================================================
58. AI COMMAND CENTER
============================================================

Create:

/crm/ai-command-center

Show:

Active agents
Running tasks
Pending approvals
Failed tasks
Human handoffs
RAG queries
Tool calls
AI cost
AI latency
High-risk students
Overdue documents
Upcoming deadlines

Agent cards:

Admission Agent
Document Agent
Offer Agent
Payment Agent
Interview Agent
Communication Agent
Visa Agent
Risk Agent

============================================================
59. AGENT OBSERVABILITY
============================================================

Track:

agent runs
task duration
tool calls
failures
retry count
token usage
estimated cost
model
confidence
human escalation
successful completion
policy violations

Dashboard:

Agent Success Rate
Tool Failure Rate
Average Duration
Human Escalation Rate
AI Cost
RAG Hit Rate
Evaluation Score

============================================================
60. MODEL ROUTER
============================================================

Create model abstraction.

Application code must NOT be hard-coded to one model provider.

ALO AI Gateway:

Premium LLM
Fast LLM
Reasoning LLM
Embedding model
Speech model
OCR model
Local model

Use model routing by task.

Simple task:
fast/cheap model

Complex reasoning:
strong reasoning model

Sensitive/private workload:
approved private/local model

============================================================
61. OLLAMA / PRIVATE AI
============================================================

Support optional local/private AI.

Use for:

classification
summarization
preprocessing
internal knowledge
development
privacy-sensitive tasks where appropriate

Do not assume local model is automatically better.

Evaluate accuracy before production use.

============================================================
62. TOOL GATEWAY
============================================================

Agents must use controlled tools.

Examples:

student.getProfile()
student.updateProfile()

application.get()
application.updateStatus()

course.search()
course.compare()

university.getRequirements()

document.getChecklist()
document.request()
document.verify()

offer.extract()
offer.compare()

payment.getInstructions()
payment.prepareEmail()

communication.sendEmail()
communication.sendWhatsApp()

interview.generateQuestions()
interview.generateAnswerGuide()
interview.startPractice()

pdf.generate()

success.create()

Each tool must validate authorization.

============================================================
63. MCP-READY DESIGN
============================================================

Design Tool Gateway so it can support standardized tool/context
protocols such as MCP where useful.

Do not make MCP mandatory for every internal function.

Use it when it improves interoperability.

All tools still require:

authentication
authorization
input validation
output validation
audit logging

============================================================
64. SECURITY
============================================================

Implement defense in depth.

Threats:

Prompt injection
Indirect prompt injection
Document injection
Tool poisoning
Memory poisoning
Data leakage
Privilege escalation
Unauthorized tool calls
Cross-student access
Cross-application access
Cross-tenant leakage
Malicious files
Sensitive information exposure

Treat all uploaded documents, external webpages and retrieved content
as untrusted data.

Never treat document text as system instructions.

============================================================
65. AGENT PERMISSIONS
============================================================

Every agent has:

READ permissions
WRITE permissions
TOOL permissions
DATA scope
ACTION scope

Example:

Course Agent:

READ:
profile
courses
universities

WRITE:
recommendations

CANNOT:
payment
visa
application submission

Document Agent:

READ:
authorized documents

WRITE:
classification/extraction

CANNOT:
delete official records

============================================================
66. TRAJECTORY SECURITY
============================================================

Do not only check individual tool calls.

Monitor the full action sequence.

Example:

Read passport
→ read bank statement
→ modify profile
→ create application
→ submit application

If sequence becomes suspicious:

STOP
→ security review
→ human approval

============================================================
67. AUDIT LOGGING
============================================================

Every AI action:

actor_type
agent_id
model
tool
input_reference
output_reference
student_id
application_id
timestamp
confidence
policy_result
approval_required
approved_by
result

Never store unnecessary sensitive prompt content.

Protect audit logs from normal user deletion.

============================================================
68. AI EVALUATION
============================================================

Create evaluation datasets.

Admission:
100+ cases

Document:
100+ cases

Course matching:
100+ cases

Interview:
100+ cases

Communication:
100+ cases

Measure:

accuracy
groundedness
tool correctness
policy compliance
human escalation correctness
latency
cost
hallucination/error rate

Create regression tests.

Every major prompt/model change must run evaluation.

============================================================
69. QUALITY CONTROL
============================================================

Use separation of duties.

Example:

Agent generates
→ QA Agent checks
→ Human approves if required

Do not rely on the exact same model to generate and blindly approve
critical output.

============================================================
70. STUDENT PORTAL
============================================================

Main dashboard:

Welcome
Student ID
Journey progress
Current application
Next best action
Missing documents
Offers
Payments
Interview
Visa
Messages
Notifications
Documents
Journey map
Success

============================================================
71. STUDENT APPLICATION PAGE
============================================================

Tabs:

Overview
Timeline
Documents
Offer
Payment
Interview
Communication
Journey
Notes/Student Comments

Never show:

Internal ALO notes
Private staff information
Internal scoring
Confidential partner data

============================================================
72. COUNSELOR DASHBOARD
============================================================

Counselor dashboard:

Assigned students
Assigned applications
Missing documents
New uploads
New offers
Payment pending
Interview pending
Upcoming deadlines
High-risk students
AI recommendations
Pending approvals
Communication queue

============================================================
73. COUNSELOR QUICK ACTIONS
============================================================

For every application:

[Request Missing Documents]
[Send Email]
[Send WhatsApp]
[View Offer]
[Verify Offer]
[Manage Payment]
[Generate Interview Pack]
[Start Practice]
[Review Interview]
[Add Student Comment]
[Add Internal Note]
[View Journey]
[View AI Recommendation]

============================================================
74. OFFER DASHBOARD
============================================================

Offer table:

Application
University
Course
Offer Type
Received Date
Source
Conditions
Deposit
Deadline
Verification
Version

Filters:

Conditional
Unconditional
Payment Pending
Interview Required
CAS Pending

============================================================
75. PAYMENT DASHBOARD
============================================================

Show:

Payment required
Amount
Currency
Deadline
Instructions
Verification
Student payment proof
Counselor approval

Never expose internal banking credentials beyond authorized roles.

============================================================
76. INTERVIEW DASHBOARD
============================================================

Show:

University
Application
Interview type
Research status
Question pack
Answer pack
PDF
Download date
72-hour window
Practice sessions
AI assessment
Human assessment

============================================================
77. INTERVIEW RESEARCH DATABASE
============================================================

Store:

country
university
course
interview type
question
theme
source
date
confidence
last_verified
frequency
answer guidance

Do not present historical reports as guaranteed future questions.

============================================================
78. OFFICIAL ALO PDF BRANDING
============================================================

Every official generated PDF:

ALO Education logo
brand colors
official header
student ID
application ID
university
course
document title
generation date
version
confidentiality footer
page number

No unbranded AI documents.

============================================================
79. SUCCESS ENGINE
============================================================

When VISA_APPROVED:

Create Success record.

Display:

University
Course
Country
Student
Success date
Journey completed

Trigger:

success notification
review request
testimonial option
alumni invitation
referral option

============================================================
80. REVIEW REQUEST
============================================================

Provide:

Google Review
Facebook Review
ALO testimonial

Use genuine-review request.

Never:

pay for reviews
offer discount for review
require 5-star review
write review for student
ask student to remove negative review
filter only positive reviewers

Provide QR code/link.

Google officially supports review links and QR codes for asking customers
for genuine reviews. Follow current Google policies.

============================================================
81. SUCCESS STORY CONSENT
============================================================

Before publishing student story:

☐ Consent to publish name
☐ Consent to publish photo
☐ Consent to publish university
☐ Consent to publish course
☐ Consent to publish testimonial

Store consent.

Student can withdraw where applicable.

============================================================
82. ALUMNI SYSTEM
============================================================

After success:

Student
→ Alumni

Store:

university
country
course
graduation/intake
success story
referral preference
communication preference

Alumni can become referral source.

============================================================
83. COMMUNICATION CONSISTENCY
============================================================

All communication channels must use the same:

Student ID
Application ID
Conversation context
approved templates
language preference

A student can start on WhatsApp and continue in portal without losing
application context.

============================================================
84. MULTILINGUAL SUPPORT
============================================================

Support:

Bangla
English

Future-ready for additional languages.

AI must preserve official terms such as:

University names
Course names
Visa categories
Document names

Do not translate proper names incorrectly.

============================================================
85. VOICE SUPPORT
============================================================

Future-ready:

Speech-to-text
Text-to-speech
Voice interview
WhatsApp voice where supported

Student can ask:

"What is missing from my application?"

AI identifies Student ID and current application.

============================================================
86. MULTIMODAL AI
============================================================

Support:

PDF
Image
Scanned document
Voice
Video
Text

Example:

Student uploads offer letter image.

AI:

detects university
extracts course
extracts conditions
links application
creates checklist

============================================================
87. DATA MODEL
============================================================

At minimum include:

students
student_profiles
student_preferences
student_consents

applications
application_status_history
application_events

universities
courses
course_requirements
university_requirements

document_requirements
documents
document_versions
document_uploads
document_comments
document_requests
document_verifications

offers
offer_versions
offer_conditions
offer_sources

payment_requests
payment_instructions
payment_proofs
payment_verifications

interview_programs
interview_questions
interview_question_sources
interview_answers
interview_answer_guides
interview_sessions
interview_recordings
interview_transcripts
interview_ai_assessments
interview_human_reviews

communications
communication_threads
communication_messages
communication_templates
email_logs
whatsapp_logs

student_memory
student_memory_embeddings
student_events
student_world_state

rag_documents
rag_chunks
rag_sources
rag_citations

ai_agents
ai_agent_runs
ai_agent_tasks
ai_agent_tools
ai_agent_permissions
ai_tool_calls

ai_workflows
ai_workflow_steps

ai_human_approvals
ai_escalations

ai_evaluations
ai_model_usage
ai_model_costs

ai_security_events
ai_policy_violations

journey_steps
journey_events

generated_documents
generated_document_versions

success_stories
review_requests
review_consents
alumni_records

============================================================
88. FILE STORAGE
============================================================

Student documents require:

private storage
signed URLs
access control
virus scanning
metadata
versioning
audit

Do not expose direct public URLs for sensitive documents.

============================================================
89. RETENTION
============================================================

Create configurable retention rules.

Different data types:

student documents
application records
financial evidence
interview recordings
AI logs
audit logs
communications

Retention must follow applicable law, contract and ALO policy.

============================================================
90. ROLE-BASED ACCESS
============================================================

Roles may include:

SUPER_ADMIN
ADMIN
MANAGER
COUNSELOR
SENIOR_COUNSELOR
VISA_OFFICER
ADMISSION_OFFICER
FINANCE
MARKETING
PARTNER
STUDENT

Each role receives:

page permissions
data permissions
action permissions
AI permissions

============================================================
91. PARTNER PORTAL
============================================================

Partner can see only authorized students/applications.

Never expose:

internal ALO notes
other partner students
private counselor information
internal AI scores
confidential financial information unless authorized

============================================================
92. AI COST CONTROL
============================================================

Track:

model
tokens
input
output
cost
task
student
agent
date

Create budgets.

Route simple tasks to cheaper models.

Cache reusable results where safe.

============================================================
93. FAILURE HANDLING
============================================================

AI failure must NOT corrupt workflow.

If agent fails:

retry
fallback model
fallback deterministic workflow
human escalation

Never mark official workflow complete simply because AI returned an answer.

============================================================
94. HUMAN HANDOFF
============================================================

Create:

ESCALATE TO COUNSELOR

Reasons:

uncertain document
financial discrepancy
visa uncertainty
conflicting student information
policy violation
AI confidence low
student requests human
high-risk action

Provide complete context to counselor.

============================================================
95. AI CONFIDENCE
============================================================

Do not display false precision.

Use:

HIGH
MEDIUM
LOW

and supporting evidence.

For critical decisions:

AI confidence is never a substitute for human authorization.

============================================================
96. NO HALLUCINATION POLICY
============================================================

AI must:

retrieve evidence
cite source
state uncertainty
ask for clarification
escalate

Never invent:

university requirement
visa rule
payment information
deadline
scholarship
interview question
student fact

============================================================
97. CURRENT INFORMATION
============================================================

For current university/visa/payment information:

Use approved current sources.

Store last verified timestamp.

When information is stale:

SHOW WARNING

"Information requires verification."

============================================================
98. ADMIN AI CONTROL
============================================================

Admin can configure:

agents
models
prompts
tools
permissions
approval policies
RAG sources
knowledge freshness
templates
communication rules
workflow triggers
AI budgets
evaluation datasets

All changes are audited.

============================================================
99. AI COMMAND CENTER APPROVAL QUEUE
============================================================

Show:

Pending document verification
Pending offer verification
Pending payment instruction approval
Pending interview review
Pending high-risk AI action
Pending policy exception

Buttons:

Approve
Reject
Request Changes
Escalate

============================================================
100. COMPLETE STUDENT JOURNEY AUTOMATION
============================================================

Example:

STUDENT CREATED
↓
AI onboarding
↓
profile completed
↓
course matching
↓
university selection
↓
application created
↓
document checklist
↓
missing document request
↓
student uploads
↓
AI extraction
↓
verification
↓
application submission
↓
offer received
↓
offer extraction
↓
offer verification
↓
post-offer checklist
↓
payment instructions
↓
human approval
↓
student payment
↓
payment proof
↓
verification
↓
interview requirement
↓
six-month research
↓
personalized questions
↓
personalized answers
↓
ALO branded PDF
↓
72-hour AI practice
↓
video interview
↓
AI preliminary assessment
↓
human final review
↓
visa readiness
↓
visa
↓
success
↓
genuine review request
↓
testimonial consent
↓
alumni
↓
referral

============================================================
101. UI/UX REQUIREMENT
============================================================

UI must be:

professional
modern
fast
responsive
mobile-first for student
desktop-first for CRM
accessible
clear
low cognitive load

Use:

status badges
progress indicators
timeline
document checklist
application cards
approval drawers
AI action previews
audit panels
empty states
loading states
error states
confirmation dialogs

Do not hide important actions in unnecessary menus.

============================================================
102. DOCUMENT UI
============================================================

Each document row:

Document name
Required/Optional
Status
Uploaded date
Expiry
Source
Version
Comment
Verification
Request button
Download button

Counselor actions:

Request
Review
Verify
Reject
Replace
Download
Comment

Student:

View
Download
Upload
Comment

No Delete button for official records.

============================================================
103. APPLICATION UI
============================================================

Each application:

Header
University
Course
Intake
Status
Progress

Tabs:

Overview
Timeline
Documents
Offer
Payment
Interview
Messages
Journey

============================================================
104. AI ACTION PREVIEW
============================================================

Before AI sends:

Show:

ACTION
RECIPIENT
CHANNEL
CONTENT
SOURCE
DATA USED
RISK
APPROVAL REQUIRED

Buttons:

Approve
Edit
Reject

Never silently send high-impact messages.

============================================================
105. SEARCH
============================================================

Global search:

Student ID
Name
Application ID
University
Course
Document
Offer
Payment
Communication

AI search can answer:

"Show all students with Birmingham offers waiting for payment."

But underlying results must respect authorization.

============================================================
106. REPORTING
============================================================

Reports:

Applications by stage
Offer rate
Offer conversion
Document completion
Payment pending
Interview readiness
Visa success
Student engagement
Counselor performance
AI performance
AI cost
Agent failures
Communication response rate

============================================================
107. SLA ENGINE
============================================================

Track:

document request SLA
counselor response SLA
offer processing SLA
payment instruction SLA
interview preparation SLA
student response SLA

Trigger escalation when overdue.

============================================================
108. NOTIFICATION ENGINE
============================================================

Notification types:

urgent
application
document
payment
interview
visa
success
AI
system

Channels:

portal
email
WhatsApp
SMS if configured

============================================================
109. SECURITY ACCEPTANCE CRITERIA
============================================================

Test:

Student A cannot access Student B.
Student cannot access internal notes.
Student cannot modify application status.
Partner cannot access unrelated students.
AI agent cannot call unauthorized tool.
AI cannot execute payment without approval.
Uploaded malicious document cannot execute instructions.
External webpage cannot override system instructions.
Expired source cannot silently become current source.
AI cannot expose confidential data.

============================================================
110. TESTING
============================================================

Create:

unit tests
integration tests
RBAC tests
API tests
workflow tests
AI evaluation tests
security tests
prompt injection tests
document tests
permission tests
communication tests
PDF tests

Test end-to-end:

Student → Application → Missing Document → Upload
→ Offer → Payment → Interview → Success

============================================================
111. DEMO SCENARIO
============================================================

Create one complete demo student:

Student:
AE-2026000001

Course:
MSc Computer Science

University:
Example University

Demonstrate:

1. Student onboarding
2. Course recommendation
3. Application #01
4. Document checklist
5. Missing document request
6. Email/WhatsApp preview
7. Student upload
8. Student comment
9. Internal counselor note
10. Offer upload
11. Offer extraction
12. Offer source
13. Offer verification
14. Payment information
15. Payment email
16. Payment proof
17. Interview requirement
18. Six-month research
19. Question pack
20. Personalized answers
21. Official ALO PDF
22. 72-hour practice
23. Video interview
24. AI assessment
25. Human assessment
26. Visa readiness
27. Success
28. Review request
29. Alumni

============================================================
112. IMPLEMENTATION RULE
============================================================

DO NOT stop after building UI.

Every feature must have:

UI
API
Database
Authorization
Validation
Audit
Error handling
Testing
Integration
Empty states
Loading states
Failure states

============================================================
113. NO FAKE COMPLETION
============================================================

NEVER report:

"Complete"

unless verified.

For every module report:

IMPLEMENTED
PARTIALLY IMPLEMENTED
BLOCKED
NOT IMPLEMENTED

Provide evidence:

file
route
database table
API
test
screenshot if available

============================================================
114. PRODUCTION READINESS
============================================================

Before final delivery verify:

Build succeeds
Database migrations succeed
Authentication works
RBAC works
Student portal works
CRM works
Documents work
Email works where configured
WhatsApp works where configured
AI gateway works
RAG works
Agent tools work
Human approvals work
Audit works
PDF generation works
Interview recording works
Permissions work
No unauthorized student access
No critical console errors
No broken routes
No duplicate workflows

============================================================
115. DEPLOYMENT
============================================================

Respect existing deployment environment.

If cPanel/PHP/MySQL is existing production environment:

Keep core CRM compatible.

AI orchestration may run as a separate service if necessary.

Recommended:

Existing CRM
+
AI Service
+
Worker
+
Redis
+
RAG storage
+
MySQL/PostgreSQL as appropriate
+
Object storage
+
n8n

Do not force heavy AI orchestration into shared PHP hosting if it
creates reliability/security problems.

============================================================
116. RECOMMENDED AI SERVICE
============================================================

AI service:

Python/FastAPI or equivalent

Responsibilities:

orchestrator
agents
RAG
model gateway
document intelligence
interview intelligence
evaluation
AI tools

Existing CRM remains source of truth for business data.

============================================================
117. SOURCE OF TRUTH
============================================================

CRM/Database = official business state.

RAG = knowledge.

AI memory = contextual intelligence.

AI model = reasoning.

Workflow engine = deterministic automation.

Human = authority for high-risk decisions.

This separation is mandatory.

============================================================
118. FINAL SYSTEM PHILOSOPHY
============================================================

ALO must behave like:

"One intelligent system with many specialized agents,
one Student ID, one application timeline, one memory,
one source of truth, one permission model, and one
continuous student journey."

Not:

"Many disconnected AI tools."

============================================================
119. FINAL ACCEPTANCE TEST
============================================================

A system is considered successful only if a counselor can:

1. Open a student.
2. See every university application in serial order.
3. Open any application.
4. See current stage.
5. See missing documents.
6. Click a missing document.
7. Request it by email.
8. Request it by WhatsApp.
9. Student receives request.
10. Student uploads document.
11. Student adds optional comment.
12. Counselor sees student comment.
13. Counselor adds private internal note.
14. Student cannot see internal note.
15. Student cannot delete document.
16. Student cannot change application stage.
17. Offer letter arrives.
18. System identifies university/application.
19. System extracts offer conditions.
20. Counselor verifies.
21. Payment information is prepared.
22. Counselor verifies.
23. Student receives official ALO payment email.
24. Student uploads payment proof.
25. Counselor verifies.
26. Interview requirement is detected.
27. AI researches recent six-month evidence.
28. AI creates university/country interview questions.
29. Student enters real financial/future-plan facts.
30. AI creates personalized answer framework.
31. Official ALO PDF is generated.
32. Student downloads it.
33. 72-hour interview practice starts.
34. AI conducts adaptive interview.
35. AI understands Bangladeshi-accented English.
36. Video interview is recorded.
37. AI produces preliminary assessment.
38. Human counselor performs final review.
39. Visa stage is tracked.
40. Visa approval creates Success.
41. Student receives genuine review request.
42. Student can use Google/Facebook review link/QR.
43. Student may consent to ALO testimonial.
44. Success story is created.
45. Student moves to Alumni.
46. Entire journey remains auditable.

============================================================
120. FINAL DELIVERABLE
============================================================

Deliver:

A. Architecture
B. Database schema
C. API specification
D. Agent definitions
E. Tool definitions
F. Permission matrix
G. Event catalog
H. Workflow catalog
I. RAG architecture
J. Memory architecture
K. Document architecture
L. Application architecture
M. Offer architecture
N. Payment architecture
O. Interview architecture
P. Student portal
Q. Counselor CRM
R. AI Command Center
S. PDF system
T. Communication engine
U. Security architecture
V. Audit architecture
W. Evaluation framework
X. Testing plan
Y. Deployment plan
Z. Production verification report

============================================================
FINAL COMMAND
============================================================

ACT AS A:

Senior Software Architect
+
Senior AI Agent Architect
+
AI Security Architect
+
RAG Engineer
+
CRM Architect
+
Education Technology Architect
+
UX/Product Architect
+
DevOps Engineer
+
QA Engineer

Do not merely describe the solution.

Inspect the existing system first.

Then implement the architecture.

Reuse working components.

Integrate instead of duplicating.

Do not remove working features.

Do not fabricate completion.

Do not create fake APIs.

Do not create placeholder buttons that do nothing.

Every visible action must either work or be explicitly marked
as unavailable/configuration-pending.

Every AI action must have permissions.

Every important AI result must have evidence.

Every high-impact action must have human approval.

Every official status must have backend validation.

Every student action must be associated with Student ID.

Every application must have a unique serial.

Every document must have lifecycle state and audit trail.

Every offer must have source and version history.

Every payment instruction must have verification.

Every interview preparation pack must have source/freshness metadata.

Every generated official PDF must use ALO branding.

Every student must receive a personalized journey.

Every critical action must be auditable.

Build this as a real production system,
not as a prototype disguised as a finished product.

============================================================
END MASTER PROMPT
============================================================



ALO_STUDENT_MIGRATION_UNIVERSITY_COURSE_DATA_SYSTEM
============================================================

PROJECT:
ALO EDUCATION COMPLETE WEB + CRM

MODULES:

1. OLD CRM STUDENT MIGRATION IMPORT CENTER
2. UNIVERSITY DATA CENTER
3. COURSE DATA CENTER
4. COUNTRY DATA CENTER
5. WEEKLY AI UNIVERSITY/COURSE UPDATE AGENT
6. DATA QUALITY + DUPLICATE ENGINE
7. SOURCE & EVIDENCE ENGINE
8. SUPER ADMIN APPROVAL CENTER
9. COURSE FINDER DATABASE ENGINE
10. PUBLIC WEBSITE DATA SYNC
11. CRM COURSE CATALOG SYNC
12. AI AGENT KNOWLEDGE SYNC
13. IMPORT AUDIT + VERSION HISTORY
14. DATA ROLLBACK SYSTEM

============================================================
                    CRITICAL RULE
============================================================

DO NOT rebuild the ALO Education project from zero.

DO NOT replace the existing CRM.

DO NOT replace the existing Student Dashboard.

DO NOT replace the existing Course Finder.

DO NOT replace existing Country Pages.

DO NOT replace existing University Pages.

DO NOT remove existing student profiles.

DO NOT delete existing applications.

DO NOT destroy existing documents.

DO NOT overwrite existing student information automatically.

DO NOT create duplicate university records.

DO NOT create duplicate course records.

DO NOT create duplicate student records.

USE THE EXISTING ALO EDUCATION SYSTEM.

Inspect the existing architecture first.

Identify existing:

- Authentication
- Users
- Students
- Student profiles
- Applications
- Documents
- Communications
- Tasks
- Notes
- Payments
- Visa
- CRM
- Course Finder
- Country pages
- University pages
- Admin dashboard
- AI systems
- Database
- Storage
- Notifications
- Audit logs

Then integrate this module into the existing architecture.

============================================================
                    PRIMARY OBJECTIVE
============================================================

Create a centralized data system where:

OLD CRM DATA
      ↓
IMPORT CENTER
      ↓
STAGING
      ↓
VALIDATION
      ↓
NORMALIZATION
      ↓
DUPLICATE DETECTION
      ↓
MATCH / MERGE REVIEW
      ↓
SUPER ADMIN APPROVAL
      ↓
LIVE STUDENT DATABASE


AND:


OFFICIAL UNIVERSITY SOURCES
      ↓
UNIVERSITY/COURSE DATABASE
      ↓
WEEKLY AI RESEARCH AGENT
      ↓
CHANGE DETECTION
      ↓
SOURCE + EVIDENCE
      ↓
UPDATE REQUEST
      ↓
SUPER ADMIN REVIEW
      ↓
APPROVE / EDIT / REJECT
      ↓
PUBLISH
      ↓
COURSE FINDER
      ↓
COUNTRY PAGE
      ↓
UNIVERSITY PAGE
      ↓
CRM COURSE CATALOG
      ↓
AI KNOWLEDGE BASE


Nothing important should bypass approval.

============================================================
              PART 1 — OLD CRM STUDENT MIGRATION
============================================================

Create:

SUPER ADMIN
→ DATA IMPORT CENTER
→ OLD CRM STUDENT MIGRATION

Route:

/admin/import-center/students

Only authorized Super Admin/Admin users may access this system.

Default:

SUPER ADMIN ONLY

============================================================
                    IMPORT FORMATS
============================================================

Support:

CSV
XLSX
Excel

Optional future support:

JSON
API import
ZIP document package

Do not directly insert imported data into live tables.

EVERY IMPORT MUST FIRST GO TO STAGING.

============================================================
                  IMPORT BATCH
============================================================

Every import creates:

IMPORT_BATCH

Example:

Batch ID:
IMP-2026-000001

Store:

batch_id
source_crm
uploaded_by
uploaded_at
file_name
file_type
file_size
row_count
valid_rows
invalid_rows
duplicate_rows
matched_rows
new_rows
status
approved_by
approved_at
created_at
updated_at

Statuses:

UPLOADED
PARSING
VALIDATING
READY_FOR_REVIEW
REVIEW_REQUIRED
APPROVED
IMPORTING
COMPLETED
PARTIALLY_COMPLETED
FAILED
CANCELLED
ROLLED_BACK

============================================================
                 OLD CRM IMPORT FIELDS
============================================================

Supported fields:

oldCrm
oldCrmId
studentName
firstName
lastName
phone
whatsapp
email
passportNumber
dateOfBirth
countryInterest
courseInterest
universityInterest
applicationStatus
counselorName
documents
notes
communicationHistory
paymentStatus
visaStatus
createdDate
updatedDate

Also support optional:

gender
nationality
address
city
country
postCode
alternativePhone
parentName
guardianName
academicHistory
englishTest
leadSource
campaign
branch
assignedCounselor
applicationNumber
universityApplicationId
offerStatus
intake
courseName
tuitionFee
currency
deposit
scholarship
visaApplicationNumber
visaDecision
tasks
followUps

The import system must be extensible.

============================================================
                COLUMN MAPPING ENGINE
============================================================

Do NOT assume old CRM column names are identical.

Create:

COLUMN MAPPING STEP

Example:

Old CRM:

Student Name

maps to:

studentName

Old CRM:

Mobile Number

maps to:

phone

Old CRM:

WhatsApp Number

maps to:

whatsapp

Old CRM:

Passport No

maps to:

passportNumber

Admin must be able to manually map columns.

Support:

Automatic mapping suggestion
Manual mapping
Save mapping template
Reuse mapping template

============================================================
               DATA NORMALIZATION
============================================================

Normalize:

Phone numbers
WhatsApp numbers
Email addresses
Passport numbers
Names
Country names
University names
Course names
Dates

Examples:

+8801XXXXXXXXX
8801XXXXXXXXX
01XXXXXXXXX

must normalize to a canonical format.

Emails:

Test@Example.com

and

test@example.com

should be recognized as the same normalized email.

University names must support aliases.

Example:

University of Example
Example University
UOE

may be mapped to the same university if verified.

============================================================
              STUDENT ID GENERATION
============================================================

If existing student has a valid ALO Student ID:

KEEP IT.

If missing:

generate:

AE-YYYY000001

Example:

AE-2026000001

Student IDs must be:

unique
immutable
never reused

============================================================
                 DUPLICATE DETECTION
============================================================

Check duplicates using:

1. oldCrmId
2. phone
3. WhatsApp
4. email
5. passport number
6. normalized name
7. date of birth
8. combined identity signals

Use weighted matching.

Example:

Passport exact match:
VERY HIGH

Phone exact match:
HIGH

Email exact match:
HIGH

WhatsApp exact match:
HIGH

Name + DOB:
MEDIUM/HIGH

Name only:
LOW

Never automatically merge based on name alone.

============================================================
                DUPLICATE MATCH RESULTS
============================================================

Show:

MATCHED
POSSIBLE MATCH
DUPLICATE RISK
NO MATCH

Example:

Imported Student:

Rahim Ahmed

Possible existing student:

Rahim Ahamed

Match confidence:

87%

Reasons:

Phone: MATCH
Email: MATCH
Name similarity: 92%

Actions:

[MERGE]
[CREATE NEW]
[REVIEW]
[IGNORE]

============================================================
                  MERGE ENGINE
============================================================

Never automatically overwrite existing data.

When matching an existing student:

Show side-by-side:

EXISTING ALO DATA

VS

OLD CRM DATA

For every field:

Existing value
Imported value
Source
Last updated
Conflict status

Admin can choose:

KEEP EXISTING
USE IMPORTED
MERGE
SKIP

============================================================
                MERGE SAFETY
============================================================

Never overwrite:

Student ID
verified identity
approved application stage
financial records
visa decision
official documents

without explicit authorized approval.

Merge must preserve:

old data
new data
source
timestamp
actor

============================================================
              IMPORT PREVIEW
============================================================

Before import show:

TOTAL ROWS

NEW STUDENTS

MATCHED STUDENTS

POSSIBLE DUPLICATES

DUPLICATE RISKS

MISSING REQUIRED FIELDS

INVALID PHONE NUMBERS

INVALID EMAILS

INVALID DATES

INVALID PASSPORT DATA

UNKNOWN COUNTRIES

UNKNOWN UNIVERSITIES

UNKNOWN COURSES

IMPORT ERRORS

DOCUMENT ERRORS

COMMUNICATION ERRORS

============================================================
                IMPORT APPROVAL
============================================================

No live import until Super Admin approves.

Workflow:

UPLOAD
→ PARSE
→ VALIDATE
→ DEDUPLICATE
→ PREVIEW
→ REVIEW
→ SUPER ADMIN APPROVAL
→ IMPORT
→ VERIFY

============================================================
               IMPORT EXECUTION
============================================================

After approval:

Create or update:

students
student_profiles
applications
documents
communication_timelines
notes
tasks
payments
visa records

where supported by existing schema.

Every related record must use:

studentId

NOT old CRM ID as the primary internal relationship.

Keep:

sourceSystem
sourceRecordId

for traceability.

============================================================
                 OLD CRM ID
============================================================

Never lose the old CRM identifier.

Store:

source_system = old CRM
source_record_id = OLD-12345

This allows:

search
reconciliation
future imports
audit
support

============================================================
                IMPORT DOCUMENTS
============================================================

If old CRM provides documents:

Import them safely.

Every document must have:

studentId
documentType
filePath
sourceSystem
sourceDocumentId
uploadedAt
uploadedBy
status
version
hash

Do not make imported files publicly accessible.

============================================================
             DOCUMENT DUPLICATE CONTROL
============================================================

Before importing document:

check:

file hash
document type
student
source document ID

If duplicate:

do not create unnecessary duplicate.

Show:

DUPLICATE DOCUMENT

============================================================
              COMMUNICATION HISTORY
============================================================

Import where data is available:

Email
WhatsApp
SMS
Call log
Notes
Follow-up
Internal comments
Student-visible comments

Preserve:

timestamp
channel
sender
recipient
message
source
direction

Imported communication must be marked:

IMPORTED_FROM_OLD_CRM

============================================================
                    TASK IMPORT
============================================================

Where old CRM supports tasks:

Import:

task
assigned user
due date
status
priority
created date
completed date

If old counselor does not exist in new CRM:

show:

UNMATCHED STAFF

and allow Super Admin to map to new employee.

============================================================
               COUNSELOR MAPPING
============================================================

Old counselor:

"John Doe"

must be mapped to:

ALO employee

before assignment becomes active.

Options:

MATCHED
UNMATCHED
NEW STAFF MAPPING REQUIRED

Do not assign records to random employees.

============================================================
                  PAYMENT IMPORT
============================================================

Import payment status/history where available.

Do not automatically alter verified financial records.

Show conflicts.

Example:

OLD CRM:
Paid

ALO:
Pending

Require manual review.

============================================================
                    VISA IMPORT
============================================================

Import:

Visa status
Visa application number
Visa submission date
Visa decision
Visa notes
Visa documents

Do not overwrite verified current visa status without approval.

============================================================
              IMPORT ERROR CENTER
============================================================

Create:

/admin/import-center/errors

Show:

Batch
Row
Field
Error
Severity
Suggested Fix
Status

Actions:

Fix
Ignore
Reprocess
Export Errors

============================================================
              IMPORT REPROCESSING
============================================================

After fixing errors:

Re-run only failed rows.

Do not re-import successful records.

============================================================
                  ROLLBACK
============================================================

Every import batch must be reversible where technically safe.

Create:

IMPORT_ROLLBACK

Rollback only records created by that batch.

Never delete pre-existing student data.

Rollback must be:

authorized
audited
confirmed

============================================================
               IMPORT AUDIT
============================================================

Every action:

upload
mapping
validation
merge
approval
import
rollback

must create audit_logs.

============================================================
          REQUIRED STUDENT IMPORT TABLES
============================================================

import_batches

import_staging_students

import_errors

duplicate_matches

import_field_mappings

import_merge_decisions

import_document_mappings

import_audit_logs

students

applications

documents

communication_timelines

tasks

notes

audit_logs

Reuse existing tables where they already exist.

Do not create duplicate models unnecessarily.

============================================================
          PART 2 — UNIVERSITY DATA CENTER
============================================================

Create:

SUPER ADMIN
→ UNIVERSITY DATA CENTER

Route:

/admin/university-data

Purpose:

Central database for every university used by:

Course Finder
Country Pages
University Pages
CRM
Application System
Student Recommendations
AI Agents
Marketing
Counselor Tools

============================================================
            UNIVERSITY MASTER DATABASE
============================================================

Required collection/table:

universities

Fields:

id
universityName
normalizedName
countryId
country
city
campus
officialWebsite
internationalStudentPageUrl
applicationUrl
scholarshipUrl
logo
ranking
rankingSource
admissionEmail
contactPhone
admissionNotes
sourceUrl
sourceType
lastCheckedAt
lastApprovedAt
status
verificationStatus
createdAt
updatedAt

============================================================
              UNIVERSITY STATUS
============================================================

DRAFT
ACTIVE
UNDER_REVIEW
NEEDS_UPDATE
SUSPENDED
ARCHIVED

Verification:

UNVERIFIED
SOURCE_VERIFIED
HUMAN_APPROVED

============================================================
              UNIVERSITY SOURCES
============================================================

Preferred source:

Official university website.

Other sources may be stored only as supplementary sources.

Every important data point should have provenance where practical.

Store:

sourceUrl
sourceTitle
sourceType
checkedAt
retrievedAt
evidence
contentHash where applicable

============================================================
              UNIVERSITY DUPLICATE ENGINE
============================================================

Normalize university names.

Match by:

normalized university name
country
official website
official source URL

Example:

University of Example

Example University

must be detected as potentially identical.

Do not create duplicate.

Show:

MERGE SUGGESTION

============================================================
                PART 3 — COURSE DATABASE
============================================================

Create:

courses

Fields:

id
courseName
normalizedName
universityId
countryId
level
subject
discipline
duration
durationUnit
tuitionFee
tuitionFeeMin
tuitionFeeMax
currency
intakes
entryRequirement
englishRequirement
scholarshipInfo
applicationDeadline
applicationFee
depositNotes
casNotes
coeNotes
i20Notes
internationalStudentEligibility
studyMode
campus
courseStatus
sourceUrl
lastCheckedAt
lastApprovedAt
verificationStatus
createdAt
updatedAt

============================================================
                  COURSE LEVEL
============================================================

Examples:

Foundation
Pathway
Undergraduate
Bachelor
Postgraduate
Master
MBA
MSc
MA
MPhil
PhD
Doctorate
Diploma
Certificate

System must remain extensible.

============================================================
             COURSE DUPLICATE DETECTION
============================================================

Match using:

normalized university
normalized course name
country
level
official source URL

Also consider:

campus
subject

Do not create duplicate when same course already exists.

============================================================
                COURSE VERSIONING
============================================================

Do not overwrite historical course data.

Maintain versions for:

course name
fee
intake
deadline
entry requirement
English requirement
scholarship
status
international eligibility

Store:

old value
new value
source
effective date
approved date
approved by

============================================================
                 PART 4 — COUNTRY DATABASE
============================================================

Create:

countries

Fields:

id
countryName
normalizedName
countryCode
flag
description
studyOverview
livingCostRange
visaOverview
workRights
popularSubjects
status
sourceUrl
lastCheckedAt
lastApprovedAt
createdAt
updatedAt

============================================================
             COUNTRY PAGE CONTENT
============================================================

Every country page must provide rich information.

Required:

Why study in this country

Top universities

Popular courses

Entry requirements

English requirements

Tuition fee range

Living cost range

Scholarships

Intakes

Work rights where applicable

Visa process overview

Required documents

Application timeline

FAQ

Course Finder CTA

Book Free Consultation CTA

Student Login CTA

WhatsApp AI Agent CTA

============================================================
             COUNTRY DATA RULE
============================================================

Do not fabricate:

visa rules
work rights
tuition fees
living costs
scholarships

If data is uncertain:

mark:

NEEDS MANUAL REVIEW

============================================================
              PART 5 — SUPPORTING DATA
============================================================

Create or reuse:

intakes

scholarships

entry_requirements

english_requirements

tuition_fees

application_deadlines

visa_notes

source_logs

duplicate_checks

update_requests

approval_logs

============================================================
                   INTAKES
============================================================

Store:

universityId
courseId
intakeName
startDate
applicationDeadline
internationalDeadline
status
sourceUrl
lastCheckedAt
lastApprovedAt

============================================================
                SCHOLARSHIPS
============================================================

Store:

universityId
courseId
name
amount
percentage
eligibility
deadline
internationalEligibility
sourceUrl
status
lastCheckedAt
lastApprovedAt

============================================================
             ENTRY REQUIREMENTS
============================================================

Store:

courseId
academicRequirement
subjectRequirement
gradeRequirement
experienceRequirement
otherRequirements
sourceUrl
lastCheckedAt
lastApprovedAt

============================================================
             ENGLISH REQUIREMENTS
============================================================

Store:

courseId
testType
overallScore
minimumComponentScores
acceptedTests
exceptions
sourceUrl
lastCheckedAt
lastApprovedAt

Examples:

IELTS
TOEFL
PTE
Duolingo
Other accepted tests

Do not assume every university accepts every test.

============================================================
                 TUITION FEES
============================================================

Store:

courseId
amount
minimum
maximum
currency
period
feeType
internationalFee
effectiveFrom
effectiveTo
sourceUrl
lastCheckedAt
lastApprovedAt

============================================================
          APPLICATION DEADLINES
============================================================

Store:

courseId
intakeId
deadline
internationalDeadline
applicationFee
currency
sourceUrl
lastCheckedAt
lastApprovedAt

============================================================
                  VISA NOTES
============================================================

Store only verified/general guidance.

Fields:

countryId
visaType
summary
requirements
officialSourceUrl
lastCheckedAt
lastApprovedAt
verificationStatus

Do not present AI-generated visa guidance as official legal advice.

============================================================
            PART 6 — SOURCE LOGGING
============================================================

Every external university/course check must create:

source_logs

Fields:

id
entityType
entityId
sourceUrl
sourceType
checkedAt
retrievedAt
status
evidenceSummary
contentHash
agentRunId
createdAt

============================================================
               SOURCE PRIORITY
============================================================

Priority:

1. Official University Website
2. Official University Course Page
3. Official University International Student Page
4. Official Government/Immigration Website
5. Other trusted official sources

Third-party sources should not override official sources.

============================================================
        PART 7 — WEEKLY AI UPDATE AGENT
============================================================

Create:

ALO UNIVERSITY COURSE UPDATE AGENT

Purpose:

Every week research official university and course information
and identify changes.

============================================================
                 SCHEDULE
============================================================

Run:

ONCE EVERY WEEK

Configurable schedule:

day
time
timezone

Example:

Sunday
02:00 Bangladesh Time

Do not hard-code if scheduler already exists.

Use existing:

cron
queue
scheduler
worker
automation system

where appropriate.

============================================================
                 AGENT WORKFLOW
============================================================

STEP 1:

Load universities requiring checking.

STEP 2:

Load their official source URLs.

STEP 3:

Visit permitted official sources.

STEP 4:

Extract relevant structured information.

STEP 5:

Normalize information.

STEP 6:

Compare against current database.

STEP 7:

Detect changes.

STEP 8:

Save evidence.

STEP 9:

Create update_requests.

STEP 10:

Notify Super Admin.

STEP 11:

Wait for human approval.

STEP 12:

Publish only approved changes.

============================================================
                AI MUST CHECK
============================================================

University name

Course name

Course status

Course availability

Tuition fees

Currency

Intakes

Application deadlines

Entry requirements

English requirements

Scholarships

Application fee

Deposit

CAS notes

COE notes

I-20 notes

International student eligibility

Campus

Duration

Study mode

International student information

Official admission information

Country-specific official guidance where relevant

============================================================
              IMPORTANT VISA RULE
============================================================

University update agent must NOT invent visa requirements.

Visa information must preferably be sourced from:

official government
official immigration authority
official university international guidance

If uncertain:

CREATE UPDATE REQUEST:

NEEDS MANUAL REVIEW

============================================================
                CHANGE DETECTION
============================================================

Example:

CURRENT TUITION:

£18,000

NEW SOURCE:

£19,500

Create:

UPDATE REQUEST

Old:

£18,000

New:

£19,500

Source:

official URL

Detected:

2026-08-09

Confidence:

HIGH

============================================================
             UPDATE REQUEST SYSTEM
============================================================

Create:

update_requests

Fields:

id
entityType
entityId
fieldName
oldValue
newValue
sourceUrl
evidence
confidence
detectedAt
agentRunId
status
reviewedBy
reviewedAt
reviewNote
publishedAt
createdAt
updatedAt

============================================================
                 UPDATE STATUSES
============================================================

DETECTED
PENDING_REVIEW
NEEDS_RESEARCH
APPROVED
REJECTED
EDITED
MERGED
PUBLISHED
ROLLED_BACK

============================================================
           SUPER ADMIN UPDATE CENTER
============================================================

Route:

/admin/university-data/updates

Dashboard:

Weekly AI Scan

Last Run

Next Run

Universities Checked

Courses Checked

Sources Checked

Changes Found

High Confidence

Medium Confidence

Low Confidence

Pending Approval

Approved

Rejected

Needs Manual Review

============================================================
               UPDATE REVIEW UI
============================================================

For every change show:

ENTITY

UNIVERSITY

COURSE

FIELD

CURRENT VALUE

NEW VALUE

SOURCE

SOURCE URL

EVIDENCE

DETECTED DATE

AI CONFIDENCE

LAST APPROVED VALUE

============================================================
                  ADMIN ACTIONS
============================================================

[APPROVE]

[REJECT]

[EDIT]

[MERGE]

[REQUEST MORE RESEARCH]

[OPEN SOURCE]

[VIEW HISTORY]

[ROLLBACK]

============================================================
              NO AUTO-PUBLISH RULE
============================================================

The AI agent MUST NOT automatically publish important changes.

AI:

RESEARCHES

DETECTS

COMPARES

PREPARES

RECOMMENDS

AI DOES NOT FINALIZE.

Super Admin must approve.

============================================================
                 PART 8 — PUBLISH ENGINE
============================================================

After Super Admin approval:

Update:

University Database

Course Database

Country Page Data

University Page Data

Course Finder

CRM Course Catalog

Student Recommendation Engine

AI Knowledge Base where configured

Cache

Search Index

============================================================
                  PUBLISH ATOMICITY
============================================================

Publishing should avoid partial inconsistent states.

Preferred workflow:

prepare changes

validate

publish transaction

invalidate cache

refresh search/index

record audit

If any critical operation fails:

rollback or mark publication incomplete.

============================================================
                 PUBLIC WEBSITE SYNC
============================================================

Public pages must read approved database data.

Do not maintain separate conflicting hard-coded university/course
information if database-driven data is available.

Country page:

database-driven

University page:

database-driven

Course Finder:

database-driven

CRM:

database-driven

============================================================
                  COURSE FINDER
============================================================

Course Finder must use database data.

Filters should support, where applicable:

Country
University
Course
Subject
Level
Tuition Fee
Currency
Intake
Scholarship
English Requirement
Duration
Campus
Study Mode
International Eligibility

Results must show only:

ACTIVE
APPROVED
VERIFIED

data according to configured publication rules.

============================================================
                COURSE FINDER DETAILS
============================================================

Each course result may show:

University

Course

Country

Campus

Level

Duration

Tuition

Intake

Deadline

English Requirement

Scholarship

Application Fee

International Student Eligibility

[VIEW UNIVERSITY]

[VIEW COURSE]

[APPLY]

[BOOK CONSULTATION]

[WHATSAPP AI AGENT]

============================================================
             CRM COURSE CATALOG
============================================================

CRM users must use the same approved course database.

Counselors can:

search
filter
compare
recommend
save
assign to student
create application

Do not create a separate manual course database inside CRM.

============================================================
            STUDENT RECOMMENDATION ENGINE
============================================================

AI recommendations should use approved course data.

Possible inputs:

Student academic profile

English score

Budget

Country preference

Course preference

Academic level

Intake

Scholarship requirement

Career interest

International eligibility

AI must never invent:

tuition
deadline
eligibility
scholarship

All recommendations must be traceable to database records.

============================================================
               AI KNOWLEDGE BASE SYNC
============================================================

After approved changes:

Update AI knowledge/index.

Store:

entity
version
approvedAt
source
content
status

AI responses should preferably cite/use the latest approved data.

============================================================
             PART 9 — DATA QUALITY ENGINE
============================================================

Create centralized data quality checks.

Check:

missing university website

missing official source

duplicate university

duplicate course

invalid country

invalid tuition currency

expired deadline

missing intake

missing English requirement where required

missing international eligibility

stale data

conflicting source

unverified data

============================================================
                  DATA FRESHNESS
============================================================

Each university/course must have:

lastCheckedAt

lastApprovedAt

nextCheckAt

If data becomes stale:

status:

NEEDS_UPDATE

Do not silently display stale information as freshly verified.

============================================================
                STALE DATA RULE
============================================================

Configurable threshold.

Example:

90 days

If:

lastCheckedAt > threshold

mark:

STALE

and queue for recheck.

Important high-risk data may use shorter intervals.

============================================================
              CONFLICTING SOURCES
============================================================

If sources disagree:

DO NOT automatically choose.

Create:

CONFLICT_REVIEW

Show:

Source A
Source B
Current Database
Dates
Evidence

Require human review.

============================================================
               PART 10 — DUPLICATE CENTER
============================================================

Route:

/admin/university-data/duplicates

Show:

Potential Duplicate Universities

Potential Duplicate Courses

Potential Duplicate Countries

Actions:

Merge
Ignore
Mark Separate
Review

============================================================
                 MERGE UNIVERSITY
============================================================

When merging:

Select MASTER RECORD

Select DUPLICATE RECORD

Move valid:

courses
campuses
sources
scholarships
requirements
history

to master.

Preserve:

old ID
merge history
audit

Never destroy historical provenance.

============================================================
                  MERGE COURSE
============================================================

Same process.

Preserve:

old course ID

mergedIntoCourseId

history

source records

applications referencing old course must be safely remapped.

============================================================
               PART 11 — APPROVAL ENGINE
============================================================

All sensitive data publication uses:

DRAFT
→ REVIEW
→ APPROVAL
→ PUBLISH

Approval must record:

approver
timestamp
IP/session if configured
old value
approved value
source
reason

============================================================
                 APPROVAL LOGS
============================================================

approval_logs:

id
entityType
entityId
action
requestedBy
reviewedBy
status
oldValue
newValue
sourceUrl
reviewNote
createdAt
updatedAt

============================================================
                  PART 12 — VERSION HISTORY
============================================================

Every major university/course change must be versioned.

Example:

Course V1:

£17,000

Course V2:

£18,000

Course V3:

£19,500

Admin can:

view history
compare versions
rollback

============================================================
                    ROLLBACK
============================================================

Super Admin can rollback an approved change if:

incorrect
outdated
wrong source
data error
university changed again

Rollback must create another audit record.

Never erase history.

============================================================
             PART 13 — AI AGENT SAFETY
============================================================

AI must:

Use official sources first.

Respect robots.txt.

Respect website terms.

Respect rate limits.

Use reasonable request frequency.

Do not bypass CAPTCHA.

Do not bypass authentication.

Do not bypass access controls.

Do not scrape prohibited/private areas.

Do not overload university servers.

Do not copy entire pages unnecessarily.

Extract only required information.

Summarize and normalize.

Store source URLs.

============================================================
                 COPYRIGHT RULE
============================================================

Do not copy university website content word-for-word into
ALO public pages unnecessarily.

Use:

facts
structured information
summaries
original ALO-written descriptions

Store source URLs.

============================================================
              AI CONFIDENCE LEVEL
============================================================

Every AI update should have:

HIGH
MEDIUM
LOW

HIGH:

clear official source
clear change
strong structured match

MEDIUM:

official source but ambiguous change

LOW:

uncertain extraction
conflicting information
weak evidence

LOW confidence:

NEEDS MANUAL REVIEW

============================================================
             PART 14 — SOURCE EVIDENCE
============================================================

For every detected change store:

Source URL

Page title

Relevant extracted evidence

Detected value

Previous value

Detection date

Agent run ID

Confidence

Do not store unsupported AI claims.

============================================================
              PART 15 — MANUAL DATA ENTRY
============================================================

Super Admin can manually create/edit:

Country
University
Campus
Course
Intake
Scholarship
Requirement
English requirement
Tuition
Deadline
Visa note

Manual changes must also require:

source
reason
approval where configured

============================================================
             PART 16 — BULK UNIVERSITY IMPORT
============================================================

University/Course Data Center should support:

CSV
XLSX

staging

mapping

validation

duplicate detection

preview

approval

import

audit

rollback

Use the same import architecture as Student Migration.

============================================================
              PART 17 — UNIVERSITY IMPORT FIELDS
============================================================

University import:

universityName
country
city
campus
officialWebsite
internationalStudentPageUrl
applicationUrl
scholarshipUrl
logo
ranking
admissionEmail
sourceUrl
admissionNotes

Course import:

courseName
university
country
level
subject
duration
tuitionFee
currency
intakes
entryRequirement
englishRequirement
scholarshipInfo
applicationDeadline
applicationFee
depositNotes
casNotes
coeNotes
i20Notes
internationalStudentEligibility
sourceUrl

============================================================
             PART 18 — ADMIN SEARCH
============================================================

Super Admin must be able to search:

Student

Student ID

Old CRM ID

Phone

WhatsApp

Email

Passport

University

Course

Country

Application

Import Batch

Update Request

Source

============================================================
                 PART 19 — AUDIT SYSTEM
============================================================

Audit:

Student Import
Student Merge
Student Update
Document Import
Communication Import
University Create
University Update
Course Create
Course Update
Duplicate Merge
AI Scan
Source Check
Update Request
Approval
Rejection
Edit
Publish
Rollback
Manual Update
Bulk Import

============================================================
             PART 20 — API SECURITY
============================================================

All APIs must validate:

Authentication

Authorization

Role

Permission

Scope

Record ownership

Approval authority

Data validation

Do not trust frontend.

Example:

POST /api/admin/university-data/publish

must independently verify:

user authenticated

user has publish permission

user is authorized Super Admin/Admin

update request exists

request is approved

source exists

data passes validation

============================================================
             PART 21 — DATABASE RELATIONSHIPS
============================================================

Relationship example:

Country
  ↓
University
  ↓
Campus
  ↓
Course
  ↓
Intake
  ↓
Requirements
  ↓
English Requirements
  ↓
Scholarships
  ↓
Tuition
  ↓
Deadlines

Student
  ↓
Application
  ↓
University
  ↓
Course
  ↓
Documents
  ↓
Offer
  ↓
Payment
  ↓
Visa

All relationships must use foreign keys or equivalent integrity
controls supported by the existing database.

============================================================
             PART 22 — INDEXES
============================================================

Add appropriate indexes for:

studentId

oldCrmId

phone

whatsapp

email

passportNumber

normalizedStudentName

normalizedUniversityName

countryId

universityId

normalizedCourseName

sourceUrl

lastCheckedAt

status

verificationStatus

applicationStatus

importBatchId

updateRequestStatus

Do not create excessive duplicate indexes.

============================================================
             PART 23 — SEARCH NORMALIZATION
============================================================

Use normalized values for:

Student names

Phone

WhatsApp

Email

Passport

University names

Course names

Country names

URLs

Search must support:

case-insensitive

spacing normalization

punctuation normalization

common abbreviations

safe aliases

============================================================
             PART 24 — NOTIFICATIONS
============================================================

Notify Super Admin when:

Import ready

Import errors

Duplicate risk

Merge required

University update detected

Course fee changed

Intake changed

Deadline changed

Scholarship changed

Entry requirement changed

English requirement changed

Course closed

Source unavailable

Conflicting sources

Data stale

Weekly scan failed

Publishing failed

Rollback performed

============================================================
               PART 25 — WEEKLY AGENT MONITORING
============================================================

Dashboard must show:

Last successful run

Last failed run

Next scheduled run

Universities checked

Courses checked

Sources checked

Pages unavailable

Changes detected

Updates pending

Updates approved

Updates rejected

Conflicts

Stale records

============================================================
                PART 26 — FAILURE HANDLING
============================================================

If university website is unavailable:

DO NOT mark data changed.

Record:

SOURCE_UNAVAILABLE

Retry later.

If page structure changes:

record:

EXTRACTION_REVIEW_REQUIRED

If AI cannot confidently identify a course:

do not update.

Create:

NEEDS_MANUAL_REVIEW

============================================================
              PART 27 — RATE LIMITING
============================================================

Weekly agent must use:

reasonable request spacing

rate limits

retry backoff

caching

conditional checks where appropriate

Do not repeatedly request unchanged pages unnecessarily.

============================================================
             PART 28 — COURSE STATUS
============================================================

Course status:

ACTIVE

NEW

UPDATED

SUSPENDED

CLOSED

DISCONTINUED

UNDER_REVIEW

UNVERIFIED

ARCHIVED

Only approved active courses should normally appear in
public Course Finder.

============================================================
            PART 29 — UNIVERSITY STATUS
============================================================

University:

ACTIVE

UNDER_REVIEW

NEEDS_UPDATE

SUSPENDED

ARCHIVED

UNVERIFIED

============================================================
          PART 30 — PUBLIC DATA SAFETY
============================================================

Public website must never show:

unapproved fee

unapproved deadline

unverified scholarship

unverified visa information

AI draft

pending update

internal note

source extraction artifacts

Super Admin comments

internal audit information

============================================================
           PART 31 — CRM DATA CONSISTENCY
============================================================

The CRM and public website must reference the same approved
university/course records.

Do NOT maintain:

CRM Course A

Website Course B

AI Course C

for the same real course.

Use:

ONE MASTER RECORD.

============================================================
             PART 32 — COURSE SNAPSHOT
============================================================

When a student application is created, preserve the relevant
course information snapshot where needed.

Example:

At application time:

Tuition:
£18,000

Later:

Tuition:
£19,500

Existing application must retain the historically relevant
application snapshot.

Do not silently rewrite old application records.

============================================================
             PART 33 — OFFER LETTER RELATION
============================================================

Offer letters must link to:

studentId

applicationId

universityId

courseId

offerVersion

receivedAt

source

conditions

status

This allows the CRM to know exactly:

which university
which course
which application
which offer
which student

============================================================
               PART 34 — AI ANSWER ENGINE
============================================================

AI Agent answering:

"What is the tuition fee?"

must use approved database information.

AI answer should include:

University
Course
Current approved tuition
Currency
Last checked
Last approved
Source

where appropriate.

If information is stale:

tell user:

"Information requires confirmation."

============================================================
              PART 35 — DATA FRESHNESS DISPLAY
============================================================

Admin:

Last Checked

Last Approved

Next Check

Public pages may optionally show:

"Information last verified: [date]"

Do not expose internal technical details unnecessarily.

============================================================
             PART 36 — COURSE FINDER MAPPING
============================================================

Course Finder must map:

Country

University

Course

Level

Subject

Tuition

Intake

Scholarship

English requirement

Eligibility

Application deadline

The system must generate valid relationships.

============================================================
             PART 37 — COUNTRY PAGE DYNAMIC DATA
============================================================

Country page should dynamically calculate:

Top Universities

Popular Courses

Tuition Range

Scholarship Availability

Popular Intakes

English Requirements

Study Cost

where data exists.

Do not hard-code values that should come from database.

============================================================
            PART 38 — UNIVERSITY PAGE DYNAMIC DATA
============================================================

University page:

Overview

Location

Campus

Ranking/trust information

International Student Information

Popular Courses

Course Search

Entry Requirements

English Requirements

Tuition

Scholarships

Intakes

Application Deadline

Application Steps

Documents

Apply CTA

Course Finder CTA

Consultation CTA

WhatsApp AI Agent CTA

============================================================
             PART 39 — DATA APPROVAL CACHE
============================================================

When Super Admin approves:

invalidate relevant caches.

Refresh:

University page

Course page

Country page

Course Finder

CRM catalog

AI index

Search index

Do not require manual server restart for every approved update.

============================================================
              PART 40 — EXPORT CENTER
============================================================

Super Admin can export:

Student import results

Import errors

Duplicate matches

University data

Course data

Pending updates

Approved updates

Audit reports

Use authorized export permission.

============================================================
                PART 41 — BACKUP
============================================================

Before large migration/import:

Create backup/checkpoint.

Before large university/course update:

Create database checkpoint or transactional protection where
supported.

Never perform destructive migration without rollback strategy.

============================================================
              PART 42 — LIVE TEST REQUIREMENT
============================================================

Do not report:

"IMPLEMENTED"

merely because files were generated.

Must actually test.

============================================================
             STUDENT MIGRATION TESTS
============================================================

Test:

1. CSV upload

2. XLSX upload

3. Column mapping

4. Data validation

5. Phone normalization

6. Email normalization

7. Passport normalization

8. Duplicate detection

9. Existing student matching

10. New student creation

11. Student ID generation

12. Merge preview

13. Merge approval

14. Document import

15. Communication history import

16. Notes import

17. Application import

18. Payment status import

19. Visa status import

20. Counselor mapping

21. Import error handling

22. Failed-row reprocessing

23. Audit logging

24. Rollback

============================================================
          UNIVERSITY/COURSE TESTS
============================================================

Test:

1. University creation

2. Course creation

3. University import

4. Course import

5. Duplicate university detection

6. Duplicate course detection

7. Merge suggestion

8. Country relationship

9. University/course relationship

10. Intake relationship

11. Scholarship relationship

12. Entry requirement relationship

13. English requirement relationship

14. Tuition relationship

15. Deadline relationship

16. Source logging

17. Version history

18. Approval

19. Publish

20. Rollback

============================================================
              WEEKLY AI TESTS
============================================================

Test using controlled/test data:

1. Scheduled run executes.

2. Official source is checked.

3. Current database is loaded.

4. New source information is extracted.

5. Old vs new comparison works.

6. Change detected.

7. Source URL stored.

8. Evidence stored.

9. Update request created.

10. Super Admin notification created.

11. AI does not auto-publish.

12. Approve works.

13. Reject works.

14. Edit works.

15. Publish works.

16. Audit log created.

17. Rollback works.

18. Source unavailable handled.

19. Conflicting source handled.

20. Low confidence requires review.

============================================================
              COURSE FINDER TESTS
============================================================

Test:

Country filter

University filter

Course filter

Level filter

Subject filter

Tuition filter

Intake filter

Scholarship filter

English requirement filter

Search

Course details

University details

Apply CTA

Consultation CTA

WhatsApp CTA

Ensure results come from database.

============================================================
              PUBLIC PAGE TESTS
============================================================

Test:

Country pages

University pages

Course pages

Search engine/indexing where applicable

Mobile

Tablet

Desktop

No broken links

No missing data

No unapproved data displayed

============================================================
              SECURITY TESTS
============================================================

Attempt:

unauthorized import

unauthorized merge

unauthorized publish

unauthorized rollback

unauthorized export

unauthorized university edit

unauthorized course edit

unauthorized student merge

direct API access

manipulated IDs

frontend permission bypass

All must be rejected.

============================================================
             PERFORMANCE TESTS
============================================================

Large import:

10,000+ student rows where environment permits.

Test:

memory

processing time

database load

duplicate detection

batch processing

failure recovery

Do not load unnecessarily huge datasets into browser memory.

Use:

pagination

streaming

chunk processing

background jobs

where appropriate.

============================================================
              PART 43 — EXISTING SYSTEM SAFETY
============================================================

Before changes:

BACKUP

Inspect existing schema.

Inspect existing routes.

Inspect existing API.

Inspect existing Course Finder.

Inspect existing public pages.

Inspect existing CRM.

Inspect existing Student Dashboard.

Identify dependencies.

Then implement.

Do not blindly replace files.

Do not remove existing components.

Do not rebuild the entire project.

============================================================
               PART 44 — NO DUPLICATE SYSTEM
============================================================

If existing system already has:

users

students

universities

courses

documents

applications

communications

audit_logs

do not create competing duplicate tables unless absolutely
necessary.

Extend existing models.

Reuse existing APIs where safe.

============================================================
               PART 45 — DATABASE MIGRATION
============================================================

Generate proper migration.

Never use destructive migration in production without explicit
approval.

Before migration:

backup

validate

apply migration

verify schema

test relations

============================================================
                 PART 46 — API
============================================================

Create secure APIs for:

POST /api/admin/import/student-batch

GET /api/admin/import/batches

GET /api/admin/import/batches/:id

GET /api/admin/import/batches/:id/preview

POST /api/admin/import/batches/:id/approve

POST /api/admin/import/batches/:id/execute

POST /api/admin/import/batches/:id/rollback

GET /api/admin/import/duplicates

POST /api/admin/import/merge

GET /api/universities

GET /api/universities/:id

GET /api/courses

GET /api/courses/:id

POST /api/admin/universities

POST /api/admin/courses

GET /api/admin/university-data/updates

POST /api/admin/university-data/updates/:id/approve

POST /api/admin/university-data/updates/:id/reject

POST /api/admin/university-data/updates/:id/edit

POST /api/admin/university-data/updates/:id/publish

POST /api/admin/university-data/updates/:id/rollback

GET /api/admin/university-data/duplicates

POST /api/admin/university-data/duplicates/merge

GET /api/admin/university-data/source-logs

============================================================
              PART 47 — BACKGROUND JOBS
============================================================

Create background jobs for:

Student Import

Document Import

Duplicate Processing

University Weekly Scan

Course Weekly Scan

Data Validation

Search Index Refresh

AI Knowledge Sync

Notification

Cache Refresh

Do not make a large migration dependent on browser remaining open.

============================================================
              PART 48 — IDEMPOTENCY
============================================================

Import jobs must be idempotent.

If the same batch is accidentally submitted twice:

do not create duplicate students.

Use:

batch ID

source record ID

idempotency key

source hash

where appropriate.

============================================================
             PART 49 — SEARCH INDEX
============================================================

If existing project uses:

ElasticSearch
Meilisearch
Typesense
database search
other search engine

integrate with it.

Do not create a second unnecessary search engine.

============================================================
             PART 50 — AI AGENT KNOWLEDGE SAFETY
============================================================

AI knowledge should contain only:

approved data

approved summaries

approved source references

No:

pending update

rejected update

internal notes

unverified draft

============================================================
             PART 51 — ADMIN DATA CENTER
============================================================

Create one unified:

DATA MANAGEMENT CENTER

Sections:

Student Migration

Import Batches

Duplicate Center

University Database

Course Database

Country Database

Intakes

Scholarships

Requirements

English Requirements

Tuition

Deadlines

Visa Notes

AI Update Center

Source Logs

Approval Center

Version History

Rollback Center

Audit Logs

============================================================
              PART 52 — DASHBOARD WIDGETS
============================================================

Super Admin:

Students Imported

Pending Imports

Duplicate Risks

Import Errors

Universities

Courses

Stale Data

Weekly Scan

Pending Updates

Approved Updates

Conflicts

Source Failures

============================================================
              PART 53 — DATA GOVERNANCE
============================================================

Every important record must have:

createdBy

createdAt

updatedBy

updatedAt

source

sourceUrl

verificationStatus

lastCheckedAt

lastApprovedAt

version

status

============================================================
             PART 54 — MANUAL OVERRIDE
============================================================

Super Admin can override AI suggestion.

But must enter:

reason

source

optional note

Audit must record:

AI suggestion

Human decision

Final value

============================================================
              PART 55 — HUMAN IN THE LOOP
============================================================

AI is an assistant.

AI does not become the final authority for:

university data publication

course data publication

visa information

financial information

student identity merge

student record merge

application history overwrite

important eligibility claims

Human approval is required where configured.

============================================================
                PART 56 — FINAL QUALITY RULE
============================================================

The system must prefer:

CORRECTNESS
over
SPEED

VERIFIED DATA
over
AI GUESS

EXISTING RECORD
over
DUPLICATE RECORD

HUMAN APPROVAL
over
AUTOMATIC PUBLICATION

SOURCE EVIDENCE
over
UNSUPPORTED CLAIM

HISTORY
over
DESTRUCTIVE OVERWRITE

============================================================
                 PART 57 — FINAL DELIVERY
============================================================

At completion produce:

A. Implementation Summary

B. Existing Files Inspected

C. Files Created

D. Files Modified

E. Database Tables Added

F. Database Tables Reused

G. Migrations

H. APIs

I. Background Jobs

J. AI Agent

K. Import Engine

L. Duplicate Engine

M. Merge Engine

N. Approval Engine

O. Source Engine

P. Course Finder Integration

Q. Country Page Integration

R. University Page Integration

S. CRM Integration

T. AI Knowledge Integration

U. Security Controls

V. Audit Controls

W. Tests Executed

X. Tests Passed

Y. Tests Failed

Z. Remaining Issues

============================================================
                  ABSOLUTE FINAL RULE
============================================================

DO NOT SAY:

"COMPLETE"

"IMPLEMENTED"

"PRODUCTION READY"

until the system has actually been:

IMPLEMENTED
+
DATABASE MIGRATED
+
INTEGRATED
+
TESTED
+
SECURITY TESTED
+
LIVE VERIFIED

If something is not actually working:

REPORT IT AS:

NOT COMPLETE

Do not hide failures.

Do not provide a false completion report.

============================================================
                      END
============================================================



============================================================ ALO_EMPLOYEE_ACCESS_SYSTEM
PROJECT: ALO EDUCATION ENTERPRISE EMPLOYEE ACCESS, HR, RBAC, PERMISSION, APPROVAL, SECURITY, AUDIT AND WORKFORCE SYSTEM IMPORTANT: This is a PRODUCTION implementation requirement. DO NOT create a demo. DO NOT create mock-only functionality. DO NOT create frontend-only permission checks. DO NOT replace existing functionality. DO NOT redesign unrelated existing CRM pages. DO NOT break the existing CRM. DO NOT modify the Student Dashboard unless explicitly required for integration. Integrate this system into the EXISTING ALO EDUCATION CRM.
                PRIMARY OBJECTIVE
============================================================ Build a complete enterprise-grade Employee Access Control and HR Management System for ALO Education. The system must control:
* Employee accounts
* Employee activation
* Employee profiles
* Employee private information
* Employee roles
* Employee designations
* Departments
* Offices
* Branches
* Reporting managers
* Permissions
* Feature access
* Record-level access
* Field-level access
* Workflow access
* Approval authority
* Employee document management
* HR agreements
* Attendance
* Leave
* Payroll
* Salary
* Devices
* Login security
* Employee communication
* Social media access
* WhatsApp access
* Email access
* Phone/call access
* AI feature access
* Application access
* Student access
* Document access
* Finance access
* Visa access
* Marketing access
* Partner/B2B access
* Quotas
* Audit logs
* Security events
* Temporary permissions
* Permission requests
* Employee suspension
* Employee deactivation
* Employee exit
* Employee replacement/reassignment The system must use: RBAC
* 
ABAC / Scope Control + Object-Level Authorization + Field-Level Authorization + Workflow Authorization + Separation of Duties + Approval Matrix + Audit Trail + Quota Control + Human Approval for High-Risk Actions
            ABSOLUTE SECURITY RULE
============================================================ DO NOT trust the frontend. Hiding a button is NOT authorization. Every sensitive operation MUST be checked by the backend. Every controller/API/service must validate:
1. authenticated user
2. employee status
3. role
4. designation
5. permission
6. department
7. branch
8. assignment
9. record ownership/scope
10. workflow state
11. approval authority
12. temporary access
13. quota
14. feature availability A request must be rejected server-side even if the frontend button is manually invoked. ============================================================ STUDENT DASHBOARD RESTRICTION ============================================================ DO NOT ADD EMPLOYEE HR MANAGEMENT functionality to: STUDENT DASHBOARD The Student Dashboard must remain unchanged. Students may interact with employee-facing features only where existing student workflows explicitly require communication, documents, applications, payments, interview preparation, notifications, etc. Students must NEVER gain access to:
* Employee HR data
* Employee salary
* Employee attendance
* Employee leave
* Employee personal documents
* Employee private profile
* Employee permission system
* Employee audit records
* Employee internal notes
* Employee device records ============================================================ INTERNAL DASHBOARDS ============================================================ Employee Access / HR functionality may be integrated into: Super Admin Admin HR Finance Accounts Marketing Admission Visa Application Compliance Sales Business Development Branch Manager Team Leader Manager Employee Counselor Support Reception IT Operations Partner Management Agent Management University Management Document Officer Interview Team Training QA Call Center and other authorized internal dashboards. Each dashboard must display only the features permitted for that logged-in user. ============================================================ EMPLOYEE DESIGNATIONS ============================================================ Initial supported designations: Chairman CEO Director Office Manager Country Manager Counselor Senior Counselor Application Manager Application Team Visa Officer Finance Officer Marketing Manager Marketing Officer Front Desk HR Manager Support Staff Viewer The architecture MUST support adding future designations. Designation is NOT the same thing as permission. Every designation can have custom permissions. Example: Two Counselors can have different permissions. ============================================================ EMPLOYEE ACCOUNT CREATION ============================================================ Only authorized ALO administrators can create employee accounts. Primary authority: ALO Super Admin Optional delegated authority: HR Manager Admin Chairman ONLY if explicitly granted through permission. Employee account creation form: Full Name Company Email Personal Email Phone Designation Department Office Branch Role Reporting Manager Employment Type Joining Date Permission Package Status Optional: Employee ID Photo Work Schedule Shift Country Timezone After account creation: ACCOUNT_CREATED ↓ ACTIVATION_EMAIL_SENT ↓ EMPLOYEE_ACTIVATES ↓ PASSWORD_CREATED ↓ PROFILE_COMPLETION ↓ DOCUMENT_UPLOAD ↓ PROFILE_SUBMITTED ↓ HR/ADMIN_REVIEW ↓ APPROVED ↓ ACTIVE ============================================================ ACCOUNT STATUS ============================================================ Support: INVITED PENDING_ACTIVATION PENDING_PROFILE PROFILE_SUBMITTED UNDER_REVIEW CORRECTION_REQUIRED APPROVED ACTIVE SUSPENDED INACTIVE TERMINATED REJECTED Never permanently delete employee history. ============================================================ ACTIVATION EMAIL ============================================================ Subject: Activate your ALO Education employee account Email must contain: Employee Name Designation Company Email Activation Link Password Creation Instructions Activation Expiry Support Contact Employee cannot login until password is successfully created. Activation token:
* cryptographically secure
* hashed in database
* one-time use
* configurable expiry
* status tracked
* used_at recorded Expired token: [RESEND ACTIVATION] Only authorized users may resend. ============================================================ EMPLOYEE PERSONAL PROFILE ============================================================ Create a private Employee Profile. Default visibility: Employee ALO Super Admin Chairman HR Manager with explicit permission No other employee can access personal HR information unless explicitly authorized. ============================================================ PERSONAL INFORMATION ============================================================ Store: Employee ID Photo Full Name Father Mother Gender Date of Birth Nationality Religion Blood Group Marital Status NID Passport TIN Driving License Personal Email Official Email Phone Emergency Contact Present Address Permanent Address Bank Account Mobile Banking Education Experience Skills Languages ============================================================ EMPLOYMENT INFORMATION ============================================================ Joining Date Confirmation Date Probation Department Designation Reporting Manager Branch Office Employee Type Employment Status Salary Grade Gross Salary Basic Salary Allowances Tax Provident Fund Insurance Working Hours Shift Weekly Holiday ============================================================ PRIVATE INFORMATION ============================================================ The following must have restricted access: Salary Bank Account Tax Provident Fund Emergency Contact Personal Address NID Passport HR documents Leave records Warning records Termination records Private employee notes Employment agreements Access must be permission-based. ============================================================ PROFILE STATUS ============================================================ Incomplete Submitted Under Review Approved Correction Required Suspended Inactive Terminated ============================================================ EMPLOYEE DOCUMENT CENTER ============================================================ Every employee must have a secure document center. Mandatory/optional document types: Passport NID Photo CV Academic Certificates Experience Letter Appointment Letter Confirmation Letter Increment Letter Promotion Letter Transfer Letter Warning Letter Termination Letter Employment Agreement NDA Confidentiality Agreement Device Agreement IT Policy Data Privacy Agreement International Agreement Bangladesh Employment Agreement Exit Clearance Other HR Documents ============================================================ DOCUMENT DELETE RESTRICTION ============================================================ NO PERMANENT DELETE for official HR documents. Employees may upload documents where permitted. Employees cannot delete official documents. Authorized HR/Admin users may: Review Approve Reject Request Replacement Supersede Archive But historical versions must remain available according to retention policy. ============================================================ DOCUMENT VERSIONING ============================================================ Every official document must support: Version Number Uploaded By Uploaded At Status Reviewer Review Note Effective Date Superseded Date File Hash Audit ID Example: Appointment Letter V1 Appointment Letter V2 Appointment Letter V3 Only one version can be CURRENT. Previous versions remain historical. ============================================================ HR AGREEMENT CENTER ============================================================ Store: Appointment Letter HR Policy Company Policy Leave Policy Salary Policy Notice Policy Provident Fund Policy Gratuity Policy Security Policy Confidentiality Policy International Employment Agreement Bangladesh Employment Agreement Digital Acceptance: Employee Agreement Version Acceptance Date Acceptance IP Acceptance Device Acceptance Timestamp Acceptance history cannot be overwritten. ============================================================ DIGITAL SIGNATURE ============================================================ Support: Document acknowledgement Digital acceptance Timestamp IP Device/session Document version Acceptance record For legally sensitive documents, integrate an appropriate signature provider where required. Do not represent a simple checkbox as a legally valid signature unless legally configured. ============================================================ EMPLOYEE ROLE SYSTEM ============================================================ Roles/designations may include: Chairman CEO Director Office Manager Country Manager Counselor Senior Counselor Application Manager Application Team Visa Officer Finance Officer Marketing Manager Marketing Officer Front Desk HR Manager Support Staff Viewer The system must support: Primary Role Secondary Role Permission Package Custom Permissions Temporary Permissions ============================================================ PERMISSION ACTIONS ============================================================ Permissions must be granular. Supported actions: VIEW CREATE EDIT SUBMIT ACCEPT REJECT APPROVE VERIFY SEND DOWNLOAD UPLOAD EXPORT ASSIGN REASSIGN ARCHIVE CONFIGURE MANAGE ESCALATE GENERATE PUBLISH DELETE DELETE must be separately controlled and should normally mean soft-delete/archive, not permanent destruction. ============================================================ ACCEPTANCE VS APPROVAL ============================================================ These are DIFFERENT permissions. ACCEPT: "I have received/taken responsibility for this task." APPROVE: "I have authority to authorize this action." Example: Counselor ACCEPTS assigned student. Application Officer SUBMITS application. Authorized Manager APPROVES restricted application action. Finance Officer PREPARES payment. Finance Approver APPROVES payment. Employee CANNOT approve their own permission request. ============================================================ SEPARATION OF DUTIES ============================================================ High-risk workflows must use: MAKER → REVIEWER → APPROVER Example: Payment: Finance Officer → creates payment request Reviewer → verifies Authorized Approver → approves The same user must NOT approve their own restricted action. ============================================================ EMPLOYEE PERMISSION MATRIX ============================================================ COUNSELOR: Can: View assigned students Manage assigned students Communicate with students WhatsApp Email Phone Request documents Review documents Reject incorrect student documents Create follow-up tasks Track applications Prepare application information Prepare payment information Prepare interview preparation Escalate cases Cannot by default: Delete official documents Delete students Change protected application stage Approve own restricted actions View employee HR data View salary Approve own payment Change own permissions ============================================================ SENIOR COUNSELOR ============================================================ All permitted Counselor functionality plus: Review counselor work Reassign cases Review SLA Handle escalations Approve permitted operational actions Review document disputes Cannot bypass financial/HR/security controls. ============================================================ APPLICATION OFFICER ============================================================ Can: Create applications Edit authorized application data Manage university requirements Manage offer letters Track conditions Manage application documents Prepare university communication Submit authorized applications Prepare payment information Cannot approve their own restricted financial action. ============================================================ VISA OFFICER ============================================================ Can: Manage visa cases Review visa documents Prepare visa checklist Manage visa workflow Prepare interview guidance Review interview results Record visa decisions Communicate visa requirements AI must not fabricate immigration information. ============================================================ FINANCE OFFICER ============================================================ Can: Create payment records Prepare university payment information Verify receipts Reconcile payments Prepare payment instructions Manage authorized financial records Restricted payment approval requires authorized approver. ============================================================ DOCUMENT OFFICER ============================================================ Can: Review documents Verify documents Reject documents Request replacement Classify documents Manage document checklist Cannot permanently delete official documents. ============================================================ MARKETING OFFICER ============================================================ Can: Marketing dashboard Campaigns Approved social accounts Content creation Approved AI marketing tools Social publishing where authorized Analytics Cannot access confidential HR/visa/finance information unless explicitly permitted. ============================================================ HR MANAGER ============================================================ Can, based on permission: Create employee Review profile Review documents Manage employment records Manage leave Manage attendance Manage agreements Manage employee lifecycle Manage payroll preparation Salary visibility must be separately permission-controlled. ============================================================ FINANCE ============================================================ Finance may access: Payroll Salary calculation Bank sheets Payment Loan Advance Tax Provident Fund Deductions Only authorized finance users can see sensitive calculations. ============================================================ VIEWER ============================================================ VIEWER must be read-only. No: Create Edit Approve Delete Send Export unless explicitly granted. ============================================================ CUSTOM PERMISSION PACKAGE ============================================================ Super Admin can create: Permission Package Name Description Feature Permissions Action Permissions Scope Quota Expiry Approval Requirement Example: COUNSELOR_STANDARD COUNSELOR_SENIOR APPLICATION_MANAGER FINANCE_RESTRICTED VISA_OFFICER MARKETING_STANDARD HR_STANDARD Packages must remain editable. ============================================================ SUPER ADMIN MASTER CONTROL CENTER ============================================================ Route: /admin/access-control-center Sections: ALO Employee Roles Employee Permissions Permission Packages Departments Branches Offices Employee Approval Employee Documents Employee HR Access Salary/Payroll Access AI Feature Access Social Media Access WhatsApp Access Email Access Phone Access Application Access Document Access Visa Access Finance Access Partner Access B2B Visibility Quota Management Audit Logs Security Logs Temporary Permissions Permission Requests ============================================================ SUPER ADMIN CAPABILITIES ============================================================ Super Admin can: Create employee Edit employee Deactivate employee Suspend employee Reactivate employee Assign role Assign designation Assign department Assign branch Assign office Assign manager Assign permission package Create permission package Enable feature Disable feature Set permission scope Grant temporary access Revoke access Review audit Review usage Review security events Super Admin is the master access authority. ============================================================ EMPLOYEE PERMISSION PANEL ============================================================ For each employee: EMPLOYEE DESIGNATION DEPARTMENT BRANCH ROLE STATUS Then: STUDENT APPLICATION DOCUMENT VISA FINANCE HR MARKETING SOCIAL WHATSAPP EMAIL PHONE AI REPORTS EXPORT ADMINISTRATION Each feature: VIEW CREATE EDIT SUBMIT ACCEPT REJECT APPROVE VERIFY SEND DOWNLOAD UPLOAD EXPORT ASSIGN REASSIGN CONFIGURE Each can be: ON OFF ============================================================ ACCESS SCOPE ============================================================ Support: GLOBAL COUNTRY BRANCH OFFICE DEPARTMENT TEAM ASSIGNED OWN RECORD Example: Counselor: ASSIGNED STUDENTS only. Branch Manager: OWN BRANCH. HR: GLOBAL HR records if authorized. Partner: OWN COMPANY only. ============================================================ OBJECT LEVEL SECURITY ============================================================ A permission must identify: USER ROLE FEATURE ACTION OBJECT OBJECT_ID SCOPE Example: COUNSELOR → VIEW → STUDENT → STU-10025 → ASSIGNED Allowed. Same Counselor: STU-99999 → NOT ASSIGNED Denied. ============================================================ FIELD LEVEL SECURITY ============================================================ A user may view a record but not all fields. Example: Counselor can view Student. Cannot view: internal financial notes restricted visa notes private employee information Finance can view authorized financial fields. HR can view authorized employee fields. ============================================================ TEMPORARY ACCESS ============================================================ Support: Permission Start Date End Date Reason Granted By Approved By Automatically revoke after expiry. ============================================================ PERMISSION REQUEST ============================================================ Employee can request: Feature Permission Scope Duration Reason Workflow: REQUESTED → REVIEWING → APPROVED / REJECTED → ACTIVE Approval history must remain. ============================================================ EMERGENCY ACCESS ============================================================ Support controlled: BREAK_GLASS_ACCESS Require: Reason Approver Start Expiry Scope Every action must be audited. ============================================================ ATTENDANCE ============================================================ Support: Clock In Clock Out Present Absent Late Half Day Holiday Leave Working Hours Idle Time Monthly Summary Attendance Calendar Never automatically capture webcam photos. Camera access must require explicit permission. ============================================================ LEAVE SYSTEM ============================================================ Leave types: Casual Leave Annual Leave Medical Leave Maternity Leave Paternity Leave Leave Without Pay Compensatory Leave Track: Balance Request Approval History Dates Reason Documents Approver ============================================================ PAYROLL ============================================================ Generate monthly payroll. Calculate: Attendance Leave Late Holiday Overtime Bonus Allowance Loan Advance Tax Provident Fund Deduction Generate: Salary Slip Payroll Report Bank Sheet ============================================================ PAYROLL AI ============================================================ AI may: Analyze attendance Calculate draft payroll Detect anomalies Prepare payroll draft Prepare salary slip draft Identify missing information Flag inconsistencies AI CANNOT finalize high-risk salary/payment decisions. Workflow: AI PREPARES → HUMAN HR/FINANCE CHECK → HUMAN APPROVAL → FINAL PAYROLL ============================================================ EMPLOYEE DEVICE MANAGEMENT ============================================================ Register: Laptop Desktop Tablet Phone Store: Device Name Serial Number Asset Tag Assigned Date Warranty Status Returned Date Condition ============================================================ LOGIN SECURITY ============================================================ Record: IP Browser Operating System Device Fingerprint where legally appropriate Approximate Location where legally appropriate Login Time Logout Time Failed Login Session History Apply: MFA Session Expiry Login Protection Rate Limiting Suspicious Login Detection ============================================================ EMPLOYEE SOCIAL MEDIA CENTER ============================================================ Every authorized employee dashboard may have: SOCIAL MEDIA CENTER Where permitted: WhatsApp Facebook Instagram LinkedIn X YouTube TikTok Email Other approved channels Access is permission controlled. Employee cannot automatically access every ALO social account. ============================================================ WHATSAPP CENTER ============================================================ WhatsApp is a REQUIRED communication channel where authorized. Employee dashboard can provide: WhatsApp Inbox WhatsApp Messages WhatsApp Calls where provider/platform supports it Documents Images Voice Templates Student-linked conversations Search Follow-up Assignment SLA Unread count ============================================================ WHATSAPP CONTACT MATCHING ============================================================ When a WhatsApp number is received: IF number exists: Match existing student/contact. IF number does not exist: Create a new communication/contact identity. Do NOT create duplicate student records automatically. Use: phone_normalized country_code external_contact_id to identify contacts. If confidence is uncertain: ask/flag for human matching. ============================================================ WHATSAPP DOCUMENT CONTROL ============================================================ Authorized employees may send/upload documents through officially connected WhatsApp channels. Important: A counselor must NOT be able to delete official application documents. Student-submitted documents may be: RECEIVED PENDING_REVIEW ACCEPTED REJECTED REPLACEMENT_REQUIRED REJECT ≠ DELETE ============================================================ COMMUNICATION SLA ============================================================ Every incoming communication may have: Received Time SLA Priority Assigned Employee Due Time Response Time Status If employee does not respond within SLA: Reminder Warning Escalation Repeated SLA violations: 1st 2nd 3rd 4th 5th After configured repeated violations: Manager warning Justification required The system must not unfairly penalize provider outages, system errors or unavailable channels. ============================================================ APPLICATION WORKFLOW ACCESS ============================================================ Applications must use controlled workflow states. Example: LEAD → COUNSELING → DOCUMENT_COLLECTION → DOCUMENT_VERIFICATION → APPLICATION_PREPARATION → APPLICATION_SUBMITTED → OFFER_RECEIVED → CONDITIONS_PENDING → CONDITIONS_MET → PAYMENT_PENDING → PAYMENT_COMPLETED → CAS/COE/etc. → VISA_PREPARATION → VISA_SUBMITTED → VISA_DECISION → COMPLETED Employees cannot arbitrarily jump stages. Each transition requires permission. ============================================================ DOCUMENT REQUIREMENT SYSTEM ============================================================ Every application can have a document checklist. Example: Passport NID Academic Certificate Transcript English Test Financial Documents Bank Documents Sponsor Documents Experience Letter CV Other University Documents Status: MISSING REQUESTED UPLOADED UNDER_REVIEW ACCEPTED REJECTED REPLACEMENT_REQUIRED EXPIRED ============================================================ DOCUMENT FOLLOW-UP ============================================================ If documents are missing: Show checklist/bell/alert. Example: MISSING DOCUMENTS: 4 [Passport] [Bank Statement] [English Certificate] [Experience Letter] Counselor can click a document and: Send Email Send WhatsApp Create Follow-up Add Note Message must use approved templates. ============================================================ OFFER LETTER MANAGEMENT ============================================================ When an offer letter arrives: Record: University Application Student Program Campus Intake Offer Type Conditions Date Received Source Received By Document Version Status Source may include: University Portal University Email Agent Portal API Upload Other Authorized Source Never lose provenance. ============================================================ UNIVERSITY APPLICATION SERIAL ============================================================ Every application must have a unique application number. Example: ALO-UK-2026-000123 All university applications remain consistently numbered. Application record must show: Student University Course Country Intake Application Number Current Stage Documents Offer Conditions Payment Visa Communication Audit ============================================================ TWO TYPES OF APPLICATION COMMENTS ============================================================ Every application must have two separate comment systems.
1. STUDENT-VISIBLE COMMENTS
2. INTERNAL ALO COMMENTS ============================================================ STUDENT-VISIBLE COMMENTS ============================================================ Student-visible comments may be sent to the student. Support: Text Attachment Document Notification Email WhatsApp where authorized If a document is uploaded with a student-visible comment: send notification to student according to configured channel. Example: "Your updated bank document has been uploaded and is now under review." ============================================================ INTERNAL ALO COMMENTS ============================================================ Internal comments are NEVER shown to students. Used for: Counselor notes Manager notes Risk assessment Internal decisions University strategy Visa observations Operational notes Internal comments must have strict access control. ============================================================ UNIVERSITY PAYMENT SYSTEM ============================================================ Before payment: Counselor/Application/Finance team prepares: University Payment Type Amount Currency Deadline Bank Information Account Name Account Number SWIFT IBAN where applicable Payment Reference Invoice Payment Link Payment Method Required Supporting Documents Finance-authorized user verifies information. ============================================================ PAYMENT COMMUNICATION ============================================================ Once verified: Counselor can send student: Payment amount Currency Deadline University Payment method Bank information Payment reference Required documents Instructions Use approved ALO communication template. Never send unverified bank information automatically. Human verification must be required for sensitive payment details. ============================================================ POST-OFFER REQUIREMENT SYSTEM ============================================================ After offer letter: System automatically analyzes university conditions and creates: MANDATORY RECOMMENDED OPTIONAL requirements. Examples: Bank statement Sponsor documents Financial evidence Interview preparation Deposit Tuition payment Additional certificates Affidavit TB test Medical Other country-specific requirements ============================================================ BANK DOCUMENT GUIDANCE ============================================================ AI can prepare guidance for: Bank statement Bank certificate Sponsor letter Financial evidence Source of funds Transaction history The system must clearly label: Official requirement ALO guidance AI-generated explanation Do not fabricate bank requirements. Always use verified current university/country guidance. ============================================================ INTERVIEW PREPARATION ============================================================ System can prepare: University interview questions Country interview questions Visa interview questions Credibility interview questions Financial questions Academic questions Future plan questions Study plan questions Sponsor questions Course knowledge questions University knowledge questions ============================================================ INTERVIEW RESEARCH ENGINE ============================================================ Before generating interview guidance: AI should research available recent information. Target research window: minimum 6 months where reliable data exists. Research: Recent university interview patterns Official university guidance Official visa/immigration guidance Current country requirements Recent student-reported interview themes Known question patterns DO NOT claim access to private or confidential interview data. Do NOT guarantee: "100% visa" "100% pass" "exact questions" The system must state that questions can vary. ============================================================ STUDENT ANSWER PREPARATION ============================================================ Student provides: Financial Plan Future Plan Academic Background Study Reason University Reason Course Reason Career Plan Sponsor Information AI prepares structured answer guidance. Important: Do NOT create false information. Answers must be based on student's real information. ============================================================ INTERVIEW ANSWER FORMAT ============================================================ For each question: Question What the interviewer wants to understand Recommended answer structure Student-specific answer draft Important facts Things to avoid Follow-up questions Practice answer ============================================================ INTERVIEW DOCUMENT DOWNLOAD ============================================================ Student can download interview preparation document. Downloaded document must use: ALO Education official branded document template. Include: ALO Education logo Official header Student name University Course Country Application number Date Version Confidentiality/usage notice where appropriate ============================================================ INTERVIEW PRACTICE WINDOW ============================================================ When student downloads/interview preparation is activated: Start a configurable practice period. Default: 3 days / 72 hours During the period: Student can practice with AI 24/7. Support: Text Voice where technically available Video where technically available AI should behave as an interview practice partner. ============================================================ INTERVIEW AI BEHAVIOR ============================================================ AI must understand: Bangladeshi English Accent variation Pronunciation differences Broken English Slow speech Hesitation Grammar mistakes Code-switching Different speaking speeds Do NOT score students purely on grammar. Evaluate: Content Accuracy Consistency Clarity Confidence Relevance Completeness Pronunciation intelligibility Communication ability AI must distinguish: Language weakness from: Wrong/false information. ============================================================ INTERVIEW SCORING ============================================================ Initial AI assessment may include: Communication Content Confidence Relevance Consistency Question Understanding Answer Quality Pronunciation Intelligibility But: AI preliminary result ≠ final decision. A human reviewer must be able to review the interview. ============================================================ INTERVIEW RECORDING ============================================================ If student consents: Store interview video/audio. Student must be informed: recording purpose storage retention who can access how it is used Access: Student Authorized Interview Team Authorized Counselor Authorized Manager Super Admin according to permission. ============================================================ HUMAN FINAL REVIEW ============================================================ Workflow: Student Practice → AI Preliminary Assessment → Human Interview Team Review → Final Internal Decision AI cannot automatically make a final visa/admission decision. ============================================================ SUCCESS / REVIEW REQUEST ============================================================ After successful visa outcome, where appropriate: Student may be invited to submit: Google Review Facebook Review ALO Education Success Story Use: QR Code Review Link Student Portal Do not force positive reviews. Student must be free to provide an honest review. ============================================================ SUCCESS STORY AUTOMATION ============================================================ If student provides explicit consent and review: Create a Success Story candidate. Possible: Website success page Social media content ALO success gallery Human approval should be available before public publication. ============================================================ STUDENT DOCUMENT SECURITY ============================================================ Students can: Upload documents Download permitted documents View their documents Students cannot: Delete official application documents Delete official HR records Delete application records Change application stages Change verified records ============================================================ APPLICATION DOCUMENT REJECTION ============================================================ Counselor/Application Officer may: Reject student-submitted document Must provide: Reason Optional note Required replacement Rejected document remains in history. Student can upload a replacement into the same document position. Example: Passport Version 1 → REJECTED Version 2 → UNDER REVIEW Version 3 → ACCEPTED Never erase the historical chain. ============================================================ SERVICE CHARGE DECLARATION ============================================================ Before university payment or other configured stage: System may require an official ALO declaration/acknowledgement that clearly states the applicable service-fee arrangement. If ALO policy requires confirmation that no service charge was taken, use an approved legal/compliance template. Do not generate false legal declarations. The document must be approved by authorized ALO management. ============================================================ COURSE FINDER MAPPING ============================================================ Course Finder should include a visual: "ALO 7-Step Journey" When user clicks: [MAPPING / 7 STEPS] generate a branded visual document. The visual must show the actual configured ALO journey. Example:
3. Counseling
4. Course & University Selection
5. Document Preparation
6. Application
7. Offer / Conditions
8. Payment / Visa Preparation
9. Visa / Enrollment Do not hard-code if the existing ALO workflow uses different stages. Allow: View Download Share where authorized ============================================================ HR ANALYTICS ============================================================ HR dashboard: Headcount Attendance Rate Late % Absent % Leave % Payroll Cost Department Cost New Joiners Resignations Probation Employees Upcoming Confirmation Birthdays Work Anniversaries Expiring Contracts Missing Documents ============================================================ ROLE-SPECIFIC HR WIDGETS ============================================================ HR: Pending Leave Payroll Joining Documents Missing Contracts Employee Issues Finance: Payroll Salary Cost Loan Provident Fund Payments Accounts: Payroll Voucher Salary Payment Financial Records Employee: Own Attendance Own Leave Own Salary Slip Own Documents Manager: Team Attendance Team Leave Team Performance IT: Devices Returns Security Alerts Operations: Branch Attendance Branch Leave Branch Staff Super Admin: Complete HR Analytics Employees Branches Documents System Health Payroll Status Security Audit ============================================================ NOTIFICATION ENGINE ============================================================ Notify authorized users about: Employee Joining Profile Submission Correction Required Confirmation Increment Promotion Document Expiry Passport Expiry Visa Expiry Contract Expiry Birthday Work Anniversary Payroll Ready Salary Paid Leave Request Leave Approval SLA Breach Permission Request Permission Approval Permission Rejection Security Alert ============================================================ EMPLOYEE ERROR CONTROL ============================================================ System must track: Human Error System Error Provider Error Student Error University Error Never automatically blame an employee. Every incident: Actor Time Action System Error Workflow Reason Impact must be recorded. ============================================================ AUDIT LOG SYSTEM ============================================================ Audit: LOGIN LOGOUT ACCOUNT_CREATED ACCOUNT_APPROVED ACCOUNT_SUSPENDED ACCOUNT_DEACTIVATED ROLE_CHANGED PERMISSION_GRANTED PERMISSION_REVOKED PROFILE_VIEWED SALARY_VIEWED SALARY_CHANGED DOCUMENT_VIEWED DOCUMENT_DOWNLOADED DOCUMENT_UPLOADED DOCUMENT_REJECTED DOCUMENT_VERIFIED APPLICATION_VIEWED APPLICATION_CHANGED APPLICATION_SUBMITTED PAYMENT_CREATED PAYMENT_VIEWED PAYMENT_APPROVED WHATSAPP_SENT EMAIL_SENT CALL_LOGGED AI_USED AI_RECOMMENDATION AI_APPROVAL EXPORT DOWNLOAD REASSIGNMENT ESCALATION Store: actor_id actor_role action target_type target_id old_value new_value reason approval_id timestamp IP session/device identifier where appropriate ============================================================ NO HISTORY DELETION ============================================================ Never delete: Audit logs Approval history Application history Payment history Document history Employee history Communication history Use archive/soft-delete where applicable. ============================================================ EMPLOYEE DEACTIVATION ============================================================ When employee leaves: Revoke login Revoke sessions Revoke API tokens Revoke WhatsApp access Revoke social access Revoke email integration access Revoke temporary permissions Revoke AI permissions Revoke device access Preserve: Student history Application history Document history Communication history Approval history Audit history ============================================================ WORK REASSIGNMENT ============================================================ Before deactivation: System identifies: Assigned Students Applications Documents Tasks Messages WhatsApp conversations Pending approvals Pending follow-ups Escalations Manager selects replacement. Nothing may silently disappear. ============================================================ AI PERMISSION SYSTEM ============================================================ AI features must also use the same permission engine. Examples: Counselor AI Application AI Visa AI Finance AI HR AI Marketing AI Interview AI Document AI AI can only access data permitted to the logged-in user. AI cannot bypass RBAC. ============================================================ AI ACTION CONTROL ============================================================ AI may: READ ANALYZE SUMMARIZE CLASSIFY DRAFT RECOMMEND PREPARE High-risk actions require human approval: Payment Official university communication Visa communication Document verification Permission changes Employee termination Salary finalization Public publishing ============================================================ PARTNER ACCESS CONTROL ============================================================ Partner system must use the same centralized access engine. Partner roles: Partner Super Admin Partner Employee Partner Counselor Partner Marketing Partner Viewer Partner can access only own organization data. ============================================================ PARTNER PACKAGES ============================================================ STARTER PARTNER: 1 Partner Super Admin 2 Employee seats 15 images/month 10 videos/month 30-second maximum video 3 English mock test vouchers per eligible student 1 interview preparation benefit per eligible student GROWTH PARTNER: Custom seats Custom image quota Custom video quota Optional landing page Additional campaign features PREMIUM PARTNER: Custom agreement Higher quota Dedicated support Advanced integrations All package limits are editable by ALO Super Admin. ============================================================ PARTNER QUOTA ENGINE ============================================================ Track: User Seats Images Videos Video Duration Mock Test Vouchers Interview Preparation Marketing Posts Other configured resources Before action: check quota → allow/reject → record usage ============================================================ EXTRA QUOTA REQUEST ============================================================ Partner requests: Extra Seat Extra Image Quota Extra Video Quota Extra Voucher Other Feature Workflow: REQUESTED → REVIEW → APPROVED / REJECTED Record: requested current limit requested limit reason reviewer review note date ============================================================ PARTNER STUDENT BENEFITS ============================================================ Partner student cannot automatically use restricted ALO benefits. Eligibility rules may require: ALO application eligible university/application approved status benefit availability Example: 3 English mock test vouchers 1 interview preparation benefit Track each voucher. ============================================================ FEATURE ACCESS ENGINE ============================================================ Create backend helpers: canAccessFeature(user_id, feature_key) getQuota(owner_type, owner_id, feature_key) checkQuotaBeforeAction( owner_type, owner_id, feature_key ) recordUsage( owner_type, owner_id, feature_key ) canViewEmployeePrivateProfile( viewer_id, employee_id ) canViewB2BDetails( user_id, application_id ) canUseStudentBenefit( student_id, benefit_type ) canApproveAction( user_id, action_type, target_id ) canAccessApplication( user_id, application_id ) canAccessDocument( user_id, document_id ) canSendCommunication( user_id, channel, target_id ) Every sensitive controller MUST use these checks. ============================================================ DATABASE ============================================================ Create/extend: employees employee_profiles employee_education employee_emergency_contacts employee_salary employee_documents employee_activation_tokens employee_roles employee_permissions employee_permission_packages employee_permission_assignments employee_permission_requests employee_temporary_permissions employee_departments employee_branches employee_offices employee_attendance employee_leave employee_leave_requests employee_payroll employee_payroll_items employee_devices employee_sessions employee_login_logs employee_agreements employee_agreement_acceptances employee_document_versions employee_audit_logs employee_security_events employee_reassignments ============================================================ EMPLOYEES ============================================================ employees: id employee_code user_id full_name company_email personal_email phone designation department_id office_id branch_id joining_date confirmation_date employment_type reporting_manager_id profile_status status created_at updated_at ============================================================ EMPLOYEE PROFILES ============================================================ employee_profiles: id employee_id dob gender marital_status nationality religion blood_group present_address permanent_address photo nid_reference passport_reference tin_reference created_at updated_at Sensitive values must be appropriately encrypted/protected. ============================================================ EMPLOYEE EDUCATION ============================================================ employee_education: id employee_id degree institution passing_year result certificate_path created_at updated_at ============================================================ EMPLOYEE EMERGENCY CONTACT ============================================================ employee_emergency_contacts: id employee_id name relation phone address created_at updated_at ============================================================ EMPLOYEE SALARY ============================================================ employee_salary: id employee_id salary_amount allowance bonus bank_name bank_account payment_method tax_info_reference effective_date visibility created_at updated_at Salary must be protected. ============================================================ EMPLOYEE DOCUMENTS ============================================================ employee_documents: id employee_id document_type file_path status current_version reviewer_id review_note created_at updated_at ============================================================ EMPLOYEE ACTIVATION TOKENS ============================================================ employee_activation_tokens: id employee_id token_hash expires_at used_at status created_at ============================================================ PERMISSION SYSTEM ============================================================ permission definitions: id feature_key action description risk_level requires_approval created_at updated_at ============================================================ FEATURE ACCESS RULES ============================================================ feature_access_rules: id owner_type owner_id feature_key action scope_type scope_id is_enabled limit_value requires_approval created_by updated_by created_at updated_at ============================================================ PARTNER PACKAGES ============================================================ partner_packages: id name description default_user_limit monthly_image_limit monthly_video_limit video_duration_limit_seconds english_mock_voucher_limit interview_prep_limit auto_publish_allowed requires_alo_approval status created_at updated_at ============================================================ PARTNER PACKAGE ASSIGNMENTS ============================================================ partner_package_assignments: id partner_id package_id assigned_by starts_at expires_at status created_at updated_at ============================================================ EXTRA QUOTA REQUESTS ============================================================ extra_quota_requests: id partner_id request_type current_limit requested_limit reason status reviewed_by review_note created_at updated_at ============================================================ SECURITY ============================================================ Implement: RBAC ABAC CSRF Protection Prepared Statements Backend Validation Rate Limiting Secure Sessions MFA where configured Encrypted Sensitive Data Protected File Storage Signed/Authorized Download URLs Access Expiry Audit Logging Soft Delete Version History Never trust: client-provided role client-provided employee ID client-provided permission client-provided branch client-provided approval status ============================================================ FILE STORAGE ============================================================ Sensitive employee documents must NOT be publicly accessible. Do not expose: /uploads/hr/ /uploads/salary/ /uploads/nid/ /uploads/passport/ directly. Use protected download endpoints. Example: GET /api/employee-documents/:id/download Backend checks: authenticated user permission scope document status Then streams/downloads the file. ============================================================ API REQUIREMENT ============================================================ Create secure APIs for: Employee creation Employee activation Employee profile Employee documents Employee document review Employee permissions Permission packages Permission requests Role assignment Attendance Leave Payroll Salary Devices Login history Agreements Audit Partner packages Partner quotas Feature access Usage Notifications Every API must have: authentication authorization validation error handling audit where required ============================================================ NOTIFICATION ENGINE ============================================================ Support: In-App Email WhatsApp where officially configured SMS where configured Do not expose sensitive information in notifications. Example: "Your employee profile requires correction." instead of: "Your NID and salary information are incorrect." ============================================================ COMMUNICATION ACCESS ============================================================ Employees may have: WhatsApp Email Phone SMS Social Media depending on permission. Communication actions must be linked to: Student Lead Application Partner University Task where applicable. ============================================================ SOCIAL MEDIA SECURITY ============================================================ Employee access to official ALO social accounts must be: permission controlled token controlled audited Employee deactivation must trigger: token/session revocation where supported permission removal account disconnect where supported Preserve historical posts/messages. ============================================================ REPORTING SYSTEM ============================================================ Super Admin reports: Employee access report Permission changes Employee profile completion Employee document status Salary access audit Payroll status Attendance Leave Security events Login history B2B visibility audit Partner usage Quota usage Voucher usage AI usage Communication usage ============================================================ PARTNER SUPER ADMIN REPORTS ============================================================ Own: Students Applications Employees Leads Marketing Quota Vouchers Performance Cannot view another partner's data. ============================================================ NOTIFICATION RULES ============================================================ Notify ALO Super Admin: Employee profile submitted Employee permission request Sensitive profile accessed Salary accessed Document accessed Partner extra seat request Partner extra quota request Quota exceeded Restricted feature attempt Security alert Repeated SLA breach Notify Partner Super Admin: Quota near limit Quota finished Extra quota approved/rejected Student benefit activated Voucher generated Application submitted/approved ============================================================ HR DASHBOARD ============================================================ Provide: Employee Directory Employee Requests Profile Review Documents Attendance Leave Payroll Agreements Devices Security Reports Analytics ============================================================ SUPER ADMIN DASHBOARD ============================================================ Provide: Total Employees Active Employees Pending Activation Pending Profile Review Pending Permission Requests Suspended Employees Missing Documents Upcoming Contract Expiry Security Alerts Payroll Status Attendance Leave Permission Changes Recent Audit Activity Partner Usage Quota Usage ============================================================ EMPLOYEE DASHBOARD ============================================================ Employee sees: Own Profile Own Documents Own Agreements Own Attendance Own Leave Own Salary Slip Own Devices Own Notifications Own Permission Requests Own Security Sessions Employee cannot view another employee. ============================================================ MANAGER DASHBOARD ============================================================ Manager sees only permitted team information: Team Employees Team Attendance Team Leave Team Tasks Team Performance Pending Approvals No private salary/HR fields unless explicitly permitted. ============================================================ AUDIT REQUIREMENT ============================================================ Audit every: Permission grant Permission revoke Role change Profile access Salary access Document access Document download Document rejection Document verification Application access Payment action Communication action AI action Quota change Partner access B2B access Export Approval Rejection Audit record cannot be modified by ordinary employees. ============================================================ SELF-AUDIT REQUIREMENTS ============================================================ After implementation automatically verify:
10. Super Admin can create employee.
11. Activation email works.
12. Activation token expires.
13. Employee can create password.
14. Employee can complete own profile.
15. Employee can upload required documents.
16. HR can review.
17. Unauthorized user cannot view employee private profile.
18. Unauthorized user cannot view salary.
19. Unauthorized user cannot download NID/passport.
20. Employee cannot delete official HR document.
21. Document version history works.
22. Counselor can access assigned students only.
23. Counselor cannot access unauthorized students.
24. Counselor can reject student-submitted document.
25. Counselor cannot permanently delete document.
26. Student can upload replacement document.
27. Internal comments remain invisible to student.
28. Student-visible comments can notify student.
29. Application stage cannot be changed arbitrarily.
30. Finance can prepare authorized payment.
31. Restricted payment requires authorized approval.
32. Maker cannot approve own action.
33. AI cannot bypass permissions.
34. AI cannot finalize high-risk payroll.
35. Partner can access only own company.
36. Partner seat limits work.
37. Extra seat approval works.
38. Image quota works.
39. Video quota works.
40. Video duration limit works.
41. Voucher limits work.
42. Student benefits require eligibility.
43. WhatsApp access follows permissions.
44. Employee deactivation revokes access.
45. Existing sessions are revoked.
46. Audit records remain.
47. Student Dashboard remains unchanged.
48. Existing CRM functionality remains intact.
49. No frontend-only authorization exists. ============================================================ PRODUCTION ACCEPTANCE ============================================================ Implementation is NOT considered complete if:
* only UI was created
* permissions are frontend-only
* APIs bypass authorization
* salary is publicly accessible
* documents are publicly accessible
* employees can delete official records
* users can approve themselves
* partners can see other partners
* students can access internal data
* AI bypasses permissions
* audit logs are missing
* application stages can be changed without authority
* payment information can be sent without verification
* deactivated employees can continue accessing systems ============================================================ FINAL RULE ============================================================ Build ALO_EMPLOYEE_ACCESS_SYSTEM as ONE centralized enterprise authorization and employee management system. Do not create separate disconnected permission systems for: CRM HR Finance Visa Application Marketing WhatsApp Social Media AI Partner B2B Documents Interview Communication All of them must use the same central authorization engine. The final architecture must support: ROLE
* 
DESIGNATION + PERMISSION + SCOPE + OBJECT + FIELD + WORKFLOW + APPROVAL + QUOTA + TEMPORARY ACCESS + AUDIT ALO Super Admin has master control. Every other user receives only the minimum access required for their job. Use least privilege. Use separation of duties. Preserve history. Protect sensitive information. Never trust the frontend. Never allow unauthorized access through direct API calls. Never allow an employee to approve their own restricted action. Never allow permanent deletion of critical business history. Never allow AI to bypass human authorization. Student Dashboard must remain untouched.
              FINAL IMPLEMENTATION TASK
============================================================ NOW:
1. Inspect the existing ALO Education codebase.
2. Identify existing:
    * authentication
    * users
    * employees
    * roles
    * permissions
    * dashboards
    * CRM
    * applications
    * documents
    * communication
    * WhatsApp
    * email
    * finance
    * partner
    * AI
    * audit systems
3. DO NOT duplicate existing systems.
4. Reuse existing architecture where safe.
5. Extend existing tables/models where appropriate.
6. Create migrations.
7. Create backend authorization engine.
8. Create frontend permission UI.
9. Create Super Admin Access Control Center.
10. Create employee profile system.
11. Create employee document system.
12. Create HR system.
13. Create permission package system.
14. Create approval system.
15. Create audit system.
16. Integrate WhatsApp/social/email permissions.
17. Integrate application/document permissions.
18. Integrate AI permission controls.
19. Integrate partner permission/quota controls.
20. Run backend authorization tests.
21. Run role-by-role security tests.
22. Test direct API access.
23. Test unauthorized document downloads.
24. Test unauthorized salary access.
25. Test self-approval prevention.
26. Test employee deactivation.
27. Test permission revocation.
28. Test quota enforcement.
29. Test audit logging.
30. Test Student Dashboard regression.
31. Fix every discovered issue.
32. Do not stop at creating files.
33. Do not report "implemented" until actual functionality has been verified.
34. Provide evidence-based completion report. ============================================================ DELIVERY REPORT ============================================================ At completion report: A. Files Created B. Files Modified C. Database Tables Added D. Database Migrations E. APIs Added F. Permissions Added G. Roles Added H. Approval Workflows I. Security Controls J. Audit Controls K. Employee Features L. Partner Features M. AI Features N. Communication Features O. Tests Executed P. Tests Passed Q. Tests Failed R. Remaining External Authorization S. Deployment Instructions T. Rollback Instructions IMPORTANT: Do not claim functionality is complete merely because code exists. Only mark a feature COMPLETE after: Implementation
* 
Integration + Backend authorization + UI verification + Database verification + Security verification + Test verification are all complete.
          END OF MASTER SPECIFICATION
============================================================

VISA INTERVIEW OFFICER + VISA MANAGEMENT SYSTEM
MASTER IMPLEMENTATION / AUDIT / PATCH PROMPT
============================================================

IMPORTANT:

DO NOT REBUILD THE EXISTING PROJECT.

DO NOT CREATE A NEW PROJECT.

DO NOT REPLACE THE EXISTING CRM.

DO NOT DELETE WORKING FEATURES.

DO NOT DUPLICATE EXISTING VISA COMPONENTS.

DO NOT CREATE FAKE DASHBOARDS.

DO NOT USE HARDCODED DEMO DATA.

DO NOT CLAIM COMPLETE WITHOUT LIVE TEST EVIDENCE.

WORK INSIDE THE EXISTING ALO EDUCATION WEB_CRM PROJECT.

============================================================
1. PRIMARY OBJECTIVE
============================================================

Build, complete, repair and integrate the complete:

ALO EDUCATION VISA INTERVIEW OFFICER SYSTEM

inside the existing Web CRM.

The system must connect:

Student
→ Application
→ Offer Letter
→ University
→ Course
→ Documents
→ Finance/Funding
→ Sponsor
→ Study Gap
→ Previous Refusal
→ Visa Checklist
→ Interview Preparation
→ AI Interview
→ Human Visa Interview Officer
→ Visa Readiness
→ Visa Submission
→ Decision
→ Student Portal
→ Counselor
→ Application Team
→ Super Admin

The Visa Interview Officer must have a dedicated, properly routed,
RBAC-protected, API-backed and database-backed workspace.

The feature MUST NOT exist only inside CounselorPortal.

============================================================
2. FIRST ACTION: FULL EXISTING PROJECT AUDIT
============================================================

BEFORE WRITING CODE:

Scan the entire existing project.

Inspect:

- frontend
- backend
- routes
- API routes
- database
- Prisma schema
- migrations
- authentication
- RBAC
- permissions
- existing dashboards
- student portal
- counselor portal
- application system
- document system
- communication system
- timeline
- notifications
- AI systems
- interview systems
- existing visa modules
- reports
- audit logs
- file storage
- existing exports

Search for all existing visa-related implementations.

Search terms must include:

visa
Visa
VISA
interview
Interview
credibility
pre-CAS
CAS
UKVI
embassy
mock interview
visa readiness
visa score
visa risk
funding
sponsor
solvency
bank statement
study gap
refusal
visa document
visa checklist
passport
medical
criminal
visa officer
visa case

For every existing feature classify it:

FULLY_BUILT
PARTIALLY_BUILT
UI_ONLY
BACKEND_MISSING
API_MISSING
DATABASE_MISSING
RBAC_MISSING
ROUTE_BROKEN
AUDIT_MISSING
SECURITY_MISSING
INTEGRATION_MISSING
NOT_FOUND

Create an internal audit matrix before implementation.

Example:

Feature | Existing Location | Status | Reuse/Patch/Build

DO NOT rebuild anything marked FULLY_BUILT.

Reuse existing models/components wherever possible.

If an existing model already provides the same functionality,
extend it instead of creating a duplicate model.

============================================================
3. REQUIRED ROUTES
============================================================

CRM:

/crm/visa
/crm/visa-dashboard
/crm/visa-cases
/crm/visa-interviews
/crm/visa-readiness
/crm/visa-reports

Employee:

/employee/visa-dashboard
/employee/visa-officer
/employee/visa-interview-officer
/employee/visa-cases
/employee/visa-interviews
/employee/visa-documents
/employee/visa-readiness
/employee/visa-reports

Interview:

/employee/visa-interviews/:caseId
/crm/visa-interviews/:caseId

Student:

/student/visa
/student/visa-checklist
/student/ai-interview
/student/visa-interview-practice

Do not create duplicate routes if equivalent routes already exist.

Instead map existing routes correctly.

============================================================
4. RBAC
============================================================

Required roles:

VISA_OFFICER
VISA_INTERVIEW_OFFICER
VISA_TEAM
SUPER_ADMIN
ADMIN
COUNSELOR
APPLICATION_TEAM

Permissions:

visa.dashboard.view
visa.cases.view
visa.cases.assigned.view
visa.cases.update
visa.cases.assign
visa.cases.stage.update

visa.interviews.view
visa.interviews.create
visa.interviews.update
visa.interviews.finish
visa.interviews.export

visa.ai_interview.start
visa.ai_interview.answer
visa.ai_interview.finish
visa.ai_interview.result

visa.documents.view
visa.documents.review
visa.documents.request
visa.documents.download
visa.documents.approve
visa.documents.reject

visa.readiness.view
visa.readiness.calculate
visa.readiness.update

visa.risk.view
visa.risk.update

visa.funding.view
visa.funding.update

visa.study_gap.view
visa.study_gap.update

visa.refusal.view
visa.refusal.update

visa.sensitive.view
visa.sensitive.update

visa.notes.create
visa.notes.internal.create
visa.notes.student_feedback.create
visa.notes.edit

visa.tasks.view
visa.tasks.create
visa.tasks.update

visa.reports.view
visa.reports.generate
visa.reports.export

visa.super_review.request

IMPORTANT:

Frontend hiding is NOT security.

Every protected backend API must enforce:

Authentication
+
RBAC
+
Case ownership/assignment
+
Data visibility
+
Sensitive-field filtering
+
Audit logging

============================================================
5. VISA INTERVIEW OFFICER DASHBOARD
============================================================

Create a dedicated mission-control dashboard.

Header:

- Welcome back, {name}
- VISA_INTERVIEW_OFFICER badge
- Today interviews
- Assigned cases
- High-risk cases
- Pending documents
- Notifications
- Messages
- Language switch
- Logout

Quick Actions:

- View Visa Cases
- Start Interview
- Review Documents
- Generate Readiness Report
- Message Counselor
- Schedule Interview
- Export Report
- Escalate Case

Every button must perform a real action.

No dead buttons.

============================================================
6. KPI SYSTEM
============================================================

Display real API-driven KPI cards:

Assigned Visa Cases
Interview Queue
High-Risk Students
Documents Pending
Visa Readiness
Financial Risk
Refusal History
Counselor Handover

Each card:

- real number
- API source
- trend where available
- status
- loading state
- empty state
- error state
- action button

No fake numbers.

============================================================
7. VISA CASE PIPELINE
============================================================

Stages:

NOT_STARTED
CHECKLIST_CREATED
DOCUMENTS_REQUESTED
DOCUMENTS_UPLOADED
DOCUMENTS_UNDER_REVIEW
MISSING_DOCUMENTS
AI_INTERVIEW_PENDING
AI_INTERVIEW_COMPLETED
OFFICER_REVIEW_PENDING
OFFICER_FEEDBACK_SENT
READY_FOR_VISA_APPLICATION
VISA_SUBMITTED
DECISION_PENDING
APPROVED
REFUSED
CLOSED

Case card:

- Visa Case ID
- Student ID
- Student name
- destination
- university
- course
- intake
- counselor
- application officer
- visa officer
- current stage
- readiness
- risk
- missing documents
- next action
- last update

Actions:

View
Interview
Review Documents
Add Note
Request Document
Send Feedback
Message Counselor
Generate Report
Escalate

============================================================
8. ASSIGNED VISA CASE TABLE
============================================================

Filters:

- Student ID
- Student name
- country
- university
- course
- intake
- counselor
- application officer
- risk
- readiness
- documents
- interview status
- visa status
- date range

Columns:

Visa Case ID
Student ID
Name
Country
University
Course
Intake
Counselor
Application Officer
Interview Status
Document Status
Readiness
Risk
Visa Status
Last Updated
Actions

Bulk operations must be permission-controlled.

============================================================
9. VISA INTERVIEW WORKSPACE
============================================================

Route:

/employee/visa-interviews/:caseId

Sections:

A. Student Summary

B. Application Summary

C. University/Course Summary

D. Profile Risk

E. Financial/Sponsor Review

F. Study Gap Review

G. Refusal Review

H. Visa Checklist

I. Interview Script

J. Live Transcript

K. Officer Notes

L. Student-Safe Feedback

M. Scorecard

N. AI Recommendations

O. Tasks

P. Timeline

Q. Final Result

============================================================
10. INTERVIEW SCORECARD
============================================================

Score:

Communication Clarity
Confidence
Course Knowledge
University Knowledge
Country Knowledge
Financial Explanation
Sponsor Explanation
Study Gap Explanation
Future Plan
Refusal Explanation
Document Readiness
Overall Readiness

Do NOT allow AI to make a final visa decision.

AI provides preliminary analysis only.

Human Visa Interview Officer remains responsible for final internal assessment.

============================================================
11. AI VISA INTERVIEW
============================================================

Interview types:

Embassy Visa Interview
Credibility Interview
Pre-CAS Interview
University Interview
Sponsor/Funding Interview
Study Gap Interview
Previous Refusal Interview
English Speaking Interview
Final Visa Readiness Interview

AI must:

- ask naturally
- ask one question at a time
- wait for answer
- ask relevant follow-up questions
- detect incomplete answers
- identify contradictions
- identify memorized answers
- identify weak explanations
- identify unclear funding explanation
- identify weak course knowledge
- identify weak university knowledge
- identify weak future plan
- identify refusal explanation gaps

Do not judge solely by grammar.

The AI must understand:

- Bangladeshi English accents
- broken English
- Banglish
- pauses
- incomplete pronunciation
- non-native English patterns

Do NOT penalize a student simply for having a Bangladeshi accent.

Evaluate:

meaning
clarity
consistency
relevance
confidence
understanding

rather than accent alone.

============================================================
12. INTERVIEW QUESTION ENGINE
============================================================

Question categories:

Introduction
Why this country?
Why this university?
Why this course?
Why not Bangladesh?
Course modules
Career plan
Future plan
Funding
Sponsor
Sponsor occupation
Sponsor income
Source of funds
Bank statement
Tuition fee
Living cost
Accommodation
Family background
Study gap
Work history
English test
Previous travel
Previous refusal
Course relevance
Career relevance
Return/future plan
International student motivation
Pre-departure preparation

AI dynamically generates follow-up questions based on answers.

============================================================
13. INTERVIEW RESEARCH ENGINE
============================================================

When generating interview preparation materials:

Use current and reliable sources where permitted.

Research recent patterns from the previous minimum 6 months when sufficient public evidence exists.

Sources may include:

- official immigration/visa authorities
- official university pages
- official government guidance
- publicly available interview guidance
- reputable education sources

Do NOT claim access to confidential embassy interview databases.

Do NOT claim to know exactly what a visa officer will ask.

Do NOT guarantee passing.

Clearly label:

Common Question
Potential Question
Practice Question
Official Requirement
AI-generated Practice Question

Never present speculation as an official embassy question.

============================================================
14. AI INTERVIEW PRACTICE
============================================================

Student receives interview practice.

Practice period:

3 days after interview preparation package is generated/downloaded,
where this business rule is enabled.

During the practice period:

- AI conversation
- voice practice if supported
- question repetition
- follow-up questions
- answer improvement
- pronunciation guidance
- confidence coaching
- funding explanation practice
- future plan practice
- course knowledge practice

Store all attempts.

Compare:

Attempt 1
Attempt 2
Attempt 3
Final attempt

Show improvement.

============================================================
15. HUMAN REVIEW
============================================================

AI provides preliminary evaluation.

Human Visa Interview Officer must review final interview.

Human review fields:

- final officer assessment
- strengths
- weaknesses
- required improvements
- documents required
- second interview required
- escalation required
- readiness decision

Allowed internal statuses:

READY
NEEDS_PRACTICE
NEEDS_DOCUMENTS
HIGH_RISK
HUMAN_REVIEW_REQUIRED

These are internal workflow statuses.

They are NOT visa decisions.

============================================================
16. VISA READINESS ENGINE
============================================================

Score components:

Profile Completion = 10%
Passport = 10%
Academic Documents = 10%
English Test = 10%
Offer/CAS/Application = 10%
Funding/Sponsor = 15%
Bank Statement = 10%
Study Gap = 10%
Interview = 10%
Risk Flags = 5%

Total = 100%

Risk:

LOW
MEDIUM
HIGH
CRITICAL
HUMAN_REVIEW_REQUIRED

The system must explain:

What is strong
What is weak
What is missing
Next action
Responsible person
Suggested deadline

Do not expose internal sensitive risk details to students.

============================================================
17. FUNDING / SPONSOR REVIEW
============================================================

Fields:

Funding Status
Sponsor
Sponsor Relationship
Sponsor Occupation
Sponsor Income
Source of Funds
Bank Statement
Solvency Certificate
Sponsor Documents
Tuition Deposit
Living Cost Plan
Dependents

Risk checks:

Missing bank statement
Missing solvency
Unclear source of funds
Sponsor relationship mismatch
Document mismatch
Insufficient explanation
Dependent funding problem
Unverified scholarship
Missing loan document

Actions:

Request document
Request explanation
Ask counselor
Ask finance
Human review

Every sensitive access must be audited.

============================================================
18. STUDY GAP REVIEW
============================================================

Fields:

Study Gap
From
To
Duration
Purpose
Employment
Training
Family Reason
Medical Reason
Visa Reason
Supporting Documents

AI checks:

Duration
Explanation
Evidence
Career relevance
Course relevance
Education/work consistency

Actions:

Request explanation
Request document
Generate questions
Notify counselor
High-risk flag

============================================================
19. VISA REFUSAL REVIEW
============================================================

Fields:

Previous refusal
Country
Visa type
Date
Reason
Refusal letter
Previous application
Improvements
New explanation
Officer note

AI identifies:

Missing refusal letter
Unclear reason
Repeated refusal
Contradiction
Missing improvement explanation

Actions:

Request refusal letter
Request explanation
Generate practice questions
Notify counselor
Notify senior officer
Human review

Never promise approval.

============================================================
20. SENSITIVE MEDICAL / CRIMINAL REVIEW
============================================================

Sensitive fields must be strictly restricted.

Medical:

condition flag
explanation
document
officer note
student-safe note

Criminal:

offense flag
explanation
document
officer note
student-safe note

Access:

VISA_OFFICER
VISA_INTERVIEW_OFFICER
SUPER_ADMIN
explicitly authorized roles only

Never expose to:

Marketing
Partner
General Employee
Sales
Public
Student normal dashboard

Every:

view
edit
download

must create audit log.

============================================================
21. VISA DOCUMENT CENTER
============================================================

Checklist:

Passport
Photo
Offer Letter
CAS
Academic Certificates
Academic Transcripts
English Test
Bank Statement
Solvency Certificate
Sponsor Letter
Sponsor ID
Sponsor Occupation Proof
Source of Funds
Birth Certificate
Marriage Certificate
Work Experience
Study Gap Evidence
Refusal Letter
TB/Medical
Accommodation
Consent Documents
Visa Application
Biometric Appointment
Payment Receipt
Other Country-specific Documents

Statuses:

NOT_UPLOADED
UPLOADED
PENDING_REVIEW
APPROVED
REJECTED
NEEDS_UPDATE
EXPIRED
NOT_APPLICABLE

Actions:

Request
Approve
Reject
Needs Update
Add Note
Notify Student
Notify Counselor
Timeline Event

Do not permanently delete submitted visa documents.

Use replacement/version history.

============================================================
22. DOCUMENT REQUEST SYSTEM
============================================================

Officer can select missing documents.

Document request must support:

- document name
- reason
- deadline
- priority
- student visibility
- counselor visibility
- notification channel

Student can upload replacement documents.

Previous document versions remain auditable.

Officer cannot silently delete document history.

============================================================
23. TWO-LAYER NOTES
============================================================

Note types:

INTERNAL_ONLY
VISA_TEAM_ONLY
COUNSELOR_VISIBLE
APPLICATION_TEAM_VISIBLE
STUDENT_SAFE_FEEDBACK
SUPER_ADMIN_ONLY

Rules:

Student never sees internal notes.

Partner never sees visa notes.

Marketing never sees visa notes.

Student sees only approved student-safe feedback.

Every edit is audited.

============================================================
24. STUDENT-SAFE FEEDBACK
============================================================

Generate safe feedback from:

Officer notes
AI result
Missing documents
Required practice
Approved action plan

Must be:

supportive
clear
professional
actionable

Never include:

internal risk labels
confidential comments
staff criticism
unsupported claims
visa guarantees

Officer must approve before sending.

Save to:

Student Portal
Timeline
Notifications
Messages

============================================================
25. COMMUNICATION CENTER
============================================================

Connect Visa Dashboard with existing communication engine.

Supported channels where already configured:

Email
WhatsApp
SMS
Portal Message

Officer must be able to:

request document
send approved feedback
notify counselor
message application team
schedule interview notification

All communication must use existing communication/RBAC/consent infrastructure.

Do not create a second messaging engine.

============================================================
26. TASK SYSTEM
============================================================

Task types:

Document Request
Interview
Bank Review
Sponsor Review
Refusal Review
Study Gap Review
Counselor Action
Application Action
Student Action
Senior Review

Each task:

owner
priority
deadline
status
createdBy
caseId
studentId

Overdue tasks appear in dashboard.

============================================================
27. STUDENT PORTAL
============================================================

Student may view:

Visa checklist
Requested documents
Interview schedule
Approved feedback
Safe readiness summary
Next actions
Messages
Appointments
AI practice

Student may NOT view:

Internal notes
Internal risk score details
Sensitive medical/criminal data
Internal refusal analysis
Staff-only comments
Super Admin notes

Do not alter unrelated Student Dashboard functionality.

============================================================
28. COUNSELOR CONNECTION
============================================================

Counselor sees only assigned student's permitted summary:

Visa readiness status
Missing student actions
Student-safe feedback
Counselor tasks
Document request status
Timeline events

No sensitive internal data without explicit permission.

============================================================
29. APPLICATION TEAM CONNECTION
============================================================

Application Team may see:

Offer/CAS related visa stage
Document request status
Visa-stage blockers
Application-related timeline

Only with appropriate permission.

============================================================
30. VISA REPORTS
============================================================

Reports:

Daily Interview
Weekly Readiness
High Risk
Missing Documents
Funding Risk
Study Gap Risk
Refusal History
Officer Performance
Counselor Pending Actions
Visa Pipeline

Export:

PDF
CSV
XLSX if existing system supports it

Sensitive reports require elevated permission.

============================================================
31. DATABASE
============================================================

FIRST inspect existing Prisma/database models.

Reuse existing equivalents.

Only create missing models.

Potential models:

VisaCase
VisaInterview
VisaInterviewQuestion
VisaInterviewAnswer
VisaMockResult
VisaDocument
VisaChecklist
VisaChecklistItem
VisaStatusHistory
VisaReadinessReport
VisaRiskAssessment
VisaRefusal
VisaFundingReview
VisaStudyGapReview
VisaSensitiveReview
VisaOfficerNote
VisaStudentFeedback
VisaTask
VisaReport
AiInterviewSession
AiInterviewQuestion
AiInterviewAnswer
AiInterviewResult
StudentVisaHistory
StudentFunding
StudentPassport
TimelineEvent
Notification
AuditLog

Do not create duplicates if equivalent models already exist.

Required relationships:

Student → VisaCase
Application → VisaCase
VisaCase → Interviews
VisaCase → Documents
VisaCase → Checklist
VisaCase → Notes
VisaCase → Status History
VisaCase → Tasks
VisaCase → Readiness
VisaCase → Risk
VisaCase → Reports

============================================================
32. API
============================================================

FIRST inspect existing APIs.

Add only missing APIs.

Dashboard:

GET /api/visa/dashboard
GET /api/visa/metrics
GET /api/visa/overview

Cases:

GET /api/visa/cases
POST /api/visa/cases
GET /api/visa/cases/:id
PATCH /api/visa/cases/:id
PATCH /api/visa/cases/:id/assign
PATCH /api/visa/cases/:id/stage
PATCH /api/visa/cases/:id/risk-level

Interviews:

GET /api/visa/interviews
POST /api/visa/interviews
GET /api/visa/interviews/:id
PATCH /api/visa/interviews/:id
POST /api/visa/interviews/:id/question
POST /api/visa/interviews/:id/answer
POST /api/visa/interviews/:id/finish
GET /api/visa/interviews/:id/result
GET /api/visa/interviews/:id/transcript
POST /api/visa/interviews/:id/student-feedback

AI:

POST /api/visa/ai-interview/start
POST /api/visa/ai-interview/:sessionId/answer
POST /api/visa/ai-interview/:sessionId/finish
GET /api/visa/ai-interview/:sessionId/result

Documents:

GET /api/visa/documents
POST /api/visa/documents/request
PATCH /api/visa/documents/:id/approve
PATCH /api/visa/documents/:id/reject
PATCH /api/visa/documents/:id/needs-update
GET /api/visa/documents/:id/download

Checklist:

GET /api/visa/checklist/:caseId
POST /api/visa/checklist/:caseId/items
PATCH /api/visa/checklist/items/:id

Readiness:

GET /api/visa/readiness/:caseId
POST /api/visa/readiness/:caseId/calculate
PATCH /api/visa/readiness/:caseId

Risk:

GET /api/visa/risk/:caseId

Funding:

GET /api/visa/funding-review/:caseId
PATCH /api/visa/funding-review/:caseId

Study Gap:

GET /api/visa/study-gap-review/:caseId
PATCH /api/visa/study-gap-review/:caseId

Refusal:

GET /api/visa/refusal-review/:caseId
PATCH /api/visa/refusal-review/:caseId

Sensitive:

GET /api/visa/sensitive-review/:caseId
PATCH /api/visa/sensitive-review/:caseId

Notes:

GET /api/visa/notes/:caseId
POST /api/visa/notes
PATCH /api/visa/notes/:id

Tasks:

GET /api/visa/tasks
POST /api/visa/tasks
PATCH /api/visa/tasks/:id

Reports:

GET /api/visa/reports
POST /api/visa/reports/generate
GET /api/visa/reports/:id/download

Every endpoint:

AUTH
RBAC
OWNERSHIP
VALIDATION
AUDIT
SAFE ERRORS
SENSITIVE FIELD FILTERING

============================================================
33. FRONTEND
============================================================

Reuse existing design system.

Required screens/components if missing:

VisaOfficerDashboard
VisaDashboardMetrics
VisaCasePipeline
VisaCaseTable
VisaCaseDetail
VisaInterviewWorkspace
VisaInterviewQuestionPanel
VisaInterviewTranscript
VisaInterviewScorecard
VisaReadinessScoreCard
VisaRiskPanel
FundingRiskReview
SponsorRiskReview
StudyGapRiskReview
VisaRefusalReview
SensitiveReviewPanel
VisaDocumentChecklist
VisaDocumentReviewTable
VisaOfficerNotes
StudentSafeFeedbackModal
VisaTaskPanel
VisaReports
VisaNotifications

If equivalent components exist:

REUSE THEM.

Do not create duplicate components simply with different filenames.

============================================================
34. UI
============================================================

Follow existing CRM design.

Do not redesign existing CRM.

Use:

White background
ALO Education existing brand
Orange primary actions
Responsive layout
Existing typography
Existing navigation
Existing components

Desktop:

12-column grid.

Tablet:

2-column cards.

Mobile:

1-column.

No:

blank sections
fake charts
fake numbers
dead buttons
broken routes
hardcoded student data

============================================================
35. AUDIT LOG
============================================================

Audit:

View case
Edit case
Assign officer
Change stage
View document
Download document
Approve document
Reject document
Create interview
Answer question
Finish interview
AI interview
Calculate readiness
Update risk
Create note
Edit note
Send feedback
Create task
Send notification
Generate report
Export report
View sensitive information

Audit fields:

auditId
actorUserId
actorRole
action
entityType
entityId
studentId
beforeValue
afterValue
IP
session
timestamp

============================================================
36. SECURITY
============================================================

Implement:

RBAC
ABAC where needed
Backend authorization
Ownership checks
CSRF protection where applicable
Prepared statements/ORM
Input validation
Output encoding
Rate limiting where appropriate
Signed/private document URLs
Protected storage
Encryption for highly sensitive fields where appropriate
Audit logging
Session security
Secure cookies
No client-side trust

Never expose private files using predictable public URLs.

============================================================
37. SECURITY NEGATIVE TESTS
============================================================

PROVE:

1. Visa officer cannot access unassigned case without permission.
2. Counselor cannot access internal notes.
3. Student cannot access officer notes.
4. Marketing cannot access visa-sensitive data.
5. Partner cannot access visa cases.
6. Application team cannot access sensitive medical/criminal fields without permission.
7. Finance cannot modify interview result.
8. Visa officer cannot modify commission.
9. Visa officer cannot access employee salary.
10. Suspended user cannot access dashboard.
11. Public user cannot download visa documents.
12. Direct private-document URL fails without authorization.
13. Every document download is audited.
14. Every readiness update is audited.
15. Sensitive-field access is audited.
16. Cross-student API access is blocked.
17. IDOR attempts are blocked.
18. Unauthorized report export is blocked.
19. Unauthorized bulk actions are blocked.
20. Student cannot modify visa stage.

============================================================
38. NO-DELETION RULES
============================================================

Students cannot delete:

Visa documents
Interview transcripts
Interview results
Officer notes
Timeline records
Visa history
Refusal history
Audit logs

Use:

versioning
replacement
soft delete only where appropriate

Never destroy compliance history.

============================================================
39. AI SAFETY / QUALITY RULES
============================================================

AI must NEVER:

Guarantee visa approval.
Guarantee interview success.
Pretend to be an actual embassy officer.
Claim confidential embassy knowledge.
Invent official requirements.
Invent refusal reasons.
Invent university requirements.
Invent visa policy.
Present speculation as fact.
Automatically make final visa decisions.

AI must:

show uncertainty
cite source when using external current information
flag information requiring manual verification
recommend human review when necessary

============================================================
40. INTERVIEW PREPARATION DOCUMENT
============================================================

Generate an official ALO Education-branded preparation document.

It may contain:

Student information
University
Course
Country
Interview type
Practice questions
Suggested answer framework
Funding questions
Future plan questions
Course questions
University questions
Study gap questions
Refusal questions
Practice guidance
Officer-approved feedback
Next steps

The system must clearly distinguish:

Question
Answer framework
Student's own answer
AI suggestion

Do not encourage memorized false answers.

Students must be guided to answer truthfully and consistently.

============================================================
41. FINANCIAL + FUTURE PLAN ANSWER FRAMEWORK
============================================================

AI can help students structure:

Why this course?
Why this university?
How will tuition be paid?
Who is sponsoring?
What is the sponsor's occupation?
What is the source of funds?
What is the living-cost plan?
What is the career plan?
What will the student do after graduation?

Answers must be based on the student's real information.

Do not fabricate:

salary
bank balance
sponsor income
employment
future job
family assets
travel history
academic history

============================================================
42. VIDEO / VOICE INTERVIEW
============================================================

If existing video/audio infrastructure exists:

reuse it.

Store:

session
timestamp
transcript
audio/video reference
AI analysis
human review

Never automatically capture webcam images.

Camera/microphone require explicit browser permission.

If recording:

show recording status.

Provide appropriate consent.

Do not secretly record.

============================================================
43. STUDENT INTERVIEW PRACTICE
============================================================

Student gets:

AI interview
question-by-question mode
voice/text where supported
follow-up questions
practice history
feedback
retry
progress tracking

AI understands non-native English.

Do not penalize accent alone.

============================================================
44. COMMUNICATION
============================================================

Use existing ALO Communication Center.

Do not create duplicate:

WhatsApp engine
Email engine
SMS engine
notification engine

All outgoing communication must follow:

consent
template
RBAC
audit
delivery status

============================================================
45. TIMELINE
============================================================

Every major Visa event must create timeline event:

Visa Case Created
Checklist Created
Document Requested
Document Uploaded
Document Approved
Document Rejected
Interview Scheduled
AI Interview Started
AI Interview Completed
Officer Interview Completed
Feedback Sent
Readiness Updated
Risk Updated
Task Created
Escalated
Visa Submitted
Decision Updated

Student sees only student-safe events.

Internal timeline visibility follows RBAC.

============================================================
46. REPORTING
============================================================

Dashboard reports:

Total cases
Cases by stage
Readiness distribution
Risk distribution
Interview completion
Document completion
Funding risk
Study gap risk
Refusal history
Officer workload
Counselor pending tasks
Overdue tasks

Use real database data.

============================================================
47. PERFORMANCE
============================================================

Do not load all student records into browser.

Use:

pagination
server-side filters
server-side sorting
lazy loading
proper indexes
query optimization
cached aggregate metrics where appropriate

Avoid N+1 queries.

============================================================
48. ACCESSIBILITY
============================================================

Support:

keyboard navigation
proper labels
ARIA where necessary
visible focus
readable contrast
responsive layout
accessible forms
error messages

============================================================
49. DATA INTEGRITY
============================================================

Prevent:

duplicate VisaCase
duplicate interview sessions
duplicate document requests
duplicate checklist items
duplicate timeline events where logically inappropriate

Use:

unique constraints
foreign keys
transactions
idempotency where necessary

============================================================
50. IMPLEMENTATION PROCESS
============================================================

FOLLOW THIS ORDER:

STEP 1
Audit existing project.

STEP 2
Create audit report.

STEP 3
Map existing visa features.

STEP 4
Map existing database models.

STEP 5
Map existing API routes.

STEP 6
Map existing RBAC.

STEP 7
Map existing student portal.

STEP 8
Map existing communication system.

STEP 9
Map existing document storage.

STEP 10
Identify missing functionality.

STEP 11
Patch database only where required.

STEP 12
Add migrations.

STEP 13
Add backend services.

STEP 14
Add API routes.

STEP 15
Add RBAC.

STEP 16
Add audit logging.

STEP 17
Patch/create dashboard.

STEP 18
Patch interview workspace.

STEP 19
Connect AI interview.

STEP 20
Connect student portal.

STEP 21
Connect counselor/application team.

STEP 22
Connect notifications.

STEP 23
Connect timeline.

STEP 24
Run security tests.

STEP 25
Run integration tests.

STEP 26
Run production build.

STEP 27
Live-test routes.

STEP 28
Live-test APIs.

STEP 29
Verify database records.

STEP 30
Produce evidence-based final report.

============================================================
51. REQUIRED VALIDATION COMMANDS
============================================================

Run the project's actual package-manager commands.

At minimum, where applicable:

npm install
npm run typecheck
npm run lint
npm run build

Prisma:

npx prisma validate
npx prisma generate

If backend/server.js exists:

node --check backend/server.js

If tests exist:

npm test

Run the project's existing test suite.

Do not skip failed tests.

============================================================
52. LIVE TESTING
============================================================

Do not stop at build success.

Test:

Login
RBAC
Dashboard
Cases
Case assignment
Interview
AI interview
Documents
Checklist
Readiness
Funding
Study gap
Refusal
Sensitive data
Notes
Feedback
Tasks
Notifications
Reports
Student portal
Counselor view
Application team view

Test both:

authorized
unauthorized

============================================================
53. DATABASE VERIFICATION
============================================================

Verify:

tables/models exist
relations work
foreign keys work
indexes exist
unique constraints work
audit records are created
document records link to correct student
interview records link to correct case
AI session links to correct student/case
timeline events link correctly
notifications link correctly

============================================================
54. REAL DATA REQUIREMENT
============================================================

The dashboard must use:

real authenticated user
real assigned cases
real database metrics
real API responses
real permissions
real document records
real interview records

No:

fake students
fake KPI
hardcoded cases
placeholder readiness scores
fake interview results

If there is no production data:

show a proper empty state.

============================================================
55. FINAL ACCEPTANCE CRITERIA
============================================================

The system is COMPLETE only when:

[ ] Existing visa system audited
[ ] Existing components reused
[ ] No duplicate visa modules
[ ] Dedicated Visa Interview Officer dashboard exists
[ ] Correct routes work
[ ] RBAC works
[ ] Backend authorization works
[ ] Assigned-case ownership works
[ ] KPI cards use real API
[ ] Visa pipeline works
[ ] Case table works
[ ] Interview workspace works
[ ] AI interview works
[ ] Transcript saved
[ ] Scorecard saved
[ ] Readiness calculated
[ ] Funding review works
[ ] Sponsor review works
[ ] Study gap review works
[ ] Refusal review works
[ ] Sensitive review protected
[ ] Visa checklist works
[ ] Document request works
[ ] Document review works
[ ] Document version history works
[ ] Officer notes visibility works
[ ] Student-safe feedback works
[ ] Approval before feedback send works
[ ] Student portal connection works
[ ] Counselor connection works
[ ] Application team connection works
[ ] Tasks work
[ ] Notifications work
[ ] Timeline works
[ ] Reports work
[ ] Export permissions work
[ ] Audit logging works
[ ] Security negative tests pass
[ ] No cross-student data leakage
[ ] Private documents protected
[ ] No unauthorized sensitive access
[ ] No broken routes
[ ] No API errors
[ ] No console errors
[ ] Typecheck passes
[ ] Lint passes
[ ] Build passes
[ ] Prisma validation passes
[ ] Prisma generation passes
[ ] Live testing completed

============================================================
56. FINAL REPORT FORMAT
============================================================

Return EXACTLY:

SECTION A
EXISTING VISA FEATURES FOUND

List:
Feature
Existing File
Existing Route
Existing API
Existing Model
Status

SECTION B
REUSED COMPONENTS

List every reused component.

SECTION C
MISSING FEATURES ADDED

List exact additions.

SECTION D
ROUTES ADDED / FIXED

List route + status.

SECTION E
APIs ADDED / FIXED

List endpoint + method + status.

SECTION F
DATABASE MODELS / FIELDS

List:
Existing reused
New
Modified
Migration

SECTION G
RBAC

List:
Role
Permission
Result

SECTION H
SECURITY NEGATIVE TESTS

For every test:

TEST
EXPECTED
ACTUAL
PASS/FAIL

SECTION I
STUDENT PORTAL CONNECTION

Show actual routes/API/data flow.

SECTION J
COUNSELOR / APPLICATION TEAM CONNECTION

Show actual routes/API/data flow.

SECTION K
AUDIT LOG PROOF

Show representative audit events.

SECTION L
BUILD / TEST RESULT

Show actual command result.

SECTION M
LIVE TEST RESULT

Show actual tested routes.

SECTION N
REMAINING MISSING ITEMS

List every unresolved issue.

============================================================
57. FINAL STATUS RULE
============================================================

Allowed final statuses:

COMPLETE

OR

NOT COMPLETE

Never write:

"Almost complete"
"Fully implemented" when something is missing
"Production ready" without evidence
"Complete" when only UI exists

COMPLETE is allowed ONLY when all critical acceptance tests pass.

If one critical feature fails:

FINAL STATUS = NOT COMPLETE

Then clearly list:

- missing feature
- broken route
- failing API
- database issue
- RBAC issue
- security issue
- test failure
- exact next action

============================================================
58. MOST IMPORTANT RULE
============================================================

DO NOT GIVE ME A REPETITIVE COMPLETION REPORT.

I do not want:

"Dashboard exists."
"Components exist."
"API exists."

I want EVIDENCE.

For every important feature prove:

FILE
+
ROUTE
+
API
+
DATABASE
+
RBAC
+
LIVE TEST

If any one of these is missing, mark that feature as incomplete.

DO NOT HIDE MISSING WORK.

DO NOT CREATE A NEW CRM.

DO NOT REBUILD WORKING FEATURES.

DO NOT BREAK THE EXISTING STUDENT, COUNSELOR,
APPLICATION, COMMUNICATION, DOCUMENT OR CRM SYSTEM.

PATCH THE EXISTING ALO EDUCATION WEB_CRM.

============================================================
END OF ALO EDUCATION VISA INTERVIEW OFFICER
MASTER IMPLEMENTATION PROMPT
============================================================


VISA INTERVIEW OFFICER + VISA MANAGEMENT SYSTEM
MASTER IMPLEMENTATION / AUDIT / PATCH PROMPT
============================================================

IMPORTANT:

DO NOT REBUILD THE EXISTING PROJECT.

DO NOT CREATE A NEW PROJECT.

DO NOT REPLACE THE EXISTING CRM.

DO NOT DELETE WORKING FEATURES.

DO NOT DUPLICATE EXISTING VISA COMPONENTS.

DO NOT CREATE FAKE DASHBOARDS.

DO NOT USE HARDCODED DEMO DATA.

DO NOT CLAIM COMPLETE WITHOUT LIVE TEST EVIDENCE.

WORK INSIDE THE EXISTING ALO EDUCATION WEB_CRM PROJECT.

============================================================
1. PRIMARY OBJECTIVE
============================================================

Build, complete, repair and integrate the complete:

ALO EDUCATION VISA INTERVIEW OFFICER SYSTEM

inside the existing Web CRM.

The system must connect:

Student
→ Application
→ Offer Letter
→ University
→ Course
→ Documents
→ Finance/Funding
→ Sponsor
→ Study Gap
→ Previous Refusal
→ Visa Checklist
→ Interview Preparation
→ AI Interview
→ Human Visa Interview Officer
→ Visa Readiness
→ Visa Submission
→ Decision
→ Student Portal
→ Counselor
→ Application Team
→ Super Admin

The Visa Interview Officer must have a dedicated, properly routed,
RBAC-protected, API-backed and database-backed workspace.

The feature MUST NOT exist only inside CounselorPortal.

============================================================
2. FIRST ACTION: FULL EXISTING PROJECT AUDIT
============================================================

BEFORE WRITING CODE:

Scan the entire existing project.

Inspect:

- frontend
- backend
- routes
- API routes
- database
- Prisma schema
- migrations
- authentication
- RBAC
- permissions
- existing dashboards
- student portal
- counselor portal
- application system
- document system
- communication system
- timeline
- notifications
- AI systems
- interview systems
- existing visa modules
- reports
- audit logs
- file storage
- existing exports

Search for all existing visa-related implementations.

Search terms must include:

visa
Visa
VISA
interview
Interview
credibility
pre-CAS
CAS
UKVI
embassy
mock interview
visa readiness
visa score
visa risk
funding
sponsor
solvency
bank statement
study gap
refusal
visa document
visa checklist
passport
medical
criminal
visa officer
visa case

For every existing feature classify it:

FULLY_BUILT
PARTIALLY_BUILT
UI_ONLY
BACKEND_MISSING
API_MISSING
DATABASE_MISSING
RBAC_MISSING
ROUTE_BROKEN
AUDIT_MISSING
SECURITY_MISSING
INTEGRATION_MISSING
NOT_FOUND

Create an internal audit matrix before implementation.

Example:

Feature | Existing Location | Status | Reuse/Patch/Build

DO NOT rebuild anything marked FULLY_BUILT.

Reuse existing models/components wherever possible.

If an existing model already provides the same functionality,
extend it instead of creating a duplicate model.

============================================================
3. REQUIRED ROUTES
============================================================

CRM:

/crm/visa
/crm/visa-dashboard
/crm/visa-cases
/crm/visa-interviews
/crm/visa-readiness
/crm/visa-reports

Employee:

/employee/visa-dashboard
/employee/visa-officer
/employee/visa-interview-officer
/employee/visa-cases
/employee/visa-interviews
/employee/visa-documents
/employee/visa-readiness
/employee/visa-reports

Interview:

/employee/visa-interviews/:caseId
/crm/visa-interviews/:caseId

Student:

/student/visa
/student/visa-checklist
/student/ai-interview
/student/visa-interview-practice

Do not create duplicate routes if equivalent routes already exist.

Instead map existing routes correctly.

============================================================
4. RBAC
============================================================

Required roles:

VISA_OFFICER
VISA_INTERVIEW_OFFICER
VISA_TEAM
SUPER_ADMIN
ADMIN
COUNSELOR
APPLICATION_TEAM

Permissions:

visa.dashboard.view
visa.cases.view
visa.cases.assigned.view
visa.cases.update
visa.cases.assign
visa.cases.stage.update

visa.interviews.view
visa.interviews.create
visa.interviews.update
visa.interviews.finish
visa.interviews.export

visa.ai_interview.start
visa.ai_interview.answer
visa.ai_interview.finish
visa.ai_interview.result

visa.documents.view
visa.documents.review
visa.documents.request
visa.documents.download
visa.documents.approve
visa.documents.reject

visa.readiness.view
visa.readiness.calculate
visa.readiness.update

visa.risk.view
visa.risk.update

visa.funding.view
visa.funding.update

visa.study_gap.view
visa.study_gap.update

visa.refusal.view
visa.refusal.update

visa.sensitive.view
visa.sensitive.update

visa.notes.create
visa.notes.internal.create
visa.notes.student_feedback.create
visa.notes.edit

visa.tasks.view
visa.tasks.create
visa.tasks.update

visa.reports.view
visa.reports.generate
visa.reports.export

visa.super_review.request

IMPORTANT:

Frontend hiding is NOT security.

Every protected backend API must enforce:

Authentication
+
RBAC
+
Case ownership/assignment
+
Data visibility
+
Sensitive-field filtering
+
Audit logging

============================================================
5. VISA INTERVIEW OFFICER DASHBOARD
============================================================

Create a dedicated mission-control dashboard.

Header:

- Welcome back, {name}
- VISA_INTERVIEW_OFFICER badge
- Today interviews
- Assigned cases
- High-risk cases
- Pending documents
- Notifications
- Messages
- Language switch
- Logout

Quick Actions:

- View Visa Cases
- Start Interview
- Review Documents
- Generate Readiness Report
- Message Counselor
- Schedule Interview
- Export Report
- Escalate Case

Every button must perform a real action.

No dead buttons.

============================================================
6. KPI SYSTEM
============================================================

Display real API-driven KPI cards:

Assigned Visa Cases
Interview Queue
High-Risk Students
Documents Pending
Visa Readiness
Financial Risk
Refusal History
Counselor Handover

Each card:

- real number
- API source
- trend where available
- status
- loading state
- empty state
- error state
- action button

No fake numbers.

============================================================
7. VISA CASE PIPELINE
============================================================

Stages:

NOT_STARTED
CHECKLIST_CREATED
DOCUMENTS_REQUESTED
DOCUMENTS_UPLOADED
DOCUMENTS_UNDER_REVIEW
MISSING_DOCUMENTS
AI_INTERVIEW_PENDING
AI_INTERVIEW_COMPLETED
OFFICER_REVIEW_PENDING
OFFICER_FEEDBACK_SENT
READY_FOR_VISA_APPLICATION
VISA_SUBMITTED
DECISION_PENDING
APPROVED
REFUSED
CLOSED

Case card:

- Visa Case ID
- Student ID
- Student name
- destination
- university
- course
- intake
- counselor
- application officer
- visa officer
- current stage
- readiness
- risk
- missing documents
- next action
- last update

Actions:

View
Interview
Review Documents
Add Note
Request Document
Send Feedback
Message Counselor
Generate Report
Escalate

============================================================
8. ASSIGNED VISA CASE TABLE
============================================================

Filters:

- Student ID
- Student name
- country
- university
- course
- intake
- counselor
- application officer
- risk
- readiness
- documents
- interview status
- visa status
- date range

Columns:

Visa Case ID
Student ID
Name
Country
University
Course
Intake
Counselor
Application Officer
Interview Status
Document Status
Readiness
Risk
Visa Status
Last Updated
Actions

Bulk operations must be permission-controlled.

============================================================
9. VISA INTERVIEW WORKSPACE
============================================================

Route:

/employee/visa-interviews/:caseId

Sections:

A. Student Summary

B. Application Summary

C. University/Course Summary

D. Profile Risk

E. Financial/Sponsor Review

F. Study Gap Review

G. Refusal Review

H. Visa Checklist

I. Interview Script

J. Live Transcript

K. Officer Notes

L. Student-Safe Feedback

M. Scorecard

N. AI Recommendations

O. Tasks

P. Timeline

Q. Final Result

============================================================
10. INTERVIEW SCORECARD
============================================================

Score:

Communication Clarity
Confidence
Course Knowledge
University Knowledge
Country Knowledge
Financial Explanation
Sponsor Explanation
Study Gap Explanation
Future Plan
Refusal Explanation
Document Readiness
Overall Readiness

Do NOT allow AI to make a final visa decision.

AI provides preliminary analysis only.

Human Visa Interview Officer remains responsible for final internal assessment.

============================================================
11. AI VISA INTERVIEW
============================================================

Interview types:

Embassy Visa Interview
Credibility Interview
Pre-CAS Interview
University Interview
Sponsor/Funding Interview
Study Gap Interview
Previous Refusal Interview
English Speaking Interview
Final Visa Readiness Interview

AI must:

- ask naturally
- ask one question at a time
- wait for answer
- ask relevant follow-up questions
- detect incomplete answers
- identify contradictions
- identify memorized answers
- identify weak explanations
- identify unclear funding explanation
- identify weak course knowledge
- identify weak university knowledge
- identify weak future plan
- identify refusal explanation gaps

Do not judge solely by grammar.

The AI must understand:

- Bangladeshi English accents
- broken English
- Banglish
- pauses
- incomplete pronunciation
- non-native English patterns

Do NOT penalize a student simply for having a Bangladeshi accent.

Evaluate:

meaning
clarity
consistency
relevance
confidence
understanding

rather than accent alone.

============================================================
12. INTERVIEW QUESTION ENGINE
============================================================

Question categories:

Introduction
Why this country?
Why this university?
Why this course?
Why not Bangladesh?
Course modules
Career plan
Future plan
Funding
Sponsor
Sponsor occupation
Sponsor income
Source of funds
Bank statement
Tuition fee
Living cost
Accommodation
Family background
Study gap
Work history
English test
Previous travel
Previous refusal
Course relevance
Career relevance
Return/future plan
International student motivation
Pre-departure preparation

AI dynamically generates follow-up questions based on answers.

============================================================
13. INTERVIEW RESEARCH ENGINE
============================================================

When generating interview preparation materials:

Use current and reliable sources where permitted.

Research recent patterns from the previous minimum 6 months when sufficient public evidence exists.

Sources may include:

- official immigration/visa authorities
- official university pages
- official government guidance
- publicly available interview guidance
- reputable education sources

Do NOT claim access to confidential embassy interview databases.

Do NOT claim to know exactly what a visa officer will ask.

Do NOT guarantee passing.

Clearly label:

Common Question
Potential Question
Practice Question
Official Requirement
AI-generated Practice Question

Never present speculation as an official embassy question.

============================================================
14. AI INTERVIEW PRACTICE
============================================================

Student receives interview practice.

Practice period:

3 days after interview preparation package is generated/downloaded,
where this business rule is enabled.

During the practice period:

- AI conversation
- voice practice if supported
- question repetition
- follow-up questions
- answer improvement
- pronunciation guidance
- confidence coaching
- funding explanation practice
- future plan practice
- course knowledge practice

Store all attempts.

Compare:

Attempt 1
Attempt 2
Attempt 3
Final attempt

Show improvement.

============================================================
15. HUMAN REVIEW
============================================================

AI provides preliminary evaluation.

Human Visa Interview Officer must review final interview.

Human review fields:

- final officer assessment
- strengths
- weaknesses
- required improvements
- documents required
- second interview required
- escalation required
- readiness decision

Allowed internal statuses:

READY
NEEDS_PRACTICE
NEEDS_DOCUMENTS
HIGH_RISK
HUMAN_REVIEW_REQUIRED

These are internal workflow statuses.

They are NOT visa decisions.

============================================================
16. VISA READINESS ENGINE
============================================================

Score components:

Profile Completion = 10%
Passport = 10%
Academic Documents = 10%
English Test = 10%
Offer/CAS/Application = 10%
Funding/Sponsor = 15%
Bank Statement = 10%
Study Gap = 10%
Interview = 10%
Risk Flags = 5%

Total = 100%

Risk:

LOW
MEDIUM
HIGH
CRITICAL
HUMAN_REVIEW_REQUIRED

The system must explain:

What is strong
What is weak
What is missing
Next action
Responsible person
Suggested deadline

Do not expose internal sensitive risk details to students.

============================================================
17. FUNDING / SPONSOR REVIEW
============================================================

Fields:

Funding Status
Sponsor
Sponsor Relationship
Sponsor Occupation
Sponsor Income
Source of Funds
Bank Statement
Solvency Certificate
Sponsor Documents
Tuition Deposit
Living Cost Plan
Dependents

Risk checks:

Missing bank statement
Missing solvency
Unclear source of funds
Sponsor relationship mismatch
Document mismatch
Insufficient explanation
Dependent funding problem
Unverified scholarship
Missing loan document

Actions:

Request document
Request explanation
Ask counselor
Ask finance
Human review

Every sensitive access must be audited.

============================================================
18. STUDY GAP REVIEW
============================================================

Fields:

Study Gap
From
To
Duration
Purpose
Employment
Training
Family Reason
Medical Reason
Visa Reason
Supporting Documents

AI checks:

Duration
Explanation
Evidence
Career relevance
Course relevance
Education/work consistency

Actions:

Request explanation
Request document
Generate questions
Notify counselor
High-risk flag

============================================================
19. VISA REFUSAL REVIEW
============================================================

Fields:

Previous refusal
Country
Visa type
Date
Reason
Refusal letter
Previous application
Improvements
New explanation
Officer note

AI identifies:

Missing refusal letter
Unclear reason
Repeated refusal
Contradiction
Missing improvement explanation

Actions:

Request refusal letter
Request explanation
Generate practice questions
Notify counselor
Notify senior officer
Human review

Never promise approval.

============================================================
20. SENSITIVE MEDICAL / CRIMINAL REVIEW
============================================================

Sensitive fields must be strictly restricted.

Medical:

condition flag
explanation
document
officer note
student-safe note

Criminal:

offense flag
explanation
document
officer note
student-safe note

Access:

VISA_OFFICER
VISA_INTERVIEW_OFFICER
SUPER_ADMIN
explicitly authorized roles only

Never expose to:

Marketing
Partner
General Employee
Sales
Public
Student normal dashboard

Every:

view
edit
download

must create audit log.

============================================================
21. VISA DOCUMENT CENTER
============================================================

Checklist:

Passport
Photo
Offer Letter
CAS
Academic Certificates
Academic Transcripts
English Test
Bank Statement
Solvency Certificate
Sponsor Letter
Sponsor ID
Sponsor Occupation Proof
Source of Funds
Birth Certificate
Marriage Certificate
Work Experience
Study Gap Evidence
Refusal Letter
TB/Medical
Accommodation
Consent Documents
Visa Application
Biometric Appointment
Payment Receipt
Other Country-specific Documents

Statuses:

NOT_UPLOADED
UPLOADED
PENDING_REVIEW
APPROVED
REJECTED
NEEDS_UPDATE
EXPIRED
NOT_APPLICABLE

Actions:

Request
Approve
Reject
Needs Update
Add Note
Notify Student
Notify Counselor
Timeline Event

Do not permanently delete submitted visa documents.

Use replacement/version history.

============================================================
22. DOCUMENT REQUEST SYSTEM
============================================================

Officer can select missing documents.

Document request must support:

- document name
- reason
- deadline
- priority
- student visibility
- counselor visibility
- notification channel

Student can upload replacement documents.

Previous document versions remain auditable.

Officer cannot silently delete document history.

============================================================
23. TWO-LAYER NOTES
============================================================

Note types:

INTERNAL_ONLY
VISA_TEAM_ONLY
COUNSELOR_VISIBLE
APPLICATION_TEAM_VISIBLE
STUDENT_SAFE_FEEDBACK
SUPER_ADMIN_ONLY

Rules:

Student never sees internal notes.

Partner never sees visa notes.

Marketing never sees visa notes.

Student sees only approved student-safe feedback.

Every edit is audited.

============================================================
24. STUDENT-SAFE FEEDBACK
============================================================

Generate safe feedback from:

Officer notes
AI result
Missing documents
Required practice
Approved action plan

Must be:

supportive
clear
professional
actionable

Never include:

internal risk labels
confidential comments
staff criticism
unsupported claims
visa guarantees

Officer must approve before sending.

Save to:

Student Portal
Timeline
Notifications
Messages

============================================================
25. COMMUNICATION CENTER
============================================================

Connect Visa Dashboard with existing communication engine.

Supported channels where already configured:

Email
WhatsApp
SMS
Portal Message

Officer must be able to:

request document
send approved feedback
notify counselor
message application team
schedule interview notification

All communication must use existing communication/RBAC/consent infrastructure.

Do not create a second messaging engine.

============================================================
26. TASK SYSTEM
============================================================

Task types:

Document Request
Interview
Bank Review
Sponsor Review
Refusal Review
Study Gap Review
Counselor Action
Application Action
Student Action
Senior Review

Each task:

owner
priority
deadline
status
createdBy
caseId
studentId

Overdue tasks appear in dashboard.

============================================================
27. STUDENT PORTAL
============================================================

Student may view:

Visa checklist
Requested documents
Interview schedule
Approved feedback
Safe readiness summary
Next actions
Messages
Appointments
AI practice

Student may NOT view:

Internal notes
Internal risk score details
Sensitive medical/criminal data
Internal refusal analysis
Staff-only comments
Super Admin notes

Do not alter unrelated Student Dashboard functionality.

============================================================
28. COUNSELOR CONNECTION
============================================================

Counselor sees only assigned student's permitted summary:

Visa readiness status
Missing student actions
Student-safe feedback
Counselor tasks
Document request status
Timeline events

No sensitive internal data without explicit permission.

============================================================
29. APPLICATION TEAM CONNECTION
============================================================

Application Team may see:

Offer/CAS related visa stage
Document request status
Visa-stage blockers
Application-related timeline

Only with appropriate permission.

============================================================
30. VISA REPORTS
============================================================

Reports:

Daily Interview
Weekly Readiness
High Risk
Missing Documents
Funding Risk
Study Gap Risk
Refusal History
Officer Performance
Counselor Pending Actions
Visa Pipeline

Export:

PDF
CSV
XLSX if existing system supports it

Sensitive reports require elevated permission.

============================================================
31. DATABASE
============================================================

FIRST inspect existing Prisma/database models.

Reuse existing equivalents.

Only create missing models.

Potential models:

VisaCase
VisaInterview
VisaInterviewQuestion
VisaInterviewAnswer
VisaMockResult
VisaDocument
VisaChecklist
VisaChecklistItem
VisaStatusHistory
VisaReadinessReport
VisaRiskAssessment
VisaRefusal
VisaFundingReview
VisaStudyGapReview
VisaSensitiveReview
VisaOfficerNote
VisaStudentFeedback
VisaTask
VisaReport
AiInterviewSession
AiInterviewQuestion
AiInterviewAnswer
AiInterviewResult
StudentVisaHistory
StudentFunding
StudentPassport
TimelineEvent
Notification
AuditLog

Do not create duplicates if equivalent models already exist.

Required relationships:

Student → VisaCase
Application → VisaCase
VisaCase → Interviews
VisaCase → Documents
VisaCase → Checklist
VisaCase → Notes
VisaCase → Status History
VisaCase → Tasks
VisaCase → Readiness
VisaCase → Risk
VisaCase → Reports

============================================================
32. API
============================================================

FIRST inspect existing APIs.

Add only missing APIs.

Dashboard:

GET /api/visa/dashboard
GET /api/visa/metrics
GET /api/visa/overview

Cases:

GET /api/visa/cases
POST /api/visa/cases
GET /api/visa/cases/:id
PATCH /api/visa/cases/:id
PATCH /api/visa/cases/:id/assign
PATCH /api/visa/cases/:id/stage
PATCH /api/visa/cases/:id/risk-level

Interviews:

GET /api/visa/interviews
POST /api/visa/interviews
GET /api/visa/interviews/:id
PATCH /api/visa/interviews/:id
POST /api/visa/interviews/:id/question
POST /api/visa/interviews/:id/answer
POST /api/visa/interviews/:id/finish
GET /api/visa/interviews/:id/result
GET /api/visa/interviews/:id/transcript
POST /api/visa/interviews/:id/student-feedback

AI:

POST /api/visa/ai-interview/start
POST /api/visa/ai-interview/:sessionId/answer
POST /api/visa/ai-interview/:sessionId/finish
GET /api/visa/ai-interview/:sessionId/result

Documents:

GET /api/visa/documents
POST /api/visa/documents/request
PATCH /api/visa/documents/:id/approve
PATCH /api/visa/documents/:id/reject
PATCH /api/visa/documents/:id/needs-update
GET /api/visa/documents/:id/download

Checklist:

GET /api/visa/checklist/:caseId
POST /api/visa/checklist/:caseId/items
PATCH /api/visa/checklist/items/:id

Readiness:

GET /api/visa/readiness/:caseId
POST /api/visa/readiness/:caseId/calculate
PATCH /api/visa/readiness/:caseId

Risk:

GET /api/visa/risk/:caseId

Funding:

GET /api/visa/funding-review/:caseId
PATCH /api/visa/funding-review/:caseId

Study Gap:

GET /api/visa/study-gap-review/:caseId
PATCH /api/visa/study-gap-review/:caseId

Refusal:

GET /api/visa/refusal-review/:caseId
PATCH /api/visa/refusal-review/:caseId

Sensitive:

GET /api/visa/sensitive-review/:caseId
PATCH /api/visa/sensitive-review/:caseId

Notes:

GET /api/visa/notes/:caseId
POST /api/visa/notes
PATCH /api/visa/notes/:id

Tasks:

GET /api/visa/tasks
POST /api/visa/tasks
PATCH /api/visa/tasks/:id

Reports:

GET /api/visa/reports
POST /api/visa/reports/generate
GET /api/visa/reports/:id/download

Every endpoint:

AUTH
RBAC
OWNERSHIP
VALIDATION
AUDIT
SAFE ERRORS
SENSITIVE FIELD FILTERING

============================================================
33. FRONTEND
============================================================

Reuse existing design system.

Required screens/components if missing:

VisaOfficerDashboard
VisaDashboardMetrics
VisaCasePipeline
VisaCaseTable
VisaCaseDetail
VisaInterviewWorkspace
VisaInterviewQuestionPanel
VisaInterviewTranscript
VisaInterviewScorecard
VisaReadinessScoreCard
VisaRiskPanel
FundingRiskReview
SponsorRiskReview
StudyGapRiskReview
VisaRefusalReview
SensitiveReviewPanel
VisaDocumentChecklist
VisaDocumentReviewTable
VisaOfficerNotes
StudentSafeFeedbackModal
VisaTaskPanel
VisaReports
VisaNotifications

If equivalent components exist:

REUSE THEM.

Do not create duplicate components simply with different filenames.

============================================================
34. UI
============================================================

Follow existing CRM design.

Do not redesign existing CRM.

Use:

White background
ALO Education existing brand
Orange primary actions
Responsive layout
Existing typography
Existing navigation
Existing components

Desktop:

12-column grid.

Tablet:

2-column cards.

Mobile:

1-column.

No:

blank sections
fake charts
fake numbers
dead buttons
broken routes
hardcoded student data

============================================================
35. AUDIT LOG
============================================================

Audit:

View case
Edit case
Assign officer
Change stage
View document
Download document
Approve document
Reject document
Create interview
Answer question
Finish interview
AI interview
Calculate readiness
Update risk
Create note
Edit note
Send feedback
Create task
Send notification
Generate report
Export report
View sensitive information

Audit fields:

auditId
actorUserId
actorRole
action
entityType
entityId
studentId
beforeValue
afterValue
IP
session
timestamp

============================================================
36. SECURITY
============================================================

Implement:

RBAC
ABAC where needed
Backend authorization
Ownership checks
CSRF protection where applicable
Prepared statements/ORM
Input validation
Output encoding
Rate limiting where appropriate
Signed/private document URLs
Protected storage
Encryption for highly sensitive fields where appropriate
Audit logging
Session security
Secure cookies
No client-side trust

Never expose private files using predictable public URLs.

============================================================
37. SECURITY NEGATIVE TESTS
============================================================

PROVE:

1. Visa officer cannot access unassigned case without permission.
2. Counselor cannot access internal notes.
3. Student cannot access officer notes.
4. Marketing cannot access visa-sensitive data.
5. Partner cannot access visa cases.
6. Application team cannot access sensitive medical/criminal fields without permission.
7. Finance cannot modify interview result.
8. Visa officer cannot modify commission.
9. Visa officer cannot access employee salary.
10. Suspended user cannot access dashboard.
11. Public user cannot download visa documents.
12. Direct private-document URL fails without authorization.
13. Every document download is audited.
14. Every readiness update is audited.
15. Sensitive-field access is audited.
16. Cross-student API access is blocked.
17. IDOR attempts are blocked.
18. Unauthorized report export is blocked.
19. Unauthorized bulk actions are blocked.
20. Student cannot modify visa stage.

============================================================
38. NO-DELETION RULES
============================================================

Students cannot delete:

Visa documents
Interview transcripts
Interview results
Officer notes
Timeline records
Visa history
Refusal history
Audit logs

Use:

versioning
replacement
soft delete only where appropriate

Never destroy compliance history.

============================================================
39. AI SAFETY / QUALITY RULES
============================================================

AI must NEVER:

Guarantee visa approval.
Guarantee interview success.
Pretend to be an actual embassy officer.
Claim confidential embassy knowledge.
Invent official requirements.
Invent refusal reasons.
Invent university requirements.
Invent visa policy.
Present speculation as fact.
Automatically make final visa decisions.

AI must:

show uncertainty
cite source when using external current information
flag information requiring manual verification
recommend human review when necessary

============================================================
40. INTERVIEW PREPARATION DOCUMENT
============================================================

Generate an official ALO Education-branded preparation document.

It may contain:

Student information
University
Course
Country
Interview type
Practice questions
Suggested answer framework
Funding questions
Future plan questions
Course questions
University questions
Study gap questions
Refusal questions
Practice guidance
Officer-approved feedback
Next steps

The system must clearly distinguish:

Question
Answer framework
Student's own answer
AI suggestion

Do not encourage memorized false answers.

Students must be guided to answer truthfully and consistently.

============================================================
41. FINANCIAL + FUTURE PLAN ANSWER FRAMEWORK
============================================================

AI can help students structure:

Why this course?
Why this university?
How will tuition be paid?
Who is sponsoring?
What is the sponsor's occupation?
What is the source of funds?
What is the living-cost plan?
What is the career plan?
What will the student do after graduation?

Answers must be based on the student's real information.

Do not fabricate:

salary
bank balance
sponsor income
employment
future job
family assets
travel history
academic history

============================================================
42. VIDEO / VOICE INTERVIEW
============================================================

If existing video/audio infrastructure exists:

reuse it.

Store:

session
timestamp
transcript
audio/video reference
AI analysis
human review

Never automatically capture webcam images.

Camera/microphone require explicit browser permission.

If recording:

show recording status.

Provide appropriate consent.

Do not secretly record.

============================================================
43. STUDENT INTERVIEW PRACTICE
============================================================

Student gets:

AI interview
question-by-question mode
voice/text where supported
follow-up questions
practice history
feedback
retry
progress tracking

AI understands non-native English.

Do not penalize accent alone.

============================================================
44. COMMUNICATION
============================================================

Use existing ALO Communication Center.

Do not create duplicate:

WhatsApp engine
Email engine
SMS engine
notification engine

All outgoing communication must follow:

consent
template
RBAC
audit
delivery status

============================================================
45. TIMELINE
============================================================

Every major Visa event must create timeline event:

Visa Case Created
Checklist Created
Document Requested
Document Uploaded
Document Approved
Document Rejected
Interview Scheduled
AI Interview Started
AI Interview Completed
Officer Interview Completed
Feedback Sent
Readiness Updated
Risk Updated
Task Created
Escalated
Visa Submitted
Decision Updated

Student sees only student-safe events.

Internal timeline visibility follows RBAC.

============================================================
46. REPORTING
============================================================

Dashboard reports:

Total cases
Cases by stage
Readiness distribution
Risk distribution
Interview completion
Document completion
Funding risk
Study gap risk
Refusal history
Officer workload
Counselor pending tasks
Overdue tasks

Use real database data.

============================================================
47. PERFORMANCE
============================================================

Do not load all student records into browser.

Use:

pagination
server-side filters
server-side sorting
lazy loading
proper indexes
query optimization
cached aggregate metrics where appropriate

Avoid N+1 queries.

============================================================
48. ACCESSIBILITY
============================================================

Support:

keyboard navigation
proper labels
ARIA where necessary
visible focus
readable contrast
responsive layout
accessible forms
error messages

============================================================
49. DATA INTEGRITY
============================================================

Prevent:

duplicate VisaCase
duplicate interview sessions
duplicate document requests
duplicate checklist items
duplicate timeline events where logically inappropriate

Use:

unique constraints
foreign keys
transactions
idempotency where necessary

============================================================
50. IMPLEMENTATION PROCESS
============================================================

FOLLOW THIS ORDER:

STEP 1
Audit existing project.

STEP 2
Create audit report.

STEP 3
Map existing visa features.

STEP 4
Map existing database models.

STEP 5
Map existing API routes.

STEP 6
Map existing RBAC.

STEP 7
Map existing student portal.

STEP 8
Map existing communication system.

STEP 9
Map existing document storage.

STEP 10
Identify missing functionality.

STEP 11
Patch database only where required.

STEP 12
Add migrations.

STEP 13
Add backend services.

STEP 14
Add API routes.

STEP 15
Add RBAC.

STEP 16
Add audit logging.

STEP 17
Patch/create dashboard.

STEP 18
Patch interview workspace.

STEP 19
Connect AI interview.

STEP 20
Connect student portal.

STEP 21
Connect counselor/application team.

STEP 22
Connect notifications.

STEP 23
Connect timeline.

STEP 24
Run security tests.

STEP 25
Run integration tests.

STEP 26
Run production build.

STEP 27
Live-test routes.

STEP 28
Live-test APIs.

STEP 29
Verify database records.

STEP 30
Produce evidence-based final report.

============================================================
51. REQUIRED VALIDATION COMMANDS
============================================================

Run the project's actual package-manager commands.

At minimum, where applicable:

npm install
npm run typecheck
npm run lint
npm run build

Prisma:

npx prisma validate
npx prisma generate

If backend/server.js exists:

node --check backend/server.js

If tests exist:

npm test

Run the project's existing test suite.

Do not skip failed tests.

============================================================
52. LIVE TESTING
============================================================

Do not stop at build success.

Test:

Login
RBAC
Dashboard
Cases
Case assignment
Interview
AI interview
Documents
Checklist
Readiness
Funding
Study gap
Refusal
Sensitive data
Notes
Feedback
Tasks
Notifications
Reports
Student portal
Counselor view
Application team view

Test both:

authorized
unauthorized

============================================================
53. DATABASE VERIFICATION
============================================================

Verify:

tables/models exist
relations work
foreign keys work
indexes exist
unique constraints work
audit records are created
document records link to correct student
interview records link to correct case
AI session links to correct student/case
timeline events link correctly
notifications link correctly

============================================================
54. REAL DATA REQUIREMENT
============================================================

The dashboard must use:

real authenticated user
real assigned cases
real database metrics
real API responses
real permissions
real document records
real interview records

No:

fake students
fake KPI
hardcoded cases
placeholder readiness scores
fake interview results

If there is no production data:

show a proper empty state.

============================================================
55. FINAL ACCEPTANCE CRITERIA
============================================================

The system is COMPLETE only when:

[ ] Existing visa system audited
[ ] Existing components reused
[ ] No duplicate visa modules
[ ] Dedicated Visa Interview Officer dashboard exists
[ ] Correct routes work
[ ] RBAC works
[ ] Backend authorization works
[ ] Assigned-case ownership works
[ ] KPI cards use real API
[ ] Visa pipeline works
[ ] Case table works
[ ] Interview workspace works
[ ] AI interview works
[ ] Transcript saved
[ ] Scorecard saved
[ ] Readiness calculated
[ ] Funding review works
[ ] Sponsor review works
[ ] Study gap review works
[ ] Refusal review works
[ ] Sensitive review protected
[ ] Visa checklist works
[ ] Document request works
[ ] Document review works
[ ] Document version history works
[ ] Officer notes visibility works
[ ] Student-safe feedback works
[ ] Approval before feedback send works
[ ] Student portal connection works
[ ] Counselor connection works
[ ] Application team connection works
[ ] Tasks work
[ ] Notifications work
[ ] Timeline works
[ ] Reports work
[ ] Export permissions work
[ ] Audit logging works
[ ] Security negative tests pass
[ ] No cross-student data leakage
[ ] Private documents protected
[ ] No unauthorized sensitive access
[ ] No broken routes
[ ] No API errors
[ ] No console errors
[ ] Typecheck passes
[ ] Lint passes
[ ] Build passes
[ ] Prisma validation passes
[ ] Prisma generation passes
[ ] Live testing completed

============================================================
56. FINAL REPORT FORMAT
============================================================

Return EXACTLY:

SECTION A
EXISTING VISA FEATURES FOUND

List:
Feature
Existing File
Existing Route
Existing API
Existing Model
Status

SECTION B
REUSED COMPONENTS

List every reused component.

SECTION C
MISSING FEATURES ADDED

List exact additions.

SECTION D
ROUTES ADDED / FIXED

List route + status.

SECTION E
APIs ADDED / FIXED

List endpoint + method + status.

SECTION F
DATABASE MODELS / FIELDS

List:
Existing reused
New
Modified
Migration

SECTION G
RBAC

List:
Role
Permission
Result

SECTION H
SECURITY NEGATIVE TESTS

For every test:

TEST
EXPECTED
ACTUAL
PASS/FAIL

SECTION I
STUDENT PORTAL CONNECTION

Show actual routes/API/data flow.

SECTION J
COUNSELOR / APPLICATION TEAM CONNECTION

Show actual routes/API/data flow.

SECTION K
AUDIT LOG PROOF

Show representative audit events.

SECTION L
BUILD / TEST RESULT

Show actual command result.

SECTION M
LIVE TEST RESULT

Show actual tested routes.

SECTION N
REMAINING MISSING ITEMS

List every unresolved issue.

============================================================
57. FINAL STATUS RULE
============================================================

Allowed final statuses:

COMPLETE

OR

NOT COMPLETE

Never write:

"Almost complete"
"Fully implemented" when something is missing
"Production ready" without evidence
"Complete" when only UI exists

COMPLETE is allowed ONLY when all critical acceptance tests pass.

If one critical feature fails:

FINAL STATUS = NOT COMPLETE

Then clearly list:

- missing feature
- broken route
- failing API
- database issue
- RBAC issue
- security issue
- test failure
- exact next action

============================================================
58. MOST IMPORTANT RULE
============================================================

DO NOT GIVE ME A REPETITIVE COMPLETION REPORT.

I do not want:

"Dashboard exists."
"Components exist."
"API exists."

I want EVIDENCE.

For every important feature prove:

FILE
+
ROUTE
+
API
+
DATABASE
+
RBAC
+
LIVE TEST

If any one of these is missing, mark that feature as incomplete.

DO NOT HIDE MISSING WORK.

DO NOT CREATE A NEW CRM.

DO NOT REBUILD WORKING FEATURES.

DO NOT BREAK THE EXISTING STUDENT, COUNSELOR,
APPLICATION, COMMUNICATION, DOCUMENT OR CRM SYSTEM.

PATCH THE EXISTING ALO EDUCATION WEB_CRM.

============================================================
END OF ALO EDUCATION VISA INTERVIEW OFFICER
MASTER IMPLEMENTATION PROMPT
============================================================

APPLICATION MANAGER PORTAL
+ DIRECT / PARTNER / B2B APPLICATION ENGINE
+ OFFER / CAS-I20-COE
+ DOCUMENT REVIEW
+ VISA HANDOVER
+ CONFIDENTIAL B2B SECURITY
============================================================

MASTER IMPLEMENTATION PROMPT
VERSION: FINAL
STATUS TARGET: PRODUCTION READY

============================================================
0. NON-NEGOTIABLE MASTER RULE
============================================================

WORK INSIDE THE EXISTING ALO EDUCATION WEB_CRM ONLY.

DO NOT BUILD A NEW PROJECT.

DO NOT REBUILD THE CRM FROM ZERO.

DO NOT REPLACE THE EXISTING ARCHITECTURE.

DO NOT DELETE WORKING FEATURES.

DO NOT CREATE DUPLICATE STUDENT, UNIVERSITY, COURSE,
DOCUMENT, VISA, FINANCE, COMMUNICATION, OR AUDIT SYSTEMS.

DO NOT CREATE FAKE DASHBOARDS.

DO NOT CREATE HARDCODED DEMO DATA.

DO NOT CREATE UI-ONLY FEATURES.

DO NOT CLAIM A FEATURE IS COMPLETE UNTIL IT HAS BEEN
CONNECTED TO REAL DATABASE DATA, REAL APIs, AUTHENTICATION,
RBAC, AUDIT LOGGING, AND LIVE TESTING.

FIRST AUDIT THE EXISTING PROJECT.

THEN REUSE EXISTING COMPONENTS, ROUTES, DATABASE MODELS,
SERVICES, APIs, DOCUMENT ENGINE, COURSE DATABASE,
UNIVERSITY DATABASE, VISA ENGINE, FINANCE ENGINE,
COMMISSION ENGINE, COMMUNICATION TIMELINE AND AUDIT SYSTEM.

ONLY ADD WHAT IS ACTUALLY MISSING.

IF AN EQUIVALENT FEATURE ALREADY EXISTS:
    REUSE IT.

IF IT EXISTS BUT IS PARTIAL:
    PATCH ONLY THE MISSING PART.

IF UI EXISTS WITHOUT BACKEND:
    CONNECT THE EXISTING UI TO REAL BACKEND/API/DATABASE.

IF BACKEND EXISTS WITHOUT UI:
    CONNECT IT TO THE EXISTING UI.

IF DATABASE MODEL EXISTS:
    EXTEND IT ONLY WHEN REQUIRED.

IF AN EQUIVALENT MODEL EXISTS UNDER A DIFFERENT NAME:
    MAP TO THAT MODEL.
    DO NOT CREATE A DUPLICATE MODEL.

============================================================
1. PRIMARY OBJECTIVE
============================================================

Build a complete:

ALO EDUCATION APPLICATION MANAGER PORTAL

for:

APPLICATION_MANAGER
APPLICATION_TEAM
SUPER_ADMIN

The portal must manage:

- Direct applications
- Student self applications
- Partner applications
- B2B inbound applications
- B2B outbound applications
- University direct applications
- Imported applications
- Referral applications
- Event/seminar applications
- Course Finder applications
- University submission
- B2B submission
- Document review
- Application deadlines
- University responses
- Offer management
- Conditional offers
- Unconditional offers
- Rejections
- Deferrals
- Application fee
- Tuition deposit
- CAS
- I-20
- COE
- LOA/PAL where applicable
- Visa handover
- Application tasks
- Application communication
- Application timeline
- Reports
- Audit logs

============================================================
2. EXISTING SYSTEM INTEGRATION
============================================================

The Application Manager Portal MUST connect to existing:

- Student Portal
- Partner Portal
- Staff CRM
- Super Admin Portal
- Course Finder
- University Database
- Course Database
- Student Database
- Document Engine
- Visa Engine
- Finance
- Commission Engine
- Communication Engine
- Communication Timeline
- Notification Engine
- Task Engine
- Audit Log Engine
- Reporting Engine
- Authentication
- RBAC
- Existing Application Engine

Do not create isolated duplicate systems.

The Application Manager must operate on the same student,
university, course, document and application records used
by the rest of ALO Education.

============================================================
3. FIRST ACTION: FULL EXISTING-SYSTEM AUDIT
============================================================

Before writing code, inspect the entire existing Web_CRM.

Search for:

FRONTEND:
- application dashboards
- application pages
- application tables
- application detail pages
- university selection
- course selection
- application forms
- document review
- offer management
- CAS
- I-20
- COE
- application timeline
- tasks
- comments
- notifications
- reports
- B2B components
- partner applications
- direct applications

BACKEND:
- application APIs
- application services
- application routes
- B2B APIs
- document APIs
- offer APIs
- CAS/I20/COE APIs
- deadline APIs
- task APIs
- notification APIs
- reporting APIs
- audit APIs

DATABASE:
- applications
- students
- universities
- courses
- intakes
- documents
- offers
- visa cases
- finance
- commissions
- partners
- B2B
- comments
- tasks
- notifications
- timelines
- audit logs

AUTH/RBAC:
- roles
- permissions
- middleware
- ownership checks
- visibility filters

Mark every discovered feature:

FULLY_BUILT
PARTIALLY_BUILT
UI_ONLY
BACKEND_ONLY
API_MISSING
DATABASE_MISSING
RBAC_MISSING
AUDIT_MISSING
ROUTE_BROKEN
NOT_FOUND
DUPLICATE
CONFLICTING

Produce the audit internally before implementation.

============================================================
4. APPLICATION SOURCES
============================================================

Supported source values:

1. DIRECT_ALO_APPLICATION
2. STUDENT_SELF_APPLICATION
3. PARTNER_APPLICATION
4. B2B_INBOUND_APPLICATION
5. B2B_OUTBOUND_APPLICATION
6. UNIVERSITY_DIRECT_PORTAL
7. MANUAL_IMPORT
8. REFERRAL
9. EVENT_SEMINAR_LEAD
10. WEBSITE_COURSE_FINDER_LEAD

Normalize source values in the database.

============================================================
5. B2B MODEL
============================================================

There are two B2B types.

TYPE 1:
B2B_INBOUND

Meaning:

A B2B provider sends a student/application to ALO.

TYPE 2:
B2B_OUTBOUND

Meaning:

ALO submits a student application through a B2B provider/platform.

B2B information is CONFIDENTIAL.

============================================================
6. B2B CONFIDENTIALITY
============================================================

This is a security requirement, NOT merely a frontend UI rule.

B2B information MUST be protected at backend/API/database
response level.

Confidential B2B fields include:

- B2B provider name
- B2B provider ID
- B2B contact
- B2B email
- B2B phone
- B2B portal
- B2B portal URL
- B2B portal credentials/login notes
- B2B reference
- B2B submission method
- B2B commission
- B2B payment condition
- B2B claim stage
- B2B internal notes
- B2B attachments
- B2B agreement
- B2B confidential timeline entries
- B2B confidential comments

ONLY:

APPLICATION_MANAGER
APPLICATION_TEAM
SUPER_ADMIN

may access B2B details by default.

VISA_OFFICER:
No B2B access unless explicitly granted.

FINANCE:
May see B2B payment/commission status only when permission
exists.

FINANCE must NOT automatically receive:
- B2B provider contact
- B2B portal
- B2B credentials
- B2B internal notes

COUNSELOR:
No B2B information unless explicit permission.

PARTNER:
No B2B information.

STUDENT:
No B2B information.

FRONT_DESK:
No B2B information.

MARKETING:
No B2B information.

GENERAL_STAFF:
No B2B information.

============================================================
7. SECURITY RULE
============================================================

DO NOT rely on:

display:none
hidden tabs
frontend conditional rendering
disabled buttons

for B2B security.

Backend MUST enforce B2B access.

Unauthorized B2B API request:

HTTP 403 FORBIDDEN

Unauthorized application response:

B2B fields must be removed from the response.

Never return sensitive B2B data and rely on frontend hiding it.

============================================================
8. VISIBILITY MATRIX
============================================================

STUDENT:

CAN SEE:
- own application
- university
- course
- intake
- required documents
- offer status
- general visa status
- student-safe messages
- safe application timeline
- next actions

CANNOT SEE:
- B2B provider
- B2B contact
- B2B portal
- B2B commission
- B2B credentials
- B2B submission route
- B2B notes
- application-team confidential comments
- other students

------------------------------------------------------------

PARTNER:

CAN SEE:
- own student applications
- safe application status
- missing documents
- offer status
- visa status
- own permitted commission

CANNOT SEE:
- B2B provider
- B2B submission route
- B2B commission
- B2B contact
- B2B portal
- B2B credentials
- internal ALO comments
- other partners' cases

------------------------------------------------------------

COUNSELOR:

CAN SEE:
- assigned student application
- application status
- required student action
- general application notes
- document requirements
- student-safe feedback

CANNOT SEE:
- B2B provider
- B2B commission
- B2B contact
- B2B portal credentials
- confidential application-team comments

unless explicit permission exists.

------------------------------------------------------------

APPLICATION_TEAM:

CAN SEE:
- all application information allowed by role
- B2B source
- B2B provider
- B2B portal
- B2B submission
- B2B reference
- B2B commission status
- B2B contact
- B2B internal notes
- application documents
- offers
- CAS
- I-20
- COE
- application timeline
- submission history

------------------------------------------------------------

APPLICATION_MANAGER:

FULL APPLICATION MANAGEMENT ACCESS.

Includes:
- application creation
- update
- assignment
- document review
- submission
- offer management
- CAS/I20/COE
- B2B
- reports
- deadlines
- tasks
- internal comments
- audit information

------------------------------------------------------------

SUPER_ADMIN:

FULL ACCESS.

============================================================
9. ROUTES
============================================================

Create/fix:

/application-manager/dashboard
/application-manager/applications
/application-manager/application/:id
/application-manager/create
/application-manager/direct
/application-manager/partner
/application-manager/b2b
/application-manager/b2b/create
/application-manager/b2b/providers
/application-manager/b2b/provider/:id
/application-manager/submission-queue
/application-manager/document-review
/application-manager/offer-management
/application-manager/cas-i20-coe
/application-manager/deadlines
/application-manager/comments
/application-manager/tasks
/application-manager/reports
/application-manager/settings

CRM aliases:

/crm/applications
/crm/application/:id
/crm/b2b-applications
/crm/offer-letter-management
/crm/decision-pending
/crm/cas-i20-coe

Every route must have:
- authentication
- RBAC
- ownership/visibility enforcement
- loading state
- error state
- empty state
- real API data

============================================================
10. APPLICATION MANAGER SIDEBAR
============================================================

Dashboard

All Applications

Create Application

Direct Applications

Partner Applications

B2B Applications

B2B Providers

Submission Queue

Document Review

Decision Pending

Offer Management

CAS/I-20/COE

Application Deadlines

Comments & Timeline

Tasks

Reports

Settings

============================================================
11. APPLICATION COMMAND CENTER
============================================================

Build a premium responsive Application Manager dashboard.

Do NOT use hardcoded statistics.

Desktop:
12-column responsive grid.

Header:
12 columns.

KPI cards:
4 per row.

Main:
8-column application operations area.

Right:
4-column urgent activity area.

Tablet:
2 KPI cards per row.

Mobile:
1 card per row.

No blank sections.

No fake charts.

No fake counters.

============================================================
12. DASHBOARD KPI CARDS
============================================================

Show:

1. Total Applications
2. New Applications Today
3. Direct Applications
4. Partner Applications
5. B2B Applications
6. Submitted to University
7. Decision Pending
8. Conditional Offers
9. Unconditional Offers
10. Rejected
11. Deferred
12. Documents Pending
13. Application Fee Pending
14. CAS/I20/COE Pending
15. SLA Overdue
16. Confidential B2B Cases
17. Urgent Deadlines

Each KPI:
- real API value
- comparison/trend when available
- action button
- loading state
- empty state

============================================================
13. DASHBOARD SECTIONS
============================================================

Application Pipeline

Submission Queue

B2B Application Queue

Document Review Queue

Offer Management Queue

CAS/I20/COE Queue

Deadline Calendar

Recent Application Activity

Application Team Tasks

Confidential B2B Alerts

University Response Tracker

Application Source Performance

============================================================
14. APPLICATION PIPELINE
============================================================

Stages:

APPLICATION_DRAFT

PROFILE_REVIEW

DOCUMENT_REVIEW

READY_TO_SUBMIT

SUBMITTED_TO_ALO_APPLICATION_TEAM

SUBMITTED_TO_B2B

SUBMITTED_TO_UNIVERSITY

ACKNOWLEDGEMENT_RECEIVED

DECISION_PENDING

MORE_DOCUMENTS_REQUESTED

INTERVIEW_REQUIRED

CONDITIONAL_OFFER

UNCONDITIONAL_OFFER

REJECTED

DEFERRED

WITHDRAWN

DEPOSIT_PENDING

DEPOSIT_PAID

CAS_PENDING

CAS_RECEIVED

I20_PENDING

I20_RECEIVED

COE_PENDING

COE_RECEIVED

VISA_HANDOVER_READY

VISA_FILE_CREATED

CLOSED

============================================================
15. SAFE STATUS
============================================================

Student/Partner-facing status must use:

DRAFT

UNDER_REVIEW

DOCUMENTS_REQUIRED

SUBMITTED

DECISION_PENDING

OFFER_RECEIVED

REJECTED

DEFERRED

VISA_PREPARATION

Never expose internal B2B workflow.

Example:

INTERNAL:
SUBMITTED_TO_B2B

STUDENT:
SUBMITTED

INTERNAL:
B2B_ACKNOWLEDGEMENT_PENDING

STUDENT:
UNIVERSITY_RESPONSE_PENDING

============================================================
16. APPLICATION TABLE
============================================================

Columns:

Application ID

Student ID

Student Name

Country

University

Course

Intake

Application Source

Source Badge

B2B Confidential Badge

Partner

Counselor

Application Officer

Review Status

Application Status

Document Status

Application Fee Status

Offer Status

CAS/I20/COE Status

Deadline

Last Updated

Actions

B2B badge MUST only render for authorized roles.

============================================================
17. APPLICATION FILTERS
============================================================

Filters:

Application Source

Direct

Partner

B2B Inbound

B2B Outbound

Country

University

Course

Intake

Counselor

Application Officer

Document Status

Offer Status

CAS/I20/COE Status

Deadline

Urgent Only

Confidential B2B Only

SLA Overdue

Application Status

============================================================
18. BULK ACTIONS
============================================================

Permission-controlled:

Assign Application Officer

Change Status

Request Documents

Add Internal Note

Send Student Update

Send Partner Update

Mark Submitted

Export

Download Documents

Move to Visa

Create Task

Every bulk mutation must:
- validate permission
- validate ownership
- execute safely
- audit each affected application

============================================================
19. APPLICATION DETAIL PAGE
============================================================

Tabs:

Overview

Student Profile

Course & University

Documents

Submission

B2B Details

Comments

Offer / Decision

CAS/I20/COE

Finance

Visa Handover

Timeline

Audit Log

Unauthorized users must not even receive restricted tab data.

============================================================
20. OVERVIEW
============================================================

Show:

Application ID

Student ID

Student Name

Nationality

Target Country

University

Course

Campus

Study Level

Intake

Application Source

Application Status

Safe Status

Review Status

Document Status

Payment Status

Offer Status

CAS/I20/COE Status

Counselor

Application Officer

Partner

Created Date

Updated Date

Next Action

Urgent Deadline

============================================================
21. STUDENT PROFILE
============================================================

Application-safe information:

Personal information

Contact information

Academic history

English test

Passport status

Study gap summary

Work experience

Preferred country

Preferred subject

Budget

Visa refusal summary where permitted

Do not expose unrelated private information.

============================================================
22. COURSE & UNIVERSITY
============================================================

Show database-backed:

Course

University

Country

Campus

Intake

Tuition

Application Fee

Deposit

Scholarship

Entry Requirements

English Requirements

Deadline

Source URL

Last Verified

============================================================
23. DOCUMENT ENGINE INTEGRATION
============================================================

Reuse existing Document Engine.

Do not create a second document storage system.

Application document view:

Required

Uploaded

Missing

Rejected

Expired

Under Review

Verified

Locked

Request Again

For each document:

- type
- status
- reviewer
- reviewer note
- visibility
- version
- createdAt
- updatedAt

Actions:

Preview

Download

Approve

Reject

Request Again

Add Note

View Version History

Every download/view of sensitive documents must be audited.

============================================================
24. DOCUMENT PACK
============================================================

Support application pack generation:

Student Profile

Passport

Academic Certificates

Academic Transcripts

English Test

CV

SOP

Recommendation Letters

Financial Documents where required

Application Form

Offer/CAS/I20/COE

Document pack must respect permissions.

============================================================
25. SUBMISSION TAB
============================================================

Submission methods:

DIRECT_UNIVERSITY_PORTAL

EMAIL

UNIVERSITY_REPRESENTATIVE

B2B_INBOUND

B2B_OUTBOUND

PARTNER_SUBMISSION

MANUAL

Fields:

Submitted By

Submitted To

Submission Date

Acknowledgement Number

Portal Reference

University Application ID

Application Fee Status

Submission Receipt

Expected Response Date

Offer TAT

Follow-up Date

Submission Note

B2B values must be filtered for unauthorized users.

============================================================
26. B2B DETAILS TAB
============================================================

ACCESS:

APPLICATION_MANAGER
APPLICATION_TEAM with permission
SUPER_ADMIN

Fields:

B2B Type

B2B Provider

B2B Provider ID

B2B Contact Person

B2B Email

B2B Phone

B2B Portal URL

B2B Reference ID

B2B Submitted Date

B2B Status

B2B Commission Type

B2B Commission Amount

B2B Payment Condition

B2B Claim Stage

B2B Internal Note

B2B Attachments

B2B Agreement

B2B Last Follow-up

B2B Next Follow-up

Display:

CONFIDENTIAL B2B INFORMATION

DO NOT SHARE WITH STUDENTS, PARTNERS,
OR UNAUTHORIZED STAFF.

Portal credentials/login notes must be encrypted or protected
using the existing secure secrets mechanism.

Never expose credentials in normal API responses.

============================================================
27. COMMENTS
============================================================

Comment channels:

STUDENT_VISIBLE

PARTNER_VISIBLE

COUNSELOR_VISIBLE

APPLICATION_TEAM_INTERNAL

B2B_CONFIDENTIAL

UNIVERSITY

FINANCE

VISA_HANDOVER

Every comment:

- user
- role
- timestamp
- visibility
- content
- attachment
- audit record

Student-visible comments -> Student Portal.

Partner-visible comments -> Partner Portal.

B2B comments -> Application Team/Super Admin only.

============================================================
28. OFFER / DECISION
============================================================

Statuses:

DECISION_PENDING

CONDITIONAL_OFFER

UNCONDITIONAL_OFFER

REJECTED

DEFERRED

WITHDRAWN

MORE_DOCUMENTS_REQUESTED

INTERVIEW_REQUIRED

APPLICATION_FEE_PENDING

DEPOSIT_REQUIRED

Fields:

Offer Letter

Offer Conditions

Condition Deadline

Scholarship

Deposit Amount

Deposit Deadline

Decision Date

Decision Note

Student Notification

Partner Notification

============================================================
29. CAS / I20 / COE
============================================================

Destination support:

UK:
CAS

USA:
I-20

Australia:
COE

Canada:
LOA / PAL when applicable

Ireland:
Offer/Visa Support Letter

New Zealand:
Offer/Visa Support Letter

Dubai/UAE:
Offer/Visa Support Letter

Fields:

Document Type

Status

Requested Date

Received Date

Reference Number

Upload

Condition Note

Next Step

Visa Handover Status

============================================================
30. FINANCE
============================================================

Permission-controlled.

Show:

Application Fee

Tuition Deposit

Scholarship

Invoice

Receipt

Payment Status

Partner Commission

B2B Commission

Finance Note

B2B commission details only when:

application.view_b2b_commission

exists.

============================================================
31. VISA HANDOVER
============================================================

When application reaches:

VISA_HANDOVER_READY

allow:

Create Visa File

Send Documents to Visa Team

Create Visa Checklist

Notify Visa Officer

Notify Student

Notify Counselor

Notify Partner when applicable

Mark Handover Complete

Connect to existing Visa Engine.

Do not create duplicate VisaCase if one already exists.

============================================================
32. APPLICATION TIMELINE
============================================================

Timeline events:

Application Created

Documents Uploaded

Documents Approved

Documents Rejected

Submitted

Acknowledgement Received

Decision Pending

Offer Received

Deposit Paid

CAS Received

I20 Received

COE Received

Visa Handover

Comments

Tasks

Notifications

B2B internal events

B2B events must be anonymized for unauthorized users.

Example internal:

Submitted through B2B Provider X

Student-safe:

Application Submitted

============================================================
33. B2B PROVIDER MANAGEMENT
============================================================

Route:

/application-manager/b2b/providers

Fields:

Provider ID

Provider Name

Provider Type

Country Coverage

University Coverage

Contact Person

Email

Phone

Portal URL

Login Note

Agreement File

Commission Rule

Payment Condition

Claim Stage

Status

Created By

Approved By

Last Reviewed

Internal Note

Provider Types:

GLOBAL_B2B

COUNTRY_SPECIFIC_B2B

UNIVERSITY_REPRESENTATIVE

PATHWAY_PROVIDER

AGGREGATOR

SUB_AGENT_NETWORK

DIRECT_UNIVERSITY_CHANNEL

Only authorized Application Team/Super Admin users can
access provider records.

============================================================
34. B2B APPLICATION CREATION
============================================================

Form:

Student

Course

University

Intake

B2B Type

B2B Provider

Submission Route

B2B Reference

Application Officer

Required Documents

Application Fee

Commission Note

Internal Note

Visibility

Deadline

On creation:

1. Create application.
2. Set source.
3. Create B2B application record.
4. Create confidential timeline event.
5. Notify Application Team.
6. Do not expose provider to student.
7. Expose safe status to student.
8. Write audit logs.

============================================================
35. SUBMISSION QUEUE
============================================================

Queue:

Ready to Submit

Missing Document

Application Fee Pending

Waiting Counselor Approval

Waiting Partner Document

B2B Follow-up Required

University Follow-up Required

Deadline Urgent

Each queue item must have real database status.

============================================================
36. DEADLINE ENGINE
============================================================

Track:

Application Deadline

Document Deadline

Offer Condition Deadline

Deposit Deadline

CAS Deadline

I20 Deadline

COE Deadline

B2B Follow-up Deadline

University Follow-up Deadline

Alerts:

DUE_TODAY

DUE_IN_3_DAYS

DUE_IN_7_DAYS

OVERDUE

Create tasks and notifications according to existing workflow.

============================================================
37. NOTIFICATIONS
============================================================

Student notifications:

Application Created

Documents Required

Application Ready

Application Submitted

Decision Pending

Conditional Offer

Unconditional Offer

More Documents Required

Rejected

Deferred

Deposit Pending

CAS/I20/COE Pending

CAS/I20/COE Received

Visa Handover Ready

B2B provider details MUST never be inserted into student
notification templates.

Internal B2B notifications:

B2B Submission Created

B2B Follow-up Due

B2B Acknowledgement Missing

B2B Commission Stage Reached

B2B Provider Response Pending

============================================================
38. REPORTS
============================================================

Build:

Total Applications

Applications by Source

Direct vs Partner vs B2B

B2B Inbound

B2B Outbound

University Response

Country-wise

Course-wise

Counselor-wise

Application Officer Performance

Document Pending

Offer Conversion

Rejection

Deferral

CAS/I20/COE Pending

Deadline Overdue

SLA Breach

B2B Confidential Performance

B2B Confidential Performance report restricted.

Exports:

CSV

XLSX if existing exporter supports it

PDF if existing report engine supports it

Never create a separate export architecture when one already exists.

============================================================
39. DATABASE AUDIT FIRST
============================================================

Inspect existing MySQL/Prisma schema.

Reuse equivalent models.

Only add missing fields/models.

Required logical entities:

applications

b2b_providers

b2b_applications

application_status_logs

application_comments

application_documents

application_deadlines

application_tasks

application_notifications

If equivalent existing models exist:

DO NOT CREATE DUPLICATES.

============================================================
40. APPLICATION MODEL
============================================================

Required logical fields:

id

application_code

student_id

partner_id nullable

counselor_id nullable

application_officer_id nullable

visa_officer_id nullable

course_id

university_id

campus_id nullable

intake_id nullable

application_source

source_visibility

is_b2b

b2b_type nullable

b2b_provider_id nullable

status

safe_status

review_status

document_status

payment_status

offer_status

cas_i20_coe_status

visa_handover_status

deadline

created_by

updated_by

created_at

updated_at

Add appropriate foreign keys and indexes.

============================================================
41. B2B PROVIDER MODEL
============================================================

Required logical fields:

id

provider_code

name

provider_type

country_coverage

university_coverage

contact_person

email

phone

portal_url

login_note

agreement_file

commission_rule

payment_condition

claim_stage

status

created_by

approved_by

last_reviewed_at

internal_note

created_at

updated_at

Sensitive fields must be protected.

============================================================
42. B2B APPLICATION MODEL
============================================================

Fields:

id

application_id

b2b_provider_id

b2b_type

b2b_reference

submission_route

submitted_date

acknowledgement_number

b2b_status

b2b_commission_type

b2b_commission_amount

b2b_payment_condition

b2b_claim_stage

b2b_internal_note

last_followup_at

next_followup_at

created_by

updated_by

created_at

updated_at

============================================================
43. STATUS LOG MODEL
============================================================

Fields:

id

application_id

old_status

new_status

safe_status

changed_by

visibility

note

created_at

============================================================
44. COMMENT MODEL
============================================================

Fields:

id

application_id

user_id

role

comment_type

visibility

comment_text

attachment_path

is_b2b_confidential

created_at

updated_at

============================================================
45. DOCUMENT MODEL
============================================================

Fields:

id

application_id

student_id

document_id

document_type

status

reviewer_id

reviewer_note

visibility

version

created_at

updated_at

============================================================
46. DEADLINE MODEL
============================================================

Fields:

id

application_id

deadline_type

deadline_date

status

assigned_to

reminder_sent

created_at

updated_at

============================================================
47. TASK MODEL
============================================================

Fields:

id

application_id

task_title

task_description

assigned_to

priority

status

due_date

created_by

created_at

updated_at

============================================================
48. NOTIFICATION MODEL
============================================================

Fields:

id

application_id

recipient_type

recipient_id

channel

template_name

message

status

sent_at

created_at

============================================================
49. REQUIRED PERMISSIONS
============================================================

application.view

application.create

application.update

application.delete

application.review_documents

application.submit

application.manage_offer

application.manage_cas_i20_coe

application.manage_deadlines

application.view_b2b

application.manage_b2b

application.view_b2b_commission

application.manage_b2b_providers

application.view_reports

application.export

application.internal_comments

Also verify equivalent existing permission naming.

Do not create duplicate permission systems.

============================================================
50. ROLE MATRIX
============================================================

APPLICATION_MANAGER:

All application permissions.

APPLICATION_TEAM:

Application management.

B2B access only when granted.

COUNSELOR:

Assigned applications only.

No B2B details.

PARTNER:

Own partner applications only.

No B2B details.

STUDENT:

Own applications only.

Safe status only.

FINANCE:

Finance/payment/commission.

B2B commission only with explicit permission.

SUPER_ADMIN:

Everything.

============================================================
51. REQUIRED API AUDIT
============================================================

Inspect existing APIs first.

Add only missing endpoints.

Core:

GET /api/applications
POST /api/applications
GET /api/applications/:id
PATCH /api/applications/:id

Dashboard:

GET /api/applications/dashboard
GET /api/applications/metrics

Assignment:

PATCH /api/applications/:id/assign

Status:

PATCH /api/applications/:id/status

Documents:

GET /api/applications/:id/documents
POST /api/applications/:id/documents/request
PATCH /api/application-documents/:id/approve
PATCH /api/application-documents/:id/reject
PATCH /api/application-documents/:id/request-again

Submission:

POST /api/applications/:id/submit

Offer:

GET /api/applications/:id/offer
PATCH /api/applications/:id/offer

CAS/I20/COE:

GET /api/applications/:id/cas-i20-coe
PATCH /api/applications/:id/cas-i20-coe

Timeline:

GET /api/applications/:id/timeline

Comments:

GET /api/applications/:id/comments
POST /api/applications/:id/comments
PATCH /api/application-comments/:id

Tasks:

GET /api/applications/tasks
POST /api/applications/tasks
PATCH /api/applications/tasks/:id

Deadlines:

GET /api/applications/deadlines
POST /api/applications/deadlines
PATCH /api/application-deadlines/:id

B2B:

GET /api/applications/b2b
POST /api/applications/b2b
GET /api/applications/:id/b2b
PATCH /api/applications/:id/b2b

B2B Providers:

GET /api/b2b/providers
POST /api/b2b/providers
GET /api/b2b/providers/:id
PATCH /api/b2b/providers/:id

Reports:

GET /api/applications/reports
POST /api/applications/reports/generate
GET /api/applications/reports/:id/download

Visa handover:

POST /api/applications/:id/visa-handover

Every protected endpoint must implement:

AUTH

RBAC

OWNERSHIP/VISIBILITY

INPUT VALIDATION

SAFE ERROR HANDLING

AUDIT LOG

SENSITIVE FIELD FILTERING

NO CROSS-STUDENT DATA LEAK

============================================================
52. B2B API SECURITY
============================================================

For unauthorized user:

GET /api/applications/:id/b2b

must return:

403 FORBIDDEN

For normal application endpoint:

GET /api/applications/:id

response must omit:

b2b_provider

b2b_provider_id

b2b_contact

b2b_commission

b2b_portal

b2b_reference

b2b_internal_note

b2b_credentials

when unauthorized.

Do not rely on frontend filtering.

============================================================
53. FRONTEND COMPONENT AUDIT
============================================================

Search for existing equivalents of:

ApplicationManagerDashboard

ApplicationMetrics

ApplicationPipeline

ApplicationTable

ApplicationDetail

ApplicationOverview

ApplicationDocuments

ApplicationSubmission

B2BApplicationPanel

B2BProviderPanel

ApplicationComments

ApplicationOffer

CASI20COEPanel

ApplicationFinance

ApplicationVisaHandover

ApplicationTimeline

ApplicationTasks

ApplicationReports

DeadlineCalendar

If existing:

REUSE.

If partial:

PATCH.

If absent:

CREATE.

============================================================
54. APPLICATION MANAGER DASHBOARD ACTIONS
============================================================

Quick actions:

Create Application

Review Application

Review Documents

Submit Application

Create B2B Application

Review B2B Queue

Manage Offer

Manage CAS/I20/COE

Schedule Follow-up

Generate Report

Create Task

Move to Visa

Every button must perform a real action.

No dead buttons.

============================================================
55. COMMUNICATION CONNECTION
============================================================

Connect with existing Communication Engine.

Messages must respect visibility.

Student messages:
safe information only.

Partner messages:
partner-safe information only.

Counselor messages:
counselor-safe information only.

Application Team:
full application information.

B2B communication:
internal Application Team only.

Never leak B2B details through:

Email

SMS

WhatsApp

Portal notifications

Push notifications

Timeline

AI-generated messages

============================================================
56. AI SAFETY
============================================================

If AI features are used for application summaries,
AI MUST receive only data allowed for the current role.

For student-facing AI:
Never expose B2B data.

For counselor-facing AI:
Never expose B2B data unless permission exists.

For partner-facing AI:
Never expose B2B data.

For Application Team AI:
B2B information may be used.

AI must not invent:

application status

university response

offer

CAS

I20

COE

B2B submission

commission

deadline

payment

If data is missing:

return:

DATA NOT AVAILABLE

instead of inventing information.

============================================================
57. AUDIT LOGGING
============================================================

Audit:

Application Created

Application Viewed

Application Updated

Application Deleted if allowed

Application Assigned

Status Changed

Document Viewed

Document Downloaded

Document Approved

Document Rejected

Document Requested

Application Submitted

B2B Application Viewed

B2B Application Created

B2B Application Updated

B2B Provider Viewed

B2B Provider Updated

B2B Confidential Comment Created

B2B Confidential Comment Viewed

Offer Updated

CAS Updated

I20 Updated

COE Updated

Finance Viewed

Commission Viewed

Visa Handover

Report Generated

Report Exported

Bulk Action

Every sensitive action must be audited.

Audit fields:

auditId

actorUserId

actorRole

action

entityType

entityId

studentId

beforeValue

afterValue

ip/session if available

createdAt

============================================================
58. SECURITY
============================================================

Implement/verify:

Authentication

RBAC

Ownership checks

Backend visibility filters

CSRF protection for state-changing forms where applicable

Prepared statements / parameterized queries

Output escaping

Validation

Rate limiting where applicable

Secure document authorization

Signed/private document access where supported

No public sensitive document URLs

No secrets in source code

No plaintext B2B credentials

No B2B data in client logs

No B2B data in analytics events

No B2B data in marketing workflows

No B2B data in public pages

============================================================
59. NEGATIVE SECURITY TESTS
============================================================

PROVE:

1. Student cannot access B2B details.

2. Student cannot call B2B API successfully.

3. Partner cannot access B2B details.

4. Counselor cannot access B2B details.

5. Marketing cannot access B2B details.

6. Front Desk cannot access B2B details.

7. General Staff cannot access B2B details.

8. Visa Officer cannot access B2B details unless permission exists.

9. Finance cannot access B2B contact without permission.

10. Finance cannot access B2B credentials.

11. Unauthorized user cannot download B2B documents.

12. Unauthorized user cannot access another student's application.

13. Student cannot view internal comments.

14. Partner cannot view another partner's application.

15. Counselor cannot access unassigned application.

16. Suspended user cannot access Application Manager.

17. Public user cannot access application APIs.

18. B2B provider credentials never appear in standard API response.

19. B2B provider data never appears in student notifications.

20. B2B provider data never appears in partner notifications.

21. B2B data never appears in student portal.

22. B2B data never appears in partner portal.

23. Every B2B view creates audit log.

24. Every B2B edit creates audit log.

25. Every sensitive document download creates audit log.

============================================================
60. DATA INTEGRITY TESTS
============================================================

Verify:

No duplicate application code.

No duplicate B2B application record for same application/provider/reference
unless explicitly allowed.

No orphaned application.

No orphaned B2B record.

No orphaned application document.

No invalid student relationship.

No invalid university relationship.

No invalid course relationship.

No invalid intake relationship.

No invalid partner relationship.

No invalid application officer relationship.

No invalid B2B provider relationship.

============================================================
61. LIVE INTEGRATION TESTS
============================================================

Create/test real test records through the existing application system.

TEST 1:
Direct application.

Verify:
student -> application -> university -> course -> documents -> timeline.

TEST 2:
Partner application.

Verify:
partner sees own safe application.

TEST 3:
B2B inbound.

Verify:
Application Team sees B2B.

Student sees safe application.

Partner cannot see B2B.

Counselor cannot see B2B.

TEST 4:
B2B outbound.

Verify:
same confidentiality.

TEST 5:
Offer.

Verify:
offer appears in Application Manager and Student Portal
according to visibility.

TEST 6:
CAS/I20/COE.

Verify:
correct destination-specific document.

TEST 7:
Visa handover.

Verify:
existing Visa Engine receives correct application/student data.

Do not create duplicate VisaCase.

TEST 8:
Document review.

Upload -> Review -> Approve/Reject -> Timeline.

TEST 9:
Deadline.

Create deadline -> reminder -> overdue status.

TEST 10:
Audit.

Verify all mutations create audit logs.

============================================================
62. PERFORMANCE
============================================================

Do not load all applications at once.

Use:

pagination

server-side filtering

server-side sorting

indexed queries

selective fields

role-based field selection

efficient joins

lazy loading for large documents

Do not expose large document blobs in list APIs.

============================================================
63. RESPONSIVE DESIGN
============================================================

Desktop:

12-column dashboard.

Tablet:

2-column KPI layout.

Mobile:

single-column.

Tables must support:

horizontal scroll

responsive card mode where appropriate

sticky action controls where useful

No horizontal page overflow.

No broken modal.

No blank route.

No inaccessible controls.

============================================================
64. UX STATES
============================================================

Every page/API-driven component must implement:

Loading

Empty

Error

Success

Permission denied

No access

Not found

Saving

Saved

Unsaved changes

Confirmation for destructive actions

============================================================
65. NO FAKE DATA
============================================================

Remove/avoid:

hardcoded application counts

hardcoded students

fake B2B providers

fake universities

fake application statuses

fake offer data

fake CAS/I20/COE

fake reports

fake charts

fake timelines

Use real database data.

For empty production database:

show:

No applications found.

Do not fabricate records.

============================================================
66. EXISTING ARCHITECTURE PRESERVATION
============================================================

Do NOT replace:

existing authentication

existing Student Portal

existing Partner Portal

existing CRM

existing University Database

existing Course Database

existing Document Engine

existing Visa Engine

existing Finance

existing Commission Engine

existing Notification Engine

existing Timeline

existing Audit Log

unless a proven bug requires modification.

If a replacement is absolutely necessary:

document exactly why before changing it.

============================================================
67. BUILD / VALIDATION
============================================================

Run the project's actual package-manager commands based on
the existing project.

At minimum verify:

npm install

npm run typecheck

npm run lint

npm run build

npx prisma validate

npx prisma generate

If applicable:

npx prisma migrate

or existing production database migration mechanism.

If backend exists:

node --check backend/server.js

Also test relevant backend routes.

Do not blindly run destructive database commands against
production.

============================================================
68. ROUTE TESTING
============================================================

Verify:

/application-manager/dashboard

/application-manager/applications

/application-manager/application/:id

/application-manager/create

/application-manager/direct

/application-manager/partner

/application-manager/b2b

/application-manager/b2b/create

/application-manager/b2b/providers

/application-manager/b2b/provider/:id

/application-manager/submission-queue

/application-manager/document-review

/application-manager/offer-management

/application-manager/cas-i20-coe

/application-manager/deadlines

/application-manager/comments

/application-manager/tasks

/application-manager/reports

/application-manager/settings

/crm/applications

/crm/application/:id

/crm/b2b-applications

/crm/offer-letter-management

/crm/decision-pending

/crm/cas-i20-coe

Every route must load correctly with appropriate RBAC.

============================================================
69. SELF-AUDIT
============================================================

After implementation, independently verify:

[ ] Application Manager dashboard loads.

[ ] Application Manager role works.

[ ] Application Team role works.

[ ] Super Admin works.

[ ] Direct application works.

[ ] Student self application works.

[ ] Partner application works.

[ ] B2B inbound works.

[ ] B2B outbound works.

[ ] University direct application works.

[ ] Manual import works if existing system supports it.

[ ] Application list uses real data.

[ ] Application detail uses real data.

[ ] Document review works.

[ ] Submission queue works.

[ ] University submission works.

[ ] B2B submission works.

[ ] B2B provider management works.

[ ] B2B confidentiality works.

[ ] Offer management works.

[ ] CAS works.

[ ] I20 works.

[ ] COE works.

[ ] Deadline engine works.

[ ] Tasks work.

[ ] Notifications work.

[ ] Communication timeline works.

[ ] Finance integration works.

[ ] Commission integration works.

[ ] Visa handover works.

[ ] Existing Visa Engine is reused.

[ ] Reports work.

[ ] Exports respect permission.

[ ] Audit logs work.

[ ] Student safe status works.

[ ] Partner safe status works.

[ ] Counselor safe status works.

[ ] Internal exact status works.

[ ] No cross-student data leak.

[ ] No B2B leakage.

[ ] No hardcoded secrets.

[ ] No fake data.

[ ] No broken routes.

[ ] No duplicate database entities.

[ ] No console errors.

[ ] No API errors.

[ ] Build passes.

============================================================
70. FINAL AUDIT REPORT
============================================================

Return a detailed implementation report using EXACTLY:

SECTION A:
EXISTING APPLICATION FEATURES FOUND

List:
- feature
- location
- status
- reuse/patch decision

SECTION B:
REUSED COMPONENTS

List every existing component/service/model reused.

SECTION C:
NEW FEATURES ADDED

Only list genuinely new features.

SECTION D:
ROUTES ADDED/FIXED

List:
- route
- status
- RBAC

SECTION E:
APIs ADDED/FIXED

List:
- endpoint
- method
- permission
- status

SECTION F:
DATABASE MODELS/FIELDS

List:
- existing reused
- fields added
- indexes
- relationships

SECTION G:
RBAC

List:
- roles
- permissions
- backend enforcement

SECTION H:
B2B SECURITY TESTS

Show each negative test and result.

SECTION I:
STUDENT PORTAL CONNECTION

Prove:
- safe status
- documents
- offer
- messages
- timeline
- visa handover

SECTION J:
PARTNER PORTAL CONNECTION

Prove:
- own applications
- safe status
- documents
- offer
- commission where permitted

SECTION K:
VISA ENGINE CONNECTION

Prove:
- visa handover
- document handover
- no duplicate VisaCase

SECTION L:
FINANCE / COMMISSION CONNECTION

Prove:
- payment
- application fee
- tuition deposit
- commission
- B2B commission restrictions

SECTION M:
AUDIT LOG PROOF

Show representative audit records for:
- application view
- application update
- B2B view
- B2B update
- document download
- offer update
- CAS/I20/COE update
- visa handover

SECTION N:
FILES CHANGED

List every changed file.

SECTION O:
BUILD / TEST RESULTS

Show actual:

typecheck

lint

build

prisma validate

prisma generate

backend validation

route tests

security tests

SECTION P:
REMAINING MISSING ITEMS

If anything remains incomplete, list exact items.

============================================================
71. COMPLETION RULE
============================================================

DO NOT SAY:

"Done"

"Complete"

"Production Ready"

unless the implementation has actually been tested.

FINAL STATUS MUST BE EXACTLY ONE OF:

COMPLETE

OR

NOT COMPLETE

If NOT COMPLETE:

provide exact missing features,
files,
routes,
APIs,
database items,
RBAC gaps,
security gaps,
and test failures.

============================================================
72. FINAL SUCCESS CONDITION
============================================================

The implementation is complete only when:

ALO_APPLICATION_MANAGER_PORTAL_B2B_READY

AND:

- existing CRM preserved
- existing systems reused
- Application Manager routes work
- Application Team routes work
- direct applications work
- partner applications work
- B2B inbound works
- B2B outbound works
- B2B confidentiality is backend enforced
- B2B API returns 403 to unauthorized users
- safe statuses work
- application documents work
- document review works
- submission queue works
- university submission works
- offer management works
- CAS works
- I20 works
- COE works
- deadlines work
- tasks work
- notifications work
- communication timeline works
- finance integration works
- commission integration works
- Visa Engine handover works
- Student Portal receives only safe information
- Partner Portal receives only permitted information
- Counselor receives only permitted information
- Application Team receives application/B2B information
- Super Admin has full access
- reports work
- exports are permission controlled
- audit logs work
- sensitive document access is audited
- no cross-student data leak
- no B2B data leak
- no hardcoded secrets
- no fake data
- no duplicate models
- no duplicate application records
- no broken routes
- no console errors
- no API errors
- build passes
- live test passes

============================================================
FINAL COMMAND
============================================================

AUDIT FIRST.

DO NOT REBUILD.

REUSE EXISTING ALO EDUCATION WEB_CRM.

PATCH ONLY WHAT IS MISSING.

IMPLEMENT THE COMPLETE APPLICATION MANAGER PORTAL.

IMPLEMENT DIRECT APPLICATION MANAGEMENT.

IMPLEMENT PARTNER APPLICATION MANAGEMENT.

IMPLEMENT B2B INBOUND AND OUTBOUND APPLICATION MANAGEMENT.

IMPLEMENT STRICT BACKEND B2B CONFIDENTIALITY.

CONNECT DOCUMENT ENGINE.

CONNECT UNIVERSITY/COURSE DATABASE.

CONNECT STUDENT PORTAL.

CONNECT PARTNER PORTAL.

CONNECT STAFF CRM.

CONNECT FINANCE.

CONNECT COMMISSION ENGINE.

CONNECT VISA ENGINE.

CONNECT COMMUNICATION TIMELINE.

CONNECT REPORTING.

CONNECT AUDIT LOGS.

TEST EVERYTHING.

PROVE SECURITY.

PROVE ROUTES.

PROVE APIs.

PROVE DATABASE.

PROVE RBAC.

PROVE STUDENT/PARTNER/COUNSELOR VISIBILITY.

PROVE B2B CONFIDENTIALITY.

DO NOT CLAIM COMPLETE UNTIL LIVE TESTED.

FINAL TARGET:

ALO_APPLICATION_MANAGER_PORTAL_B2B_READY
============================================================


B2B PARTNER SUPER ADMIN + EMPLOYEE ACCESS + QUOTA + MARKETING AUTOMATION + STUDENT BENEFIT CONTR
MODE:
AUDIT → MAP → PATCH → INTEGRATE → VERIFY

DO NOT REBUILD THE EXISTING PROJECT.

DO NOT CREATE A NEW PROJECT.

DO NOT REPLACE THE EXISTING CRM.

DO NOT DELETE WORKING FEATURES.

DO NOT DUPLICATE EXISTING COMPONENTS, TABLES, ROUTES, APIs, RBAC, dashboards, or workflows.

WORK ONLY INSIDE THE EXISTING ALO EDUCATION WEB_CRM PROJECT.

============================================================
0. NON-NEGOTIABLE IMPLEMENTATION RULE
============================================================

Before changing anything, perform a complete repository audit.

The existing project may already contain:

- authentication
- RBAC
- employee management
- partner portal
- student portal
- application management
- visa management
- marketing manager
- AI AgentOS
- document engine
- finance
- commission engine
- notification engine
- timeline
- audit logging
- database models
- APIs
- existing dashboards
- existing quota systems
- existing feature permission systems

DO NOT assume anything is missing.

Search and inspect the actual codebase first.

For every requested feature classify it as:

FULLY_BUILT
PARTIALLY_BUILT
UI_ONLY
API_ONLY
DATABASE_ONLY
RBAC_ONLY
ROUTE_MISSING
API_MISSING
DATABASE_MISSING
RBAC_MISSING
AUDIT_MISSING
SECURITY_MISSING
BROKEN
NOT_FOUND

Implementation rule:

IF FULLY_BUILT:
    Reuse it.
    Do not rebuild it.

IF PARTIALLY_BUILT:
    Preserve working code.
    Patch only missing functionality.

IF UI_ONLY:
    Connect it to real backend/database/API/RBAC/audit workflow.

IF API_ONLY:
    Connect it to the existing UI.

IF DATABASE_ONLY:
    Connect it to existing services/UI.

IF RBAC_ONLY:
    Connect it to actual route/API enforcement.

IF BROKEN:
    Fix the existing implementation.

IF NOT_FOUND:
    Build the smallest clean module necessary.

NEVER create duplicate equivalents.

============================================================
1. BUSINESS MASTER CONTROL
============================================================

ALO Education Chairman / ALO Super Admin has MASTER CONTROL.

Super Admin controls:

- every employee
- every role
- every permission
- every B2B partner
- every partner package
- every partner user limit
- every partner quota
- every student benefit
- every voucher rule
- every marketing feature
- every AI feature
- every social connection
- every application
- every B2B application
- every document permission
- every finance permission
- every HR permission
- every salary access rule
- every sensitive-data permission
- every audit log
- every approval workflow
- every feature activation/suspension

No lower-level role can bypass Super Admin control.

All sensitive authorization must be enforced server-side.

Frontend hiding is NOT security.

============================================================
2. ROLE HIERARCHY
============================================================

LEVEL 1:
ALO CHAIRMAN / SUPER_ADMIN

Full master access.

LEVEL 2:
ALO ADMIN / MANAGER

Permission-controlled access.

LEVEL 3:
ALO EMPLOYEE

Designation + explicit permission controlled.

LEVEL 4:
B2B_PARTNER_SUPER_ADMIN

Can manage only:

- own company
- own users
- own students
- own leads
- own applications
- own documents
- own marketing
- own quotas
- own vouchers
- own reports
- own support requests

LEVEL 5:
B2B_PARTNER_COUNSELOR / EMPLOYEE

Can only access permissions assigned by their own Partner Super Admin, and only within ALO-approved limits.

LEVEL 6:
STUDENT

Can access only own:

- profile
- applications
- documents
- tests
- interview preparation
- messages
- benefits
- vouchers
- safe status

============================================================
3. TENANT ISOLATION
============================================================

Every B2B partner must operate as an isolated tenant.

A partner user MUST NOT access another partner's:

- students
- leads
- applications
- documents
- marketing
- campaigns
- reports
- quotas
- vouchers
- social accounts
- employees
- comments
- internal notes

Every partner-scoped query must enforce:

partner_id = authenticated user's partner scope

Do not rely on URL IDs alone.

Never trust:

/partner-admin/students/{id}

without checking ownership.

Server-side tenant isolation is mandatory.

============================================================
4. B2B PARTNER SUPER ADMIN ROUTES
============================================================

Implement or patch:

/partner-admin/dashboard
/partner-admin/company-profile
/partner-admin/users
/partner-admin/users/create
/partner-admin/roles
/partner-admin/students
/partner-admin/leads
/partner-admin/applications
/partner-admin/documents
/partner-admin/course-finder
/partner-admin/marketing-studio
/partner-admin/content-generator
/partner-admin/image-generator
/partner-admin/video-generator
/partner-admin/social-scheduler
/partner-admin/mock-tests
/partner-admin/interview-prep
/partner-admin/voucher-codes
/partner-admin/usage-quota
/partner-admin/reports
/partner-admin/support-request
/partner-admin/settings

Every route must have:

- authentication
- tenant check
- RBAC
- permission check
- feature-access check
- quota check where relevant
- audit logging where relevant
- safe error handling

No dead buttons.

============================================================
5. PARTNER SUPER ADMIN DASHBOARD
============================================================

Build a premium SaaS dashboard using the existing ALO design system.

Do not create a separate visual language if an existing dashboard shell already exists.

Show:

- Total Students
- Active Applications
- Submitted Applications
- Offers Received
- Visa-Ready Students
- Pending Documents
- Available Counselor Seats
- Used Counselor Seats
- Monthly Image Quota Used
- Monthly Video Quota Used
- Mock Test Vouchers Used
- Interview Prep Usage
- English Mock Test Vouchers Used
- Pending ALO Approvals
- Own Commission Status
- Support Tickets

All metrics must come from real backend data.

No hardcoded production values.

Provide:

- loading state
- empty state
- error state
- permission state

============================================================
6. PARTNER USER MANAGEMENT
============================================================

Partner Super Admin may create:

- Partner Counselor
- Partner Application Assistant
- Partner Marketing Assistant
- Partner Document Assistant
- Partner Viewer

BUT:

The Partner Super Admin can assign only permissions included in the ALO-approved partner package.

Partner cannot:

- create ALO employees
- create unlimited users
- modify ALO permissions
- access ALO internal CRM
- access another partner
- access ALO salary
- access ALO HR
- access ALO internal audit
- access confidential B2B provider data
- access internal ALO notes
- access unrelated ALO finance

============================================================
7. DEFAULT PARTNER USER LIMIT
============================================================

DEFAULT:

partner_max_users = 3

This means:

1 Partner Super Admin
+
2 Partner Employees/Counselors

The system must enforce this server-side.

When:

current_user_count >= partner_max_users

block creation.

Return a clear message:

"Your current partner user limit has been reached. Please request additional seats from ALO Education."

============================================================
8. EXTRA SEAT REQUEST
============================================================

Partner Super Admin can request additional seats.

Flow:

Partner requests seats
↓
Create request
↓
ALO Super Admin notification
↓
Super Admin reviews
↓
Approve / Reject
↓
If approved:
increase partner limit
↓
audit log
↓
notify partner

Table:

partner_user_seat_requests

Fields:

id
partner_id
requested_by
current_limit
requested_extra_seats
reason
status
reviewed_by
review_note
created_at
updated_at

Statuses:

PENDING
APPROVED
REJECTED
CANCELLED

============================================================
9. PARTNER MARKETING STUDIO
============================================================

B2B partners receive controlled ALO marketing automation benefits.

Partner can submit:

- marketing idea
- country
- university
- course
- intake
- target audience
- language
- CTA
- platform
- preferred style

AI generates:

- Facebook caption
- Instagram caption
- hashtags
- image prompt
- image/poster draft
- 30-second video script
- video prompt
- short reel caption
- CTA text

Everything is initially a draft.

============================================================
10. PARTNER MARKETING QUOTA
============================================================

DEFAULT STARTER PACKAGE:

15 images/month

10 videos/month

30-second maximum video duration

Quota resets monthly.

Server must calculate current period usage.

Never trust frontend counters.

Before image generation:

checkQuotaBeforeAction(
    partner,
    MARKETING_IMAGE_GENERATION
)

If:

images_used >= image_limit

reject request.

Message:

"Monthly image quota finished. Request extra quota from ALO Education."

Before video generation:

checkQuotaBeforeAction(
    partner,
    MARKETING_VIDEO_GENERATION
)

If exceeded:

"Monthly video quota finished. Request extra quota from ALO Education."

============================================================
11. PARTNER MARKETING TABLES
============================================================

Use existing equivalent models if present.

Only add missing fields/tables.

partner_marketing_quotas

id
partner_id
monthly_image_limit
monthly_video_limit
video_duration_limit_seconds
auto_publish_allowed
requires_alo_approval
status
created_at
updated_at

partner_marketing_usage

id
partner_id
month_year
images_used
videos_used
ideas_submitted
posts_scheduled
posts_published
created_at
updated_at

partner_marketing_requests

id
partner_id
requested_by
idea
country_id
university_id
course_id
intake
platform
language
caption
hashtags
image_prompt
video_prompt
video_script
cta_text
asset_id
approval_status
published_url
created_at
updated_at

============================================================
12. MARKETING WORKFLOW
============================================================

Idea submitted
↓
AI draft generated
↓
Image/video draft generated
↓
Compliance check
↓
Partner Super Admin approval
↓
Optional ALO approval
↓
Schedule
↓
Publish
↓
Lead captured
↓
CRM timeline
↓
Performance report

Never auto-publish unless:

- package allows it
- feature allows it
- required approvals are satisfied
- social account is approved
- policy checks pass

============================================================
13. VIDEO SAFETY AND QUALITY
============================================================

Maximum partner video length:

30 seconds.

Default:

10 videos/month.

AI-generated videos must:

- use approved/licensed assets
- use approved avatar/person
- avoid unauthorized face cloning
- avoid unauthorized voice cloning
- avoid fake testimonials
- avoid fake visa success
- avoid fake admission guarantees
- avoid fabricated university claims
- remain draft until required approval

Video formats:

1:1
4:5
9:16
16:9

============================================================
14. SOCIAL MEDIA CONNECTION
============================================================

Partner can connect:

- Facebook Page
- Instagram account

ONLY when ALO approval is required and granted.

Store:

- account ID
- platform
- masked access token
- token expiry
- connection status
- last sync
- connected_by
- approved_by
- status

Never display full access token.

Encrypt credentials at rest.

Audit:

- connect
- disconnect
- token update
- token rotation
- account view

If token is compromised/expired:

show rotation/reconnection warning.

============================================================
15. PARTNER STUDENT BENEFIT ENGINE
============================================================

CRITICAL RULE:

Partner students receive special ALO benefits ONLY when they have an active ALO application.

Eligibility:

student_has_alo_application = true

AND application status is not:

CANCELLED
CLOSED
REJECTED_BEFORE_SUBMISSION

If no eligible ALO application:

DO NOT grant:

- UKVI interview preparation
- credibility interview preparation
- university interview preparation
- AI interview practice
- English mock test vouchers
- partner test vouchers

Return:

"This benefit is available after an eligible ALO application becomes active."

============================================================
16. ELIGIBLE STUDENT BENEFITS
============================================================

For each eligible partner student/application:

1 university application benefit package

1 university/interview mock benefit

UKVI / credibility interview preparation

3 English mock test vouchers

AI speaking practice

Document checklist

Application guidance

Benefits must be linked to:

student_id
partner_id
application_id

Never create global reusable benefits detached from the application.

============================================================
17. BENEFIT ENTITLEMENTS
============================================================

Use existing equivalent benefit models if available.

Otherwise create:

student_benefit_entitlements

id
student_id
partner_id
application_id
benefit_type
limit_count
used_count
status
created_by
created_at
updated_at

Benefit types:

UKVI_INTERVIEW_PREP
UNIVERSITY_INTERVIEW_PREP
ENGLISH_MOCK_TEST
AI_SPEAKING_PRACTICE
DOCUMENT_CHECKLIST
APPLICATION_GUIDANCE

Rules:

UKVI_INTERVIEW_PREP:
1 benefit/application

UNIVERSITY_INTERVIEW_PREP:
1 benefit/application

ENGLISH_MOCK_TEST:
3 uses

AI_SPEAKING_PRACTICE:
1 approved benefit/application unless package overrides

DOCUMENT_CHECKLIST:
1 application

APPLICATION_GUIDANCE:
1 application

============================================================
18. ENGLISH MOCK TEST VOUCHERS
============================================================

Create:

student_mock_test_vouchers

id
voucher_code
student_id
partner_id
application_id
test_type
usage_limit
used_count
expires_at
status
created_at
updated_at

Default:

usage_limit = 1

Generate maximum 3 vouchers per eligible student.

Statuses:

AVAILABLE
USED
EXPIRED
CANCELLED

Never generate vouchers before eligibility.

Prevent:

duplicate generation
voucher sharing
cross-student usage
cross-partner usage
expired use
cancelled use

Voucher usage must be atomic.

============================================================
19. PARTNER BENEFIT ACTIVATION
============================================================

Trigger when:

Partner student application is created
AND
ALO approves/activates application

Then:

create benefit entitlements
create eligible voucher records
notify Partner Super Admin
notify Student

Student portal should show:

- eligible benefits
- voucher codes
- usage count
- remaining count
- expiry
- interview preparation access

Do not show internal ALO approval logic.

============================================================
20. ALO EMPLOYEE MANAGEMENT
============================================================

Super Admin controls employee account creation.

Supported designations:

Chairman
CEO
Director
Office Manager
Country Manager
Counselor
Senior Counselor
Application Manager
Application Team
Visa Officer
Finance Officer
Marketing Manager
Marketing Officer
Front Desk
HR Manager
Support Staff
Viewer

Every employee can have custom permissions.

Designation does NOT automatically bypass RBAC.

============================================================
21. EMPLOYEE ACCOUNT CREATION
============================================================

Super Admin creates:

Full name
Company email
Designation
Department
Office
Role
Permission package
Status

Then:

create employee
↓
generate activation token
↓
hash token
↓
send activation email
↓
employee opens activation URL
↓
employee creates password
↓
employee logs in
↓
employee completes profile
↓
profile submitted
↓
HR/Admin reviews
↓
approved/correction required

Employee cannot login before password activation.

============================================================
22. ACTIVATION TOKEN SECURITY
============================================================

Table:

employee_activation_tokens

id
employee_id
token_hash
expires_at
used_at
status
created_at

Never store raw activation token.

Activation token must:

- be random
- be single use
- expire
- be invalidated after successful use
- be revocable
- support resend
- create audit event

Expired tokens must not authenticate.

============================================================
23. ACTIVATION EMAIL
============================================================

Subject:

Activate your ALO Education employee account

Include:

- employee name
- role/designation
- activation link
- password creation instructions
- support contact

Do not include plaintext password.

============================================================
24. EMPLOYEE PROFILE
============================================================

Reuse existing employee profile system if available.

Sections:

PERSONAL:

Full name
Photo
DOB
Gender
Marital status
Nationality
Phone
Company email
Personal email
Present address
Permanent address

EMPLOYMENT:

Employee ID
Designation
Department
Office
Joining date
Employment type
Reporting manager
Status
Work schedule
Weekly holiday

EDUCATION:

Degree
Institution
Passing year
Result
Certificate

EMERGENCY:

Name
Relation
Phone
Address

SALARY / FINANCE:

Salary
Allowance
Bonus
Bank
Payment method
Tax
Effective date

DOCUMENTS:

NID
Passport
Academic certificates
Experience letter
Appointment letter
Contract
NDA
Other HR documents

LEAVE / ATTENDANCE:

Leave balance
Leave request
Attendance
Late records
Absence

SYSTEM:

Login records
Device/IP history
Permission history
Audit logs

============================================================
25. EMPLOYEE PROFILE PRIVACY
============================================================

Only:

Employee themselves
ALO Super Admin
Chairman
HR Manager with explicit permission

can view employee private profile.

Normal employees cannot view:

- salary
- bank information
- emergency contacts
- NID
- passport
- HR documents
- leave records
- private employee documents

Backend must enforce this.

============================================================
26. EMPLOYEE PROFILE STATUS
============================================================

INCOMPLETE
SUBMITTED
UNDER_REVIEW
APPROVED
CORRECTION_REQUIRED
SUSPENDED
INACTIVE
TERMINATED

============================================================
27. EMPLOYEE DATABASE MODELS
============================================================

Audit existing schema first.

If equivalent models exist, reuse them.

Only add missing fields.

employees:

id
employee_code
user_id
full_name
company_email
personal_email
phone
designation
department_id
office_id
joining_date
employment_type
reporting_manager_id
profile_status
status
created_at
updated_at

employee_profiles:

id
employee_id
dob
gender
marital_status
nationality
present_address
permanent_address
photo
created_at
updated_at

employee_education:

id
employee_id
degree
institution
passing_year
result
certificate_path
created_at
updated_at

employee_emergency_contacts:

id
employee_id
name
relation
phone
address
created_at
updated_at

employee_salary:

id
employee_id
salary_amount
allowance
bonus
bank_name
bank_account
payment_method
effective_date
visibility
created_at
updated_at

employee_documents:

id
employee_id
document_type
file_path
status
reviewer_id
review_note
created_at
updated_at

employee_activation_tokens:

id
employee_id
token_hash
expires_at
used_at
status
created_at

============================================================
28. SALARY SECURITY
============================================================

Salary is highly restricted.

Only authorized roles may:

view
create
update
download
export

Every access creates:

audit log

Every salary mutation creates:

audit log

Never expose salary through:

- general employee API
- partner API
- student API
- marketing API
- application API
- visa API

unless explicit permission exists.

============================================================
29. SUPER ADMIN ACCESS CONTROL CENTER
============================================================

Route:

/admin/access-control-center

Create or patch existing equivalent.

Sections:

1. ALO Employee Roles
2. B2B Partner Packages
3. Partner User Seat Limits
4. Partner Marketing Quotas
5. Partner Student Benefit Rules
6. Mock Test Voucher Rules
7. Application/B2B Visibility
8. Document Access
9. Salary/HR Access
10. AI Feature Access
11. Social Media Posting Access
12. Email/SMS/WhatsApp Limits

Super Admin can:

- create permission packages
- assign packages
- remove packages
- set partner user limit
- set image quota
- set video quota
- set video duration
- set mock test limit
- approve extra seats
- reject extra seats
- approve extra quota
- reject extra quota
- suspend partner feature
- suspend employee feature
- view usage
- view audit history

============================================================
30. PARTNER PACKAGE SYSTEM
============================================================

Package types:

STARTER
GROWTH
PREMIUM

STARTER DEFAULT:

1 Super Admin
2 Employees
15 images/month
10 videos/month
30 seconds max video
3 English mock vouchers per eligible student
1 interview prep per eligible student
ALO approval required where configured

GROWTH:

Custom seats
Custom image quota
Custom video quota
Optional landing page
More campaign support

PREMIUM:

Custom agreement
Higher quotas
Dedicated support
Additional integrations

Every package must be editable by Super Admin.

============================================================
31. PARTNER PACKAGE TABLE
============================================================

partner_packages

id
name
description
default_user_limit
monthly_image_limit
monthly_video_limit
video_duration_limit_seconds
english_mock_voucher_limit
interview_prep_limit
auto_publish_allowed
requires_alo_approval
status
created_at
updated_at

partner_package_assignments

id
partner_id
package_id
assigned_by
starts_at
expires_at
status
created_at
updated_at

============================================================
32. FEATURE ACCESS RULES
============================================================

Create/reuse:

feature_access_rules

id
owner_type
owner_id
feature_key
is_enabled
limit_value
requires_approval
created_by
updated_by
created_at
updated_at

owner_type may include:

USER
EMPLOYEE
PARTNER
PARTNER_PACKAGE
ROLE

Do not create conflicting permission systems if an existing RBAC system already exists.

Integrate with the existing RBAC architecture.

============================================================
33. EXTRA QUOTA REQUESTS
============================================================

extra_quota_requests

id
partner_id
request_type
current_limit
requested_limit
reason
status
reviewed_by
review_note
created_at
updated_at

Request types:

IMAGE_QUOTA
VIDEO_QUOTA
VIDEO_DURATION
USER_SEATS
MOCK_TEST_VOUCHERS
INTERVIEW_PREP
OTHER

Workflow:

REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED

============================================================
34. ACCESS CHECK ENGINE
============================================================

Implement or reuse backend helpers:

canAccessFeature(user_id, feature_key)

getQuota(owner_type, owner_id, feature_key)

checkQuotaBeforeAction(owner_type, owner_id, feature_key)

recordUsage(owner_type, owner_id, feature_key)

canViewEmployeePrivateProfile(viewer_id, employee_id)

canViewEmployeeSalary(viewer_id, employee_id)

canViewEmployeeDocument(viewer_id, employee_id, document_id)

canViewB2BDetails(user_id, application_id)

canUseStudentBenefit(student_id, benefit_type)

canUseVoucher(student_id, voucher_id)

canManagePartnerUser(user_id, target_user_id)

canAccessPartnerResource(user_id, partner_id)

Every sensitive controller MUST use these checks.

============================================================
35. QUOTA ENGINE
============================================================

Quota engine must:

- identify owner
- identify feature
- identify current billing/month period
- load approved limit
- calculate actual usage
- atomically reserve/use quota
- reject over-limit action
- record usage
- create audit event

Prevent race conditions.

Two simultaneous generation requests must not allow quota bypass.

============================================================
36. MARKETING QUOTA USAGE
============================================================

Track:

images_used
videos_used
ideas_submitted
posts_scheduled
posts_published

Monthly period:

YYYY-MM

When month changes:

usage automatically starts at zero for the new period.

Do not delete historical usage.

============================================================
37. PARTNER SOCIAL PUBLISHING
============================================================

Publishing requires:

authenticated user
+
partner ownership
+
social account connected
+
account approved
+
feature enabled
+
quota available if applicable
+
required Partner approval
+
ALO approval if required
+
policy check
+
audit log

No direct API bypass.

============================================================
38. STUDENT BENEFIT SECURITY
============================================================

A student must never be able to modify:

- benefit limit
- used_count
- eligibility
- application_id
- partner_id
- voucher status
- voucher ownership

All benefit consumption must be server-controlled.

============================================================
39. APPLICATION CONNECTION
============================================================

When an application is created:

validate student
validate partner
validate application source
validate active status
create/attach benefit eligibility when applicable

Do not activate benefits merely because a student record exists.

Eligibility is application-driven.

============================================================
40. BENEFIT REVOCATION
============================================================

If an application becomes:

CANCELLED
CLOSED
REJECTED_BEFORE_SUBMISSION

then new benefit usage must be blocked.

Existing benefit records should be marked:

SUSPENDED

unless business policy explicitly allows continued access.

All changes must be audited.

============================================================
41. REPORTING
============================================================

SUPER ADMIN reports:

- Partner user seat usage
- Partner marketing usage
- Image quota usage
- Video quota usage
- Voucher usage
- Mock test usage
- Partner application conversion
- Partner feature usage
- Employee access report
- Employee profile completion
- Salary access audit
- B2B visibility audit
- Restricted feature attempts
- Quota violations
- Approval history

PARTNER SUPER ADMIN reports:

- Own students
- Own applications
- Own employees
- Own quota usage
- Own vouchers
- Own marketing posts
- Own leads
- Own performance

Partner reports MUST be tenant isolated.

============================================================
42. NOTIFICATION SYSTEM
============================================================

Notify ALO Super Admin when:

- partner requests extra seat
- partner requests marketing quota
- partner quota exceeded
- restricted feature attempt occurs
- employee profile submitted
- salary/document accessed by authorized user
- B2B detail viewed
- voucher limit reached
- repeated quota violations occur

Notify Partner Super Admin when:

- quota near limit
- quota finished
- extra quota approved
- extra quota rejected
- student benefit activated
- voucher generated
- application approved
- application submitted

Use existing notification engine if available.

============================================================
43. NOTIFICATION AUDIT
============================================================

Every notification should have:

recipient
event
channel
status
created_at
sent_at
failure_reason if applicable

Do not create duplicate notification systems.

============================================================
44. AUDIT LOGGING
============================================================

Audit all sensitive actions.

Minimum actions:

PARTNER:

partner_created
partner_updated
partner_user_created
partner_user_updated
partner_user_deleted
partner_seat_requested
partner_seat_approved
partner_seat_rejected
partner_package_changed
partner_feature_enabled
partner_feature_disabled

QUOTA:

quota_changed
quota_requested
quota_approved
quota_rejected
quota_exceeded
quota_usage_recorded

MARKETING:

marketing_asset_generated
marketing_video_generated
marketing_post_scheduled
marketing_post_published
social_account_connected
social_account_disconnected

STUDENT BENEFITS:

benefit_created
benefit_activated
benefit_suspended
voucher_created
voucher_used
voucher_expired
voucher_cancelled

EMPLOYEE:

employee_created
employee_activation_sent
employee_activation_completed
employee_profile_viewed
employee_profile_updated
employee_salary_viewed
employee_salary_updated
employee_document_viewed
employee_document_downloaded
employee_permission_changed

B2B:

b2b_detail_viewed
b2b_detail_updated

Every sensitive action must include:

actor_user_id
actor_role
action
entity_type
entity_id
partner_id if applicable
student_id if applicable
before_value where appropriate
after_value where appropriate
ip/session if available
timestamp

============================================================
45. AUDIT LOG IMMUTABILITY
============================================================

Normal users cannot:

- edit audit logs
- delete audit logs
- modify audit timestamps

Only approved system/admin mechanisms may access audit history.

============================================================
46. PRIVATE FILE SECURITY
============================================================

Employee documents, salary documents, B2B documents and sensitive partner files must NOT be publicly accessible.

Do not expose:

/uploads/private/file.pdf

as a public URL.

Use protected download endpoint:

authenticate
+
authorize
+
ownership check
+
permission check
+
audit
+
stream file

Private documents require signed/authorized access.

============================================================
47. API SECURITY
============================================================

Every protected API must enforce:

authentication
RBAC
tenant ownership
resource ownership
feature access
quota
validation
audit
safe errors

Never trust:

client-provided role
client-provided partner_id
client-provided owner_id
client-provided quota
client-provided used_count
client-provided permission
client-provided benefit status

Determine these server-side.

============================================================
48. CSRF / INPUT / OUTPUT SECURITY
============================================================

All forms:

CSRF protected

All SQL:

prepared statements / ORM parameterization

All output:

properly escaped

All uploads:

validate MIME
validate extension
validate size
validate storage path
prevent executable uploads

Never store:

plaintext passwords
plaintext activation tokens
plaintext social tokens
unprotected private credentials

============================================================
49. RATE LIMITING
============================================================

Apply rate limits to:

- login
- activation
- resend activation
- voucher redemption
- mock test launch
- AI generation
- image generation
- video generation
- social publishing
- bulk actions
- quota requests

============================================================
50. PARTNER SUPPORT REQUEST
============================================================

Partner Super Admin can create:

- technical issue
- quota request
- feature request
- account issue
- marketing issue
- application issue
- student benefit issue

Fields:

ticket_id
partner_id
created_by
category
priority
subject
description
attachment
status
assigned_to
created_at
updated_at

Partner cannot see internal ALO-only comments.

============================================================
51. SUPER ADMIN ACTING-AS
============================================================

If existing Acting-As functionality exists, reuse it.

Super Admin may act as:

- Partner Super Admin
- Employee
- Marketing Manager
- Application Manager
- Visa Officer

When Acting-As:

show persistent banner:

"AUDIT ENABLED: Super Admin is acting as {ROLE}. All actions are logged."

Track:

actual_actor
acting_as_user
acting_as_role
timestamp
action
resource

Super Admin must not lose master identity in audit records.

============================================================
52. ACCESS CONTROL CENTER UI
============================================================

Create a command center with:

Employee Access
Partner Packages
Partner Seats
Marketing Quotas
Student Benefits
Voucher Rules
Feature Access
Sensitive Data Access
Social Access
AI Access
Application Visibility
B2B Visibility
Audit

Use:

- search
- filters
- role filters
- partner filters
- permission matrix
- quota editor
- approval drawer
- audit timeline
- usage charts

No spreadsheet-only interface.

============================================================
53. PERMISSION MATRIX
============================================================

At minimum support:

employee.view
employee.create
employee.update
employee.delete

employee.profile.view
employee.profile.update
employee.profile.private.view

employee.salary.view
employee.salary.create
employee.salary.update

employee.documents.view
employee.documents.download

employee.permissions.view
employee.permissions.update

partner.view
partner.create
partner.update

partner.users.view
partner.users.create
partner.users.update
partner.users.suspend

partner.seats.view
partner.seats.request
partner.seats.approve

partner.package.view
partner.package.assign
partner.package.update

partner.quota.view
partner.quota.update
partner.quota.request
partner.quota.approve

partner.marketing.view
partner.marketing.generate
partner.marketing.schedule
partner.marketing.publish
partner.marketing.approve

partner.social.view
partner.social.connect
partner.social.publish

student.benefits.view
student.benefits.manage

student.vouchers.view
student.vouchers.generate
student.vouchers.use
student.vouchers.cancel

b2b.view
b2b.manage

audit.view
audit.export

============================================================
54. ROLE DEFAULTS
============================================================

SUPER_ADMIN:

ALL

CHAIRMAN:

ALL

ADMIN/MANAGER:

permission based

HR_MANAGER:

employee management according to permission

FINANCE:

finance-related access only

MARKETING_MANAGER:

marketing features only according to permission

APPLICATION_MANAGER:

application features only

VISA_OFFICER:

visa features only

COUNSELOR:

assigned student scope only

PARTNER_SUPER_ADMIN:

own partner scope + ALO-approved package

PARTNER_EMPLOYEE:

own partner scope + assigned permissions

STUDENT:

own scope only

============================================================
55. CROSS-MODULE CONNECTIONS
============================================================

This system must integrate with existing:

Student Portal
Partner Portal
Staff CRM
Super Admin Portal
Course Finder
University Database
Document Engine
Application Engine
Visa Engine
Finance
Commission Engine
Communication Timeline
Marketing Engine
AI AgentOS
Reports
Audit Logs
Notifications

Do not build duplicate versions.

Reuse existing service layers.

============================================================
56. STUDENT PORTAL
============================================================

Student should see:

- active application
- eligible benefits
- English mock vouchers
- interview preparation
- AI speaking practice
- document checklist
- application guidance
- safe marketing communication
- messages

Student must NOT see:

- partner internal quota
- partner commission
- B2B provider details
- partner employee details
- ALO internal notes
- internal audit
- salary
- unrelated student data

============================================================
57. PARTNER PORTAL
============================================================

Partner Super Admin sees:

- own company
- own users
- own students
- own leads
- own applications
- own marketing
- own quotas
- own benefits
- own reports
- own support

Partner employees see only what their permission allows.

============================================================
58. COURSE FINDER CONNECTION
============================================================

Partner Course Finder must use the existing verified:

- course database
- university database
- country data
- intake data
- tuition data
- requirements

Never generate fake university/course information.

If AI generates marketing copy from Course Finder data:

RAG must retrieve verified source records.

============================================================
59. AI MARKETING CONNECTION
============================================================

If existing ALO Marketing AgentOS exists:

reuse it.

Partner AI access must be permission-controlled.

Agents may generate:

- captions
- hashtags
- image prompts
- video scripts
- campaign ideas
- CTA
- student-safe content

Agents cannot independently bypass:

- quota
- approval
- publishing rules
- tenant isolation
- audit

============================================================
60. PROTECTED AI MODE
============================================================

AI cannot automatically:

- publish content
- exceed quota
- send bulk messages
- access private student information
- access salary
- access B2B secrets
- change permissions
- create ALO employees
- approve its own risky action
- modify audit logs

High-risk actions require human approval.

============================================================
61. DATA VISIBILITY MATRIX
============================================================

Student:

OWN DATA ONLY

Partner:

OWN TENANT ONLY

Partner Employee:

OWN TENANT + ASSIGNED FEATURES

Counselor:

ASSIGNED STUDENTS

Application Team:

APPLICATION DATA

Visa Officer:

VISA DATA + permitted application information

Finance:

FINANCE DATA

HR:

HR DATA

Marketing:

MARKETING DATA

Super Admin:

ALL

Never expose data merely because the frontend has a route.

============================================================
62. SECURITY NEGATIVE TESTS
============================================================

Explicitly test:

1. Partner A cannot access Partner B student.

2. Partner A cannot access Partner B application.

3. Partner A cannot access Partner B marketing quota.

4. Partner A cannot access Partner B vouchers.

5. Partner employee cannot access another partner.

6. Partner cannot create fourth user when limit is 3.

7. Partner cannot modify user limit.

8. Partner cannot approve own extra seat request.

9. Partner cannot modify package.

10. Partner cannot increase own image quota.

11. Partner cannot exceed 15 images/month by API manipulation.

12. Partner cannot exceed 10 videos/month by API manipulation.

13. Partner cannot create video >30 seconds.

14. Partner cannot access ALO employee records.

15. Partner cannot access employee salary.

16. Partner cannot access employee HR documents.

17. Student cannot use benefit without eligible application.

18. Student cannot modify voucher usage.

19. Student cannot use another student's voucher.

20. Student cannot access another student's benefit.

21. Expired voucher cannot be used.

22. Cancelled voucher cannot be used.

23. Counselor cannot see partner confidential data.

24. Finance cannot see B2B details without permission.

25. Visa Officer cannot see unrelated partner information.

26. Marketing cannot access salary.

27. Public user cannot access private documents.

28. Activation token cannot be reused.

29. Expired activation token cannot activate account.

30. Unauthorized user cannot view salary API.

31. Unauthorized user cannot download HR document.

32. Unauthorized user cannot connect social account.

33. Unauthorized user cannot publish social content.

34. AI cannot bypass quota.

35. AI cannot bypass approval.

36. AI cannot bypass tenant ownership.

37. Employee cannot modify their own permissions.

38. Partner cannot create ALO employee.

39. Partner cannot access audit logs outside own allowed scope.

40. Normal user cannot delete audit logs.

============================================================
63. AUTOMATED TESTING
============================================================

Add or reuse tests for:

RBAC
tenant isolation
quota
benefit eligibility
voucher usage
activation
private profile
salary security
document security
partner user creation
extra seat workflow
marketing generation
social publishing
audit logging

Run existing test suite first.

Then run targeted tests.

Do not delete existing tests.

============================================================
64. DATABASE MIGRATION RULE
============================================================

Before migration:

inspect existing schema.

Do not create duplicate tables if equivalents exist.

If an equivalent table exists:

map the requested feature to it.

Add only missing columns/indexes/relations.

Preserve existing production data.

Use safe migration.

Never:

DROP DATABASE
DROP TABLE
TRUNCATE production tables
DELETE existing users
DELETE existing applications
DELETE existing partners

without explicit authorization.

============================================================
65. DATABASE INDEXING
============================================================

Add appropriate indexes for:

partner_id
student_id
application_id
employee_id
user_id
feature_key
status
created_at
updated_at
month_year
voucher_code
token_hash

Unique constraints where appropriate:

voucher_code
employee_code
company_email
partner-specific user identifiers

============================================================
66. FINAL UI QUALITY
============================================================

Use existing ALO design system.

Preferred:

white background
ALO blue navigation
ALO orange CTA
soft gray background
rounded cards
clean typography
responsive PWA
desktop optimized
mobile optimized
drawers
modals
timelines
cards
charts
usage meters
permission matrices
approval panels

Do not create:

fake KPI numbers
fake charts
fake employees
fake partners
fake quota usage
fake vouchers
fake audit entries

If database is empty:

show proper empty state.

============================================================
67. ERROR HANDLING
============================================================

Every workflow must provide:

loading
success
validation error
authorization error
quota error
network error
server error
empty state

Do not silently fail.

For 403:

show permission message.

For quota:

show current usage and approved limit.

For expired activation:

offer controlled resend flow.

============================================================
68. PERFORMANCE
============================================================

Do not load all students/applications/marketing assets at once.

Use:

pagination
cursor pagination where existing architecture supports it
server-side filtering
server-side sorting
lazy loading
query caching where appropriate

Protect dashboard from N+1 queries.

============================================================
69. FINAL ROUTE VERIFICATION
============================================================

Verify:

/partner-admin/dashboard
/partner-admin/company-profile
/partner-admin/users
/partner-admin/users/create
/partner-admin/roles
/partner-admin/students
/partner-admin/leads
/partner-admin/applications
/partner-admin/documents
/partner-admin/course-finder
/partner-admin/marketing-studio
/partner-admin/content-generator
/partner-admin/image-generator
/partner-admin/video-generator
/partner-admin/social-scheduler
/partner-admin/mock-tests
/partner-admin/interview-prep
/partner-admin/voucher-codes
/partner-admin/usage-quota
/partner-admin/reports
/partner-admin/support-request
/partner-admin/settings
/admin/access-control-center

Also verify all existing CRM routes remain functional.

============================================================
70. FINAL SELF-AUDIT
============================================================

Before claiming completion, verify:

[ ] Existing project audited first
[ ] Existing components reused
[ ] Existing models reused
[ ] No duplicate systems created
[ ] No working modules deleted
[ ] Partner tenant isolation works
[ ] Partner Super Admin works
[ ] Partner employee management works
[ ] Default limit = 3 users
[ ] 1 Partner Super Admin + 2 employees enforced
[ ] Extra seat request works
[ ] Super Admin approval works
[ ] Partner package system works
[ ] Starter package works
[ ] Growth package works
[ ] Premium package works
[ ] Image quota = 15/month
[ ] Video quota = 10/month
[ ] Video max duration = 30 seconds
[ ] Monthly reset works
[ ] Quota enforcement works server-side
[ ] Marketing Studio works
[ ] AI generation works through real backend
[ ] Approval workflow works
[ ] Social connection security works
[ ] Social publishing permission works
[ ] Partner student eligibility works
[ ] No application = no benefit
[ ] Active application = benefit eligibility
[ ] 3 English mock vouchers generated correctly
[ ] 1 interview/mock benefit enforced
[ ] Voucher ownership enforced
[ ] Voucher usage atomic
[ ] Voucher expiry works
[ ] Employee creation works
[ ] Activation email works
[ ] Activation token expires
[ ] Password creation works
[ ] Employee profile works
[ ] HR approval works
[ ] Private employee profile protected
[ ] Salary protected
[ ] HR documents protected
[ ] Employee permission management works
[ ] Super Admin Access Control Center works
[ ] Feature access engine works
[ ] Quota engine works
[ ] Audit logs work
[ ] Notifications work
[ ] Reports work
[ ] Partner reports tenant isolated
[ ] Cross-module connections work
[ ] Student portal connection works
[ ] Course Finder connection works
[ ] Application connection works
[ ] Visa connection works where applicable
[ ] Marketing AgentOS connection works
[ ] No frontend-only authorization
[ ] No fake data
[ ] No hardcoded secrets
[ ] No public private-file URLs
[ ] No duplicate RBAC
[ ] No duplicate quota engine
[ ] No duplicate notification engine
[ ] No duplicate audit engine
[ ] Existing application still works
[ ] Existing visa system still works
[ ] Existing marketing system still works
[ ] Existing student portal still works
[ ] Existing partner portal still works
[ ] Existing Super Admin still works

============================================================
71. REQUIRED VERIFICATION COMMANDS
============================================================

Run the project's existing package manager commands.

At minimum, where applicable:

npm install

npm run typecheck

npm run lint

npm run build

npx prisma validate

npx prisma generate

Run migrations safely using the project's existing migration mechanism.

If backend/server.js exists:

node --check backend/server.js

If tests exist:

npm test

or the project's configured test command.

Do not invent successful results.

============================================================
72. REQUIRED FINAL REPORT
============================================================

Return an evidence-based final report.

SECTION A:
EXISTING SYSTEM AUDIT

Show:

feature
existing location
status
reuse/patch/build decision

SECTION B:
REUSED COMPONENTS

List actual files/components/services reused.

SECTION C:
NEW FEATURES ADDED

Only list features genuinely implemented.

SECTION D:
PARTNER PORTAL

Show:

routes
components
APIs
RBAC
tenant isolation

SECTION E:
PARTNER USER LIMIT

Show:

default limit
current enforcement
extra-seat request
approval workflow

SECTION F:
MARKETING QUOTA

Show:

image limit
video limit
duration limit
monthly reset
server-side enforcement
usage tracking

SECTION G:
STUDENT BENEFITS

Show:

eligibility condition
benefits
voucher rules
usage enforcement

SECTION H:
EMPLOYEE MANAGEMENT

Show:

account creation
activation
profile
HR review
private data protection

SECTION I:
SUPER ADMIN ACCESS CONTROL

Show:

route
permissions
packages
quotas
feature access
approval workflows

SECTION J:
DATABASE

List:

existing reused models
new models
new fields
migrations
indexes

SECTION K:
APIs

List actual added/fixed APIs.

SECTION L:
RBAC

Show role/permission enforcement.

SECTION M:
SECURITY

Show actual negative test results.

SECTION N:
AUDIT

Show audit events implemented and verified.

SECTION O:
NOTIFICATIONS

Show implemented notification workflows.

SECTION P:
REPORTS

Show implemented reports.

SECTION Q:
TEST RESULTS

Show exact command output/result.

SECTION R:
FILES CHANGED

List actual changed files.

SECTION S:
REMAINING ITEMS

Anything not implemented must be explicitly listed.

============================================================
73. COMPLETION RULE
============================================================

DO NOT SAY:

"COMPLETE"

unless all critical requirements are actually implemented and verified.

A feature is NOT complete if it only has:

- UI
- placeholder API
- mock data
- hardcoded quota
- frontend-only RBAC
- fake audit log
- fake voucher
- fake notification
- fake activation email
- static dashboard
- non-functional buttons

The feature is COMPLETE only when:

ROUTE
+
UI
+
BACKEND
+
DATABASE
+
RBAC
+
TENANT ISOLATION
+
AUDIT
+
REAL WORKFLOW
+
SECURITY TEST
+
BUILD/TEST VERIFICATION

all exist and work.

If anything critical is missing:

FINAL STATUS:
NOT COMPLETE

Then list exact missing items.

============================================================
74. FINAL DELIVERY LABEL
============================================================

If every critical requirement passes:

ALO_B2B_PARTNER_SUPER_ADMIN_
EMPLOYEE_ACCESS_QUOTA_MARKETING_
STUDENT_BENEFIT_CONTROL_COMPLETE

If not:

ALO_B2B_PARTNER_SUPER_ADMIN_
EMPLOYEE_ACCESS_QUOTA_MARKETING_
STUDENT_BENEFIT_CONTROL_NOT_COMPLETE

Do not inflate the status.

Evidence beats claims.
Existing code beats duplication.
Backend authorization beats frontend hiding.
Real workflows beat UI demonstrations.
============================================================
END OF MASTER IMPLEMENTATION PROMPT
============================================================



SERVICES + SCHOLARSHIPS + RESOURCES COMPLETE UNIFIED REQUIREMENTS Build and integrate only these three systems into the existing ALO Education website:
1. Services
2. Scholarships
3. Resources
Do not rebuild the existing website from zero. Use the existing ALO Education architecture, authentication, database, CRM, public navbar, branding, routing, and admin system. The goal is to make these three areas deep, trustworthy, interconnected, searchable, database-driven, and genuinely useful enough that a student can understand the subject independently and then confidently proceed with ALO Education.
	1	GLOBAL ALO DESIGN SYSTEM Use:

Background: #FFFFFF
Primary Blue: #0057B8
CTA Orange: #E8501A
Text: #0F172A
Soft Background: #F8FAFC
Border: #E2E8F0
Success: #10B981
Warning: #F59E0B
Danger: #EF4444
Rules:
* Premium education consultancy design
* White-first interface
* No black/dark hero overlays
* No fake information
* No lorem ipsum
* No fabricated statistics
* No unverified scholarship claims
* No fake success rates
* No stolen/copyrighted images
* Use official sources wherever applicable
* Every factual time-sensitive item must have last_verified_at
* Responsive mobile/tablet/desktop
* Cards should have consistent height
* Buttons minimum height: 48px
* Accessible keyboard navigation
* Proper semantic HTML
* SEO-friendly pages
* Lazy-load images
* Breadcrumb navigation
* Related-content system
* FAQ accordion
* Search where appropriate
* Internal linking between related pages
	2	CORE PRINCIPLE These must NOT be simple grid pages. The architecture must be:

LIST / DIRECTORY
      ↓
DETAIL PAGE
      ↓
COMPLETE INFORMATION
      ↓
FAQ
      ↓
RELATED QUESTIONS
      ↓
RELATED SERVICES
      ↓
RELATED SCHOLARSHIPS
      ↓
RELATED RESOURCES
      ↓
COURSE FINDER / CONSULTATION / APPLICATION
For example:

Services
   ↓
Visa Guidance
   ↓
Complete Visa Guidance Page
   ↓
Country-specific visa information
   ↓
Required documents
   ↓
Timeline
   ↓
Common mistakes
   ↓
FAQs
   ↓
Related resources
   ↓
Related scholarships
   ↓
Book Consultation
The same architecture applies to Scholarships and Resources. 3. SERVICES SYSTEM Public route

/services
/services/{service-slug}
Example:

/services
/services/personalized-counselling
/services/university-selection
/services/course-matching
/services/application-assistance
/services/sop-cv-support
/services/document-checking
/services/visa-guidance
/services/interview-preparation
/services/english-test-preparation
/services/financial-planning
/services/scholarship-guidance
/services/pre-departure-orientation
/services/post-arrival-support
/services/career-counselling
1. SERVICES DIRECTORY PAGE Create a premium /services page. Hero Headline: Complete Support for Your Study Abroad Journey Subtitle: Provide professional guidance from course selection and university applications to visa preparation, pre-departure planning and post-arrival support. CTA:
* Book Free Consultation
* Explore Course Finder
1. SERVICE GRID Create these service cards:
2. Personalized Counseling
3. University Selection
4. Course Matching
5. Application Assistance
6. SOP & CV Support
7. Document Checking
8. Visa Guidance
9. Interview Preparation
10. English Test Preparation
11. Financial Planning
12. Scholarship Guidance
13. Pre-Departure Orientation
14. Post-Arrival Support
15. Career Counseling
Every card MUST link to:

/services/{service-slug}
No dead cards. 6. COMPLETE SERVICE DETAIL PAGE Every service must have its own complete page. Example:

/services/visa-guidance
The page structure should be reusable through database-driven content. Header Show:
* Breadcrumb
* Service category
* Service title
* Short description
* Hero illustration/image
* Book Consultation CTA
* Start Application CTA where applicable
1. SERVICE DETAIL CONTENT Every service page should contain: What This Service Is Explain the service clearly in student-friendly language. Why It Matters Explain why the service is important. Who Needs It? Explain:
* Undergraduate students
* Postgraduate students
* International applicants
* Students changing countries
* Students with study gaps
* Students with complex academic profiles
Only show categories relevant to that service. What ALO Helps With Detailed bullet/list sections. Step-by-Step Process Example:

1. Initial Consultation
2. Profile Assessment
3. Requirement Review
4. Recommendation
5. Document Preparation
6. Submission
7. Follow-up
8. Final Review
Required Documents Dynamic checklist where applicable. Eligibility / Requirements Clearly explain what the student needs. Estimated Timeline Only show verified/general guidance. If timeline varies: Processing times vary by institution, country, intake and applicant circumstances. Confirm your individual timeline with an ALO counselor. Fees If publicly approved: Show service fee. Otherwise: Contact ALO for current service pricing. Never invent a price. 8. SERVICE-SPECIFIC INFORMATION Each service must contain substantially different, relevant information. For example: University Selection Include:
* How university selection works
* Ranking vs suitability
* Location
* Tuition
* Entry requirements
* English requirements
* Scholarships
* Employability considerations
* Intake availability
* Budget matching
* Student profile matching
* Common mistakes
* University comparison
* Final shortlist process
Course Matching Include:
* Subject selection
* Career goals
* Previous education
* Academic eligibility
* Course duration
* Tuition
* Intake
* English requirement
* Career outcomes
* Course Finder connection
* Compare courses
* Application pathway
Application Assistance Include:
* Application process
* Required documents
* Application form
* Document verification
* University submission
* Offer monitoring
* Conditional/unconditional offers
* Deadline management
* Deposit stage
SOP & CV Support Include:
* SOP purpose
* SOP structure
* What universities expect
* Common mistakes
* CV structure
* Academic vs professional CV
* Originality requirements
* Editing process
* Student review process
Do not encourage fabricated experiences or false documents. Document Checking Include:
* Passport
* Academic certificates
* Transcripts
* English test
* Financial documents
* Employment documents
* Sponsor documents
* Translation requirements
* Document consistency
Visa Guidance Include:
* Visa preparation
* Country-specific requirements
* Financial documentation
* Credibility/interview preparation
* Document checklist
* Application preparation
* Common errors
* Official-source verification
Clearly state: Visa rules can change. Current requirements must be verified against official government and visa-authority sources before submission. English Test Preparation Include:
* IELTS
* IELTS UKVI
* PTE
* TOEFL
* Duolingo
* OET
* Other supported tests
Link directly to the existing Language Preparation system. Scholarship Guidance Include:
* Finding scholarships
* Eligibility assessment
* Deadline tracking
* Required documents
* Application strategy
* Scholarship-specific requirements
Link to:

/scholarships
	9	SERVICE FAQ SYSTEM Every service page must have its own FAQ section. Example:

How does ALO help with university selection?
Can ALO compare universities?
How long does the process take?
What documents are required?
Can I use the service before choosing a course?
Can I apply myself after receiving guidance?
FAQs must be database-driven. Clicking a question opens the answer. Use accordion behavior. 10. RELATED QUESTIONS At the bottom of every service page: You May Also Want to Know Show 5-8 related questions. Example:

What documents are needed for UK admission?
Can I study abroad with a study gap?
How do I choose the right university?
Can I apply without IELTS?
How much does studying abroad cost?
How do scholarships work?
Clicking opens the relevant resource/article/FAQ. 11. RELATED CONTENT Every service detail page should dynamically show: Related Services Related Scholarships Related Resources Related Courses Related Countries Do not show unrelated random content. Use database relationships/tags. 12. SERVICE FINAL CTA Every service detail page ends with: Ready to Take the Next Step? Buttons:

Book Free Consultation
Start Course Finder
Check Eligibility
Chat with Counselor
WhatsApp:

+880 180 502 0101
	13	SCHOLARSHIP SYSTEM Routes:

/scholarships
/scholarships/{scholarship-slug}
1. SCHOLARSHIP DIRECTORY Create a premium scholarship discovery page. Hero: Find Scholarships for Your Study Abroad Journey Subtitle: Discover verified scholarship opportunities and understand their eligibility, funding, deadlines and application requirements.
2. SCHOLARSHIP FILTERS Include:
* Country
* University
* Study level
* Subject
* Scholarship type
* Funding type
* Amount
* Fully funded
* Partially funded
* Tuition reduction
* Merit-based
* Need-based
* International students
* Application open
* Deadline
* Intake
* Search
Never show a scholarship as available unless its database status permits publication. 16. SCHOLARSHIP CARD Each card must show:
* Scholarship name
* University
* Country
* Scholarship type
* Funding amount
* Funding description
* Eligibility summary
* Deadline
* Application status
* Last verified date
Buttons:

View Details
Check Eligibility
Every card MUST link to:

/scholarships/{scholarship-slug}
1. SCHOLARSHIP DETAIL PAGE This must be a complete information page, not a short card expanded into a page. Structure: Scholarship Overview
* Scholarship name
* University
* Country
* Study level
* Subject
* Scholarship type
* Funding type
What Does It Cover? Clearly separate:
* Tuition
* Living costs
* Accommodation
* Travel
* Insurance
* Other funding
Only display what is verified. Scholarship Amount Show exact amount where officially verified. Otherwise: Funding varies. Check official scholarship terms. Eligibility Detailed requirements:
* Nationality
* Academic qualification
* GPA/CGPA
* English requirement
* Course eligibility
* Study level
* Financial criteria if applicable
* Other requirements
Minimum Requirements Clearly distinguish:

Minimum academic requirement
English requirement
Course requirement
Application requirement
Additional requirement
Application Opening Date Application Deadline Expected Decision Timeline Only if officially available. Never invent "results within X days." Required Documents Examples:
* Passport
* Academic certificates
* Transcript
* English test
* CV
* SOP/personal statement
* Recommendation letters
* Financial documents
* Other scholarship-specific documents
Only show applicable documents. 18. HOW TO APPLY FOR SCHOLARSHIP Provide a detailed process:

1. Check eligibility
2. Select eligible course/university
3. Review scholarship conditions
4. Prepare documents
5. Complete admission application if required
6. Complete scholarship application
7. Submit before deadline
8. Monitor application
9. Respond to requests
10. Receive decision
Clearly distinguish scholarships that require a separate scholarship application from those automatically considered with admission. 19. SCHOLARSHIP APPLICATION STRATEGY Include:
* How to improve eligibility
* How to prepare documents
* How to write scholarship statements
* How to demonstrate academic achievement
* How to demonstrate leadership/experience where relevant
* Common mistakes
* Deadline planning
* Application checklist
Never promise scholarship success. 20. SCHOLARSHIP STATUS Show:

Open
Closing Soon
Closed
Upcoming
Needs Verification
Use database status. If verification is outdated:

Needs Manual Verification
Do not present it as currently open. 21. SCHOLARSHIP OFFICIAL SOURCE Every scholarship must store:

source_url
source_name
last_verified_at
verification_status
Show: Official information last verified: [date] Provide a link to the official source where appropriate. Do not copy the official page word-for-word. 22. SCHOLARSHIP FAQ Every scholarship detail page must contain scholarship-specific FAQs. Examples:

Who can apply?
Is this scholarship fully funded?
Do I need IELTS?
Can international students apply?
Is a separate application required?
When does the application open?
What is the deadline?
When are results announced?
Can I apply after receiving an offer?
Can I apply for more than one scholarship?
Answers must come from verified database/source information. 23. SCHOLARSHIP RELATED CONTENT At bottom: Related Scholarships Related Universities Related Courses Related Countries Related Services Related Resources Only relevant items. 24. SCHOLARSHIP FINAL CTA

Check My Scholarship Eligibility
Find Matching Courses
Book Free Consultation
Chat with Counselor
	25	RESOURCES SYSTEM Routes:

/resources
/resources/{category}
/resources/{category}/{article-slug}
Supported categories:
* Blogs
* Visa Guides
* Scholarships
* Application Tips
* Pre-Departure
* Accommodation
* Financial Planning
* English Tests
* Student Visa FAQs
* Study Abroad Guides
1. RESOURCE HUB Create a premium resource hub. Hero: Your Complete Study Abroad Knowledge Hub Subtitle: Practical, updated and student-friendly guidance for researching courses, universities, applications, scholarships, visas and life abroad.
	27	RESOURCE SEARCH Search:

Search articles...
Filters:
* Category
* Country
* Study level
* Topic
* Date
* Popular
* Recently updated
1. RESOURCE CARDS Each resource card:
* Category
* Title
* Short summary
* Reading time
* Country/topic
* Last updated
* Last verified where applicable
* Author
* Featured image if legally available
Button:

Read Full Guide
Every card MUST link to its own complete article page. 29. RESOURCE DETAIL PAGE Every article must be comprehensive. Structure:

Breadcrumb
Category
Title
Summary
Last Updated
Last Verified
Author
Table of Contents
Main Content
Important Notes
Action Checklist
FAQ
Related Questions
Related Resources
Related Services
Related Scholarships
Related Courses
Final CTA
	30	TABLE OF CONTENTS For long articles automatically generate a table of contents. Example:

1. Overview
2. Eligibility
3. Required Documents
4. Application Process
5. Costs
6. Timeline
7. Common Mistakes
8. FAQs
Clicking a TOC item scrolls to that section. 31. RESOURCE CONTENT DEPTH Articles must be detailed enough that students do not immediately need to search another website for basic explanations. Where relevant include:
* What it means
* Why it matters
* Who needs it
* Eligibility
* Requirements
* Documents
* Costs
* Timeline
* Step-by-step process
* Examples
* Common mistakes
* What happens next
* Official-source guidance
* Checklist
* FAQs
Do not deliberately hide important information just to force consultation. ALO consultation should be the next step, not a substitute for useful information. 32. VISA RESOURCE EXAMPLE A Visa Guide should cover:
* Visa overview
* Who needs it
* Eligibility
* Financial requirements
* Documents
* Application process
* Fees if verified
* Biometrics
* Interview/credibility process where applicable
* Timeline
* Common refusal reasons
* Common mistakes
* Pre-submission checklist
* Official sources
* FAQs
Country-specific rules must never be mixed together. 33. APPLICATION TIPS EXAMPLE Include:
* How to choose a course
* How to shortlist universities
* How to prepare documents
* How to complete applications
* How to avoid inconsistent information
* How to meet deadlines
* How to respond to offers
* Deposit considerations
* CAS/I-20/COE or equivalent country-specific stages where relevant
1. PRE-DEPARTURE RESOURCE Include:
* Passport
* Visa
* Accommodation
* Flights
* Insurance
* Finance
* Banking
* SIM
* Travel documents
* University documents
* Airport arrival
* Local transport
* Emergency planning
* First-week checklist
1. FINANCIAL PLANNING RESOURCE Include:
* Tuition
* Deposit
* Living costs
* Accommodation
* Insurance
* Visa costs
* Travel
* Banking
* Currency
* Emergency fund
* Budget planning
Do not display fabricated cost figures. If figures are dynamic:

Last verified: [date]
Source: [source]
	36	ENGLISH TEST RESOURCES Connect resources to the existing Language Preparation system. Examples:

/resources/english-tests/ielts
/resources/english-tests/pte
/resources/english-tests/toefl
/resources/english-tests/duolingo
Also connect to:

/language-prep
/language-prep/{test-slug}
The same English test should not have conflicting information across pages. Use one canonical database record. 37. RESOURCE FAQ SYSTEM Every article can have contextual FAQs. FAQ questions should be generated/selected based on article topic. Example: Visa article:

What documents are required?
How much financial evidence is needed?
Can I apply after receiving an offer?
How long does processing take?
What causes refusal?
Click question → answer expands. 38. RELATED QUESTIONS ENGINE At the end of each resource page: Related Questions Show relevant questions in clickable accordion cards. Example:

Can I study abroad without IELTS?
How much money do I need?
Can I apply with a study gap?
How do I choose a university?
How do scholarships work?
When clicked:
* Expand answer, OR
* Open the relevant resource page.
Do not send users to irrelevant pages. 39. UNIFIED RELATED CONTENT ENGINE Services, Scholarships and Resources must use the same relationship system. Example:

Visa Guidance
   ↕
UK Student Visa Guide
   ↕
UK Scholarships
   ↕
UK Courses
   ↕
UK Universities
Another:

Scholarship Guidance
   ↕
Scholarship Guide
   ↕
University Scholarship
   ↕
Eligible Courses
   ↕
Course Finder
This creates a connected knowledge ecosystem instead of isolated pages. 40. DATABASE REQUIREMENTS Use existing database tables where available. If missing, add/update:

services
service_faqs

scholarships
scholarship_faqs
scholarship_requirements
scholarship_sources

resources
resource_categories
resource_faqs
resource_tags

content_relationships
content_sources
content_verifications
	41	SERVICES TABLE Minimum:

id
title
slug
short_description
description
icon
hero_image
content
eligibility
requirements
process
timeline
documents
faq_enabled
status
sort_order
last_verified_at
created_at
updated_at
	42	SCHOLARSHIPS TABLE Minimum:

id
scholarship_code
name
slug
country_id
university_id
course_id
study_level
subject
funding_type
amount
currency
coverage
eligibility
minimum_requirements
documents_required
application_method
application_url
opening_date
deadline
decision_date
status
verification_status
source_url
source_name
last_verified_at
created_at
updated_at
	43	RESOURCES TABLE Minimum:

id
category_id
title
slug
excerpt
content
author_id
featured_image
country_id
study_level
reading_time
status
published_at
updated_at
last_verified_at
source_url
seo_title
seo_description
created_at
updated_at
	44	CONTENT RELATIONSHIPS Create:

content_relationships
Fields:

id
source_type
source_id
target_type
target_id
relationship_type
sort_order
status
created_at
Examples:

service → resource
service → scholarship
service → course
scholarship → resource
scholarship → service
scholarship → course
resource → service
resource → scholarship
resource → course
	45	ADMIN MANAGEMENT Super Admin must be able to manage all three systems. Services

Add Service
Edit Service
Delete Service
Reorder
Publish/Unpublish
Add FAQ
Add Related Content
Verify Content
Scholarships

Add Scholarship
Edit Scholarship
Delete Scholarship
Verify
Publish
Unpublish
Set Deadline
Set Funding
Set Eligibility
Add Official Source
Add FAQ
Connect University
Connect Course
Resources

Create Article
Edit Article
Publish
Unpublish
Schedule
Assign Category
Add Tags
Add FAQ
Add Related Content
Set Source
Set Last Verified
SEO
	46	MANUAL ADD OPTIONS The admin must have obvious manual creation buttons:

+ Add Service
+ Add Scholarship
+ Add Resource
+ Add FAQ
+ Add Related Content
+ Add Official Source
No developer/database editing should be required for normal content management. 47. VERIFICATION SYSTEM For time-sensitive information:

Verified
Needs Verification
Expired
Unverified
Public pages should only show verified information when verification is required. For expired information: Information may have changed. Please verify the latest requirements before applying. 48. SOURCE RULE For scholarships, visa information, admission requirements, fees and deadlines: Prefer:

Official university website
Official government website
Official visa authority
Official test provider
Official scholarship provider
Store:

source_url
source_name
last_verified_at
Do not copy source text word-for-word. 49. SEO Every service, scholarship and resource detail page must have:

SEO title
Meta description
Canonical URL
Open Graph title
Open Graph description
Open Graph image
Schema.org structured data
Breadcrumb schema
FAQ schema where valid
Article schema for resources
Use clean slugs. 50. INTERNAL SEARCH Search should index:

Services
Scholarships
Resources
Universities
Courses
Countries
FAQs
Example search: "IELTS" Can return:

IELTS Preparation Service
IELTS Scholarship Resources
IELTS Guide
IELTS FAQ
IELTS Course Requirements
IELTS University Requirements
	51	FINAL PAGE EXPERIENCE Every detail page should finish with: Still Have Questions? Show 4-8 contextual FAQ questions. Then: Explore More Show:

Related Services
Related Scholarships
Related Resources
Related Courses
Related Universities
Then: Ready to Start?

Book Free Consultation
Find Courses
Check Eligibility
Chat with Counselor
1. IMPORTANT CONTENT RULE The website must educate first and sell second. Do not create thin pages whose only purpose is: "Contact us for more information." Instead, provide the useful information directly. The student should be able to understand:
* what the service is
* why they need it
* what they need
* how the process works
* what documents are required
* what deadlines matter
* what mistakes to avoid
* what the next step is
Then ALO becomes the trusted execution/support layer. 53. SECURITY
* RBAC for admin management
* CSRF protection
* Prepared SQL statements
* Output escaping
* No hardcoded database passwords
* No internal notes publicly
* No private CRM information publicly
* No commission information publicly
* Audit log all content changes
* Validate uploaded images/files
* Restrict admin routes
* Sanitize rich text content
1. FINAL SELF-AUDIT Before declaring complete, verify: SERVICES
* /services works
* Every service card opens its own detail page
* Every service has detailed content
* Service FAQs work
* Related content works
* Consultation CTA works
* No dead links
SCHOLARSHIPS
* /scholarships works
* Filters work
* Every scholarship opens /scholarships/{slug}
* Eligibility is displayed
* Requirements are displayed
* Opening/deadline information is displayed where verified
* Application process is explained
* Official source is stored
* Last verified date is shown
* FAQ works
* Related scholarships/resources/services work
* No fake scholarship information
RESOURCES
* /resources works
* Categories work
* Search works
* Every resource opens its own detail page
* Long-form content works
* Table of contents works
* FAQs work
* Related questions work
* Related content works
* SEO metadata exists
* Official sources are preserved where relevant
GLOBAL
* Mobile responsive
* No horizontal overflow
* No fake data
* No lorem ipsum
* No broken links
* No console errors
* No API errors
* No hardcoded DB password
* Database-driven content
* Admin CRUD works
* Audit logs work
* Verification status works
* Accessibility checks pass
* Loading states work
* Empty states work
* Error states work
FINAL ACCEPTANCE CONDITION Do not say the implementation is complete until the three systems are actually connected to the existing ALO Education database, routes are tested, detail pages open correctly, CRUD works from the admin side, and the public pages have no broken links or console/API errors.

ALO_SERVICES_SCHOLARSHIPS_RESOURCES_COMPLETE


UNIFIED UNIVERSITY + COURSE FINDER + COURSE INFO SYSTEM
MASTER BUILD SPECIFICATION
============================================================

PROJECT:
ALO Education Web + CRM

IMPORTANT:
DO NOT rebuild the existing ALO Education project from zero.

This is an enhancement and unification task.

Use and preserve the existing:
- Country pages
- University pages
- Course Finder
- CRM
- Student Portal
- Partner Portal
- Admin Portal
- Authentication
- RBAC
- Database
- Existing design system
- Existing routes where compatible
- Existing APIs/services
- Existing university/course data

Do not delete working functionality.

Do not create a second disconnected University database.
Do not create a second disconnected Course database.

The final result must be ONE unified University + Course database powering:

1. Public University pages
2. Public Course Finder
3. Public Course Information pages
4. Student Course Finder
5. Student Course Information
6. Student shortlist/compare/apply
7. Partner Course Finder
8. Partner Course Information
9. Staff CRM Course Finder
10. Staff University/Course management
11. Super Admin University/Course management
12. Country pages
13. Weekly AI University/Course update system

============================================================
1. CORE ARCHITECTURE
============================================================

Create one canonical data model.

COUNTRY
   ↓
UNIVERSITY
   ↓
CAMPUS
   ↓
COURSE
   ↓
INTAKE
   ↓
ENTRY REQUIREMENTS
   ↓
ENGLISH REQUIREMENTS
   ↓
SCHOLARSHIPS
   ↓
APPLICATION

All public and private interfaces must read from these same database records.

Example:

University page:
 /universities/{university_slug}

Course Finder:
 /course-finder

Course page:
 /course/{course_slug}

Country page:
 /destinations/{country_slug}

CRM:
 /crm/universities
 /crm/courses
 /crm/course-finder

Admin:
 /admin/universities
 /admin/courses
 /admin/import-center

Student:
 /student/course-finder
 /student/course/{id}
 /student/shortlist
 /student/compare
 /student/apply/{course_id}

Partner:
 /partner/search-programs
 /partner/program/{id}
 /partner/apply/{student_id}/{course_id}

============================================================
2. ALO BRAND
============================================================

Background:
#FFFFFF

Primary Blue:
#0057B8

CTA Orange:
#E8501A

Text:
#0F172A

Soft Background:
#F8FAFC

Border:
#E2E8F0

Success:
#10B981

Warning:
#F59E0B

Danger:
#EF4444

Design requirements:

- Premium education consultancy design
- White-first interface
- No black hero overlay
- No dark overlay
- No placeholder lorem ipsum
- No fake statistics
- Cards must have consistent height
- Buttons minimum 48px height
- Mobile-first
- 1 column mobile
- 2 columns tablet
- 3/4 columns desktop
- Accessible typography
- Keyboard accessible controls
- Clean spacing
- Professional data tables
- Clear empty states
- Clear loading states
- Clear error states

============================================================
3. USER ROLES
============================================================

PUBLIC

Can:
- Search courses
- Search universities
- View university pages
- View course pages
- View country pages
- View public tuition
- View public requirements
- View public scholarships
- Compare courses temporarily
- Start application
- Book consultation

Cannot see:
- Commission
- Internal notes
- Partner notes
- Staff notes
- Internal risk information
- Student information
- Private university agreements
- Internal source notes

------------------------------------------------------------

STUDENT

Can:
- Everything public users can do
- Save courses
- Shortlist courses
- Compare courses
- See eligibility
- See AI match score
- See missing requirements
- See missing documents
- See scholarship match
- Apply
- Track applications
- Ask counselor

Cannot see:
- Commission
- Partner commission
- Internal staff notes
- Internal university agreement
- Other student data

------------------------------------------------------------

PARTNER

Can:
- Search courses
- Search universities
- Select their own student
- Check student eligibility
- View partner-specific course information
- Apply for their own students
- Upload required documents
- Track application
- View their own commission where permitted

Cannot see:
- Other partner students
- Other partner commissions
- Internal ALO notes
- Staff risk notes
- Full finance information

------------------------------------------------------------

STAFF / CRM

Based on RBAC permissions can:
- Search universities
- Search courses
- Edit course data
- Verify sources
- Review requirements
- Review applications
- Review data quality
- See internal notes
- See approved internal information
- Manage university/course records

------------------------------------------------------------

SUPER ADMIN

Full access:
- Universities
- Campuses
- Courses
- Intakes
- Requirements
- English requirements
- Scholarships
- Sources
- Imports
- Duplicates
- Update requests
- Approval
- Publishing
- Audit logs
- Commission
- Merge records
- Delete/archive records

============================================================
4. DATABASE
============================================================

Use MySQL.

Never hardcode database password.

Use environment variables for credentials.

Use prepared statements only.

------------------------------------------------------------
COUNTRIES
------------------------------------------------------------

countries

id
country_code
name
slug
flag
currency
overview
visa_overview
work_rights
cost_of_living
status
sort_order
created_at
updated_at

------------------------------------------------------------
UNIVERSITIES
------------------------------------------------------------

universities

id
university_code
country_id
name
slug
logo
website
ranking
ranking_source_url
city
state
address
overview
public_description
partner_description
international_student_url
application_url
scholarship_url
contact_email
admission_notes
status
visibility
source_url
last_verified_at
last_approved_update_at
created_by
updated_by
created_at
updated_at

IMPORTANT:

University must always connect to country_id.

Do not duplicate universities.

------------------------------------------------------------
CAMPUSES
------------------------------------------------------------

campuses

id
university_id
country_id
name
city
state
address
campus_type
status
created_at
updated_at

------------------------------------------------------------
STUDY LEVELS
------------------------------------------------------------

study_levels

id
name
slug
sort_order
status

Examples:

Foundation
International Year One
Bachelor
Top-up
Pre-Masters
Masters
MBA
PhD
Diploma
Certificate

------------------------------------------------------------
STUDY AREAS
------------------------------------------------------------

study_areas

id
name
slug
status

Examples:

Business
Computer Science
Engineering
Healthcare
Law
Education
Hospitality
Finance
Data Science
Artificial Intelligence

------------------------------------------------------------
DISCIPLINES
------------------------------------------------------------

disciplines

id
study_area_id
name
slug
status

------------------------------------------------------------
COURSES
------------------------------------------------------------

courses

id
course_code
university_id
campus_id
country_id
study_level_id
study_area_id
discipline_id

name
slug
description

duration_months
delivery_mode
degree_type

tuition_fee
currency

application_fee
deposit_amount

average_scholarship
min_scholarship
max_scholarship

deadline

ranking_note
career_outcomes

work_placement_available
internship_available
co_op_available

high_demand
fast_offer
high_acceptance
low_deposit
no_interview
moi_accepted
university_own_english_test
application_fee_waiver
open_program

status
visibility

source_url
last_verified_at
last_approved_update_at

created_by
updated_by

created_at
updated_at

IMPORTANT:

Every course MUST have:

country_id
university_id
campus_id when applicable
study_level_id
study_area_id
discipline_id when applicable

Never allow an orphan course.

------------------------------------------------------------
COURSE INTAKES
------------------------------------------------------------

course_intakes

id
course_id
intake_month
intake_year
status
deadline
seats_available
created_at
updated_at

------------------------------------------------------------
ENTRY REQUIREMENTS
------------------------------------------------------------

entry_requirements

id
course_id
qualification_level
academic_requirement
min_gpa
gpa_scale
backlog_allowed
work_experience_required
portfolio_required
interview_required
remarks
source_url
last_verified_at
created_at
updated_at

------------------------------------------------------------
ENGLISH REQUIREMENTS
------------------------------------------------------------

english_requirements

id
course_id
test_type

overall_score
listening_score
reading_score
writing_score
speaking_score
no_band_less_than

waiver_available
remarks

source_url
last_verified_at

created_at
updated_at

Supported test types:

IELTS
IELTS UKVI
PTE
TOEFL
Duolingo
OIETC
Oxford ELLT
LanguageCert
MOI
OET
University English Test
Other

------------------------------------------------------------
SCHOLARSHIPS
------------------------------------------------------------

scholarships

id
scholarship_code
country_id
university_id
course_id
name
amount
amount_type
currency
eligibility
deadline
description
source_url
last_verified_at
status
created_at
updated_at

------------------------------------------------------------
COURSE TAGS
------------------------------------------------------------

course_tags

id
course_id
tag_name
tag_type
created_at

Examples:

Scholarship Available
Fast Offer
High Acceptance
Low Deposit
MOI Accepted
No Interview
High Demand
Co-op
Internship
Application Fee Waiver
Open Program

------------------------------------------------------------
APPLICATIONS
------------------------------------------------------------

applications

id
application_code
student_id
partner_id
counselor_id

course_id
university_id
campus_id
intake_id

status
review_status
document_status
payment_status
commission_status

created_at
updated_at

============================================================
5. UNIVERSITY PAGE
============================================================

PUBLIC ROUTE:

/universities/{university_slug}

Create ONE unified premium University Information Page.

The page must dynamically load the university from database.

------------------------------------------------------------
UNIVERSITY HERO
------------------------------------------------------------

Show:

University name
Country
City
State
Campus
Official website
University image/logo if legally available
Ranking if verified
Last verified date

Buttons:

View Courses
Find Courses
Check Eligibility
Apply Through ALO
Book Free Consultation

Do not use stolen logos.

If official logo is not available or licensing is unclear:

Use:
- text-based university identity card
- generated neutral visual
- legally supplied asset

Never scrape copyrighted images without permission.

------------------------------------------------------------
UNIVERSITY OVERVIEW
------------------------------------------------------------

Show:

Overview
Location
Country
City
Campus information
International student information
Official website
International student URL
Application URL
Scholarship URL

Only show verified data.

------------------------------------------------------------
UNIVERSITY QUICK FACTS
------------------------------------------------------------

Cards:

Country
City
Campus count
Course count
Popular study areas
Popular study levels
Intakes
Scholarship availability
Last verified

Counts must come from database.

Do not hardcode counts.

------------------------------------------------------------
POPULAR COURSES
------------------------------------------------------------

Load courses:

WHERE university_id = current university

Show:

Course name
Study level
Subject
Duration
Tuition
Scholarship
Intakes
English requirement
Deadline

Buttons:

View Course
Compare
Apply

CTA:

View All Courses

------------------------------------------------------------
COURSE SEARCH INSIDE UNIVERSITY PAGE
------------------------------------------------------------

Add filters:

Study Level
Subject
Intake
Tuition
Scholarship
English Test
Duration

Results must use same Course Finder database.

============================================================
6. UNIVERSITY ENTRY REQUIREMENTS
============================================================

Show verified requirements.

Sections:

Foundation
Bachelor
Top-up
Masters
MBA
PhD

Only show levels that actually exist for this university.

Do not invent requirements.

If requirements are missing:

Show:

"Requirement information is currently being verified. Please check with an ALO Education counselor."

Do not show fake values.

============================================================
7. UNIVERSITY ENGLISH REQUIREMENTS
============================================================

Show course-specific English requirements.

Example:

IELTS
PTE
TOEFL
Duolingo
MOI
University English Test

IMPORTANT:

Never say a university accepts a test unless database/source verification exists.

Always show:

Source
Last verified

============================================================
8. UNIVERSITY TUITION
============================================================

Calculate from actual linked courses.

Show:

Undergraduate tuition range
Postgraduate tuition range
MBA tuition range
Scholarship range

Currency must be displayed.

Do not convert to BDT unless exchange rate is verified.

If conversion is available:

Show:

"Indicative BDT estimate"

and display exchange rate/date.

============================================================
9. UNIVERSITY SCHOLARSHIPS
============================================================

Load scholarships connected to:

university_id

Show:

Scholarship name
Amount
Eligibility
Deadline
Course applicability
Source
Last verified

Button:

Check Scholarship Eligibility

============================================================
10. UNIVERSITY INTAKES
============================================================

Load from course_intakes.

Show:

January
May
September
etc.

Only display actual available intakes.

Show:

Course
Intake
Deadline
Seats if public and verified

============================================================
11. UNIVERSITY APPLICATION PROCESS
============================================================

Show general application steps:

1. Select course
2. Check eligibility
3. Prepare documents
4. Submit application
5. Receive offer
6. Meet conditions
7. Prepare visa documents
8. Complete visa process
9. Pre-departure

Do not use country-specific visa terminology incorrectly.

Course-specific requirements must override generic content.

============================================================
12. UNIVERSITY FAQ
============================================================

Generate/display database-backed FAQs.

Questions may include:

What courses are available?
What are the tuition fees?
Which intakes are available?
What English tests are accepted?
Are scholarships available?
What documents are required?
Can international students apply?
How do I apply?
Can ALO Education help?
How long does application processing take?

Do not fabricate university-specific claims.

============================================================
13. UNIVERSITY CTA
============================================================

Final CTA:

Interested in studying at [University Name]?

Buttons:

Find Courses
Check Eligibility
Apply Through ALO
Book Free Consultation
WhatsApp ALO

============================================================
14. UNIFIED PUBLIC COURSE FINDER
============================================================

ROUTE:

/course-finder

This is the central course discovery engine.

It must search the same courses table used everywhere else.

------------------------------------------------------------
SEARCH
------------------------------------------------------------

Search:

Course name
University
Country
City
Campus
Subject

------------------------------------------------------------
FILTERS
------------------------------------------------------------

Country
City
University
Campus
Study Level
Study Area
Discipline
Intake
Year
Tuition Range
Scholarship
Application Fee
Deposit
Duration
Deadline

English:

IELTS
PTE
TOEFL
Duolingo
OIETC
Oxford ELLT
MOI

Quick filters:

Open Programs
Scholarship Available
Low Deposit
Fast Offer
High Scholarship
Popular Courses
No Application Fee
No Interview
MOI Accepted
Co-op
Internship
High Demand

============================================================
15. PUBLIC COURSE CARD
============================================================

Each card shows:

Course name
University
Country
City
Campus
Study level
Subject
Duration
Tuition
Scholarship
Deposit
Application fee
Intakes
English requirement
Deadline
Relevant tags

Buttons:

View Course
Compare
Apply Now
Book Consultation

Save button:

If logged out:

"Login to Save"

Never show:

Commission
Partner notes
Staff notes
Internal university agreement

============================================================
16. COURSE INFORMATION PAGE
============================================================

ROUTE:

/course/{course_slug}

Create one premium unified Course Information page.

This is the canonical public course page.

------------------------------------------------------------
COURSE HERO
------------------------------------------------------------

Show:

Course name
University
Country
City
Campus
Study level
Degree type
Duration

Quick facts:

Tuition
Scholarship
Deposit
Application fee
Intake
Deadline

Buttons:

Apply Now
Check Eligibility
Compare
Book Free Consultation

------------------------------------------------------------
COURSE OVERVIEW
------------------------------------------------------------

Show:

Course description
Career outcomes
Delivery mode
Duration
Degree type
Internship
Placement
Co-op

Only show values available in database.

------------------------------------------------------------
TUITION & FEES
------------------------------------------------------------

Show:

Tuition
Currency
Application fee
Deposit
Scholarship

Show source and verification date.

If unavailable:

"Fee information requires counselor verification."

------------------------------------------------------------
INTAKES
------------------------------------------------------------

Show:

Month
Year
Deadline
Status

Use course_intakes.

------------------------------------------------------------
ACADEMIC REQUIREMENTS
------------------------------------------------------------

Show:

Qualification
Academic requirement
Minimum GPA
Backlog rule
Work experience
Portfolio
Interview

Only display verified values.

------------------------------------------------------------
ENGLISH REQUIREMENTS
------------------------------------------------------------

Table:

Test
Overall
Listening
Reading
Writing
Speaking
No band below
Waiver

Show:

Source URL
Last verified

------------------------------------------------------------
DOCUMENTS
------------------------------------------------------------

Show course-specific document checklist where available:

Passport
Academic certificates
Academic transcripts
English test
CV
SOP
Recommendation letters
Portfolio
Work experience
Other

Do not claim a document is mandatory unless the database/source says so.

------------------------------------------------------------
SCHOLARSHIP
------------------------------------------------------------

Show scholarships linked to course.

------------------------------------------------------------
CAREER OUTCOMES
------------------------------------------------------------

Show:

Career directions
Industry
Internship
Placement
Co-op

Do not promise employment.

------------------------------------------------------------
VISA / INTERNATIONAL STUDENT NOTES
------------------------------------------------------------

Only show public-safe verified information.

Do not provide guaranteed visa claims.

Show:

"Visa requirements can change. Final requirements must be verified against current official guidance."

------------------------------------------------------------
SIMILAR COURSES
------------------------------------------------------------

Recommend based on:

same university
same subject
same country
same study level

Do not create fake courses.

------------------------------------------------------------
COURSE CTA
------------------------------------------------------------

Apply Now
Check Eligibility
Compare
Book Free Consultation
WhatsApp ALO

============================================================
17. STUDENT COURSE FINDER
============================================================

ROUTE:

/student/course-finder

Same database.

Add personalized logic.

Student profile inputs:

Nationality
Education country
Highest qualification
GPA/CGPA
English test
English score
Study gap
Work experience
Backlogs
Budget
Preferred country
Preferred subject
Preferred intake

Calculate:

Eligibility Score
AI Match Score

Labels:

Eligible
Likely Eligible
Need Review
Not Eligible
Missing Information

Never guarantee admission or visa.

============================================================
18. STUDENT COURSE PAGE
============================================================

/student/course/{id}

Public course information PLUS:

Eligibility score
AI match score
Missing requirements
Missing documents
Scholarship match
Profile match reasons
Visa readiness warning
Saved status

Buttons:

Save
Compare
Apply
Ask Counselor

============================================================
19. STUDENT APPLY
============================================================

When Apply clicked:

1. Verify authentication.
2. Load student profile.
3. Validate course.
4. Validate intake.
5. Check required documents.
6. Create application draft.
7. Link:
   student_id
   course_id
   university_id
   campus_id
   intake_id
8. Create document checklist.
9. Create timeline entry.
10. Notify counselor.
11. Redirect to student applications.

Do not create duplicate application drafts for same student/course/intake unless intentionally allowed.

============================================================
20. STUDENT SHORTLIST
============================================================

/student/shortlist

Show:

Saved courses
University
Country
Tuition
Scholarship
Intake
Eligibility
Match score

Actions:

Compare
Apply
Remove

============================================================
21. STUDENT COMPARE
============================================================

/student/compare

Compare maximum sensible number of courses.

Columns:

University
Course
Country
Study level
Duration
Tuition
Scholarship
Deposit
Application fee
Intake
Deadline
English
Academic requirement
Eligibility
Match score

============================================================
22. PARTNER COURSE FINDER
============================================================

/partner/search-programs

Partner selects ONLY their own student.

Search by:

Country
University
City
Study level
Subject
Intake
Tuition
Scholarship
English
Academic profile

Show:

Eligible
Need Review
Not Eligible

Partner can:

Save
Compare
Apply
Upload documents
Track application

Commission:

Partner can see ONLY their own permitted commission.

Backend must enforce this.

============================================================
23. STAFF CRM COURSE FINDER
============================================================

/crm/course-finder

Staff can search all courses.

Show internal columns based on permissions:

Source
Last verified
Data quality
Internal deadline
Risk status
Application note
University agreement
Commission where authorized

Add:

Duplicate warning
Verification warning
Missing source warning
Expired data warning

============================================================
24. MANUAL UNIVERSITY MANAGEMENT
============================================================

SUPER ADMIN / AUTHORIZED STAFF:

/admin/universities

Actions:

Create
Edit
View
Archive
Publish
Unpublish
Merge duplicate

------------------------------------------------------------
CREATE UNIVERSITY
------------------------------------------------------------

/admin/universities/create

FORM TABS:

1. Basic Information
2. Location
3. Official Links
4. International Student Information
5. Ranking
6. Description
7. Scholarship
8. Source Verification
9. SEO
10. Visibility
11. Publish

Fields:

University code
University name
Country
City
State
Address
Logo
Website
Ranking
Ranking source
Overview
Public description
Partner description
International student URL
Application URL
Scholarship URL
Contact email
Admission notes
Source URL
Last verified
Status
Visibility

Validation:

University name required.
Country required.
Official website required where available.
Source URL required for verified data.

============================================================
25. MANUAL COURSE MANAGEMENT
============================================================

SUPER ADMIN / AUTHORIZED STAFF:

/admin/courses

Actions:

Create
Edit
View
Archive
Publish
Unpublish
Duplicate
Merge

------------------------------------------------------------
CREATE COURSE
------------------------------------------------------------

/admin/courses/create

TABS:

1. Basic Information
2. University & Campus
3. Tuition & Fees
4. Intakes
5. Academic Requirements
6. English Requirements
7. Scholarships
8. Tags
9. Source Verification
10. SEO
11. Visibility
12. Publish

------------------------------------------------------------
BASIC
------------------------------------------------------------

Course code
Course name
Slug
Description
Study level
Study area
Discipline
Duration
Delivery mode
Degree type

------------------------------------------------------------
UNIVERSITY
------------------------------------------------------------

Country
University
Campus

These must be relational dropdowns.

Do not allow free-text university names if matching database entity exists.

------------------------------------------------------------
FEES
------------------------------------------------------------

Tuition
Currency
Application fee
Deposit
Scholarship

Allow:

Minimum
Maximum
Average

Never invent exact figures.

------------------------------------------------------------
INTAKES
------------------------------------------------------------

Add multiple:

Month
Year
Deadline
Seats
Status

------------------------------------------------------------
ACADEMIC REQUIREMENTS
------------------------------------------------------------

Academic requirement
Minimum GPA
GPA scale
Backlogs
Work experience
Portfolio
Interview
Remarks

------------------------------------------------------------
ENGLISH
------------------------------------------------------------

Add multiple tests:

IELTS
PTE
TOEFL
Duolingo
OIETC
Oxford ELLT
MOI
Other

Fields:

Overall
Listening
Reading
Writing
Speaking
No band below
Waiver
Remarks

------------------------------------------------------------
TAGS
------------------------------------------------------------

Scholarship Available
Fast Offer
High Acceptance
Low Deposit
No Interview
MOI Accepted
High Demand
Co-op
Internship
Application Fee Waiver
Open Program

------------------------------------------------------------
SOURCE VERIFICATION
------------------------------------------------------------

Source URL
Source name
Last verified
Verified by
Verification status

Statuses:

Verified
Needs Review
Expired
Unverified

If Unverified:

Do not display sensitive exact claim publicly.

============================================================
26. CSV IMPORT CENTER
============================================================

Routes:

/admin/import-center/universities
/admin/import-center/courses
/admin/import-center/scholarships

Support:

CSV
Excel where existing infrastructure supports it

Process:

1. Upload
2. Detect columns
3. Validate
4. Preview
5. Show errors
6. Confirm import
7. Save batch
8. Import
9. Report result

------------------------------------------------------------
UNIVERSITIES CSV
------------------------------------------------------------

university_code
country_code
name
slug
logo
website
ranking
ranking_source_url
city
state
address
overview
public_description
partner_description
international_student_url
application_url
scholarship_url
contact_email
admission_notes
status
source_url
last_verified_at

------------------------------------------------------------
COURSES CSV
------------------------------------------------------------

course_code
university_code
campus_name
country_code
study_level
study_area
discipline
name
slug
description
duration_months
delivery_mode
degree_type
tuition_fee
currency
application_fee
deposit_amount
average_scholarship
min_scholarship
max_scholarship
deadline
career_outcomes
work_placement_available
internship_available
co_op_available
high_demand
fast_offer
high_acceptance
low_deposit
no_interview
moi_accepted
university_own_english_test
application_fee_waiver
open_program
status
visibility
source_url
last_verified_at

------------------------------------------------------------
IMPORT VALIDATION
------------------------------------------------------------

Before import:

- Required columns
- Country exists
- University exists
- Course code uniqueness
- Numeric fees
- Valid dates
- Valid status
- Valid relationships
- Duplicate detection
- Source validation

Show:

Total rows
Valid rows
Invalid rows
Duplicate rows
Warnings

Do not import invalid rows automatically.

Save errors.

============================================================
27. DUPLICATE DETECTION
============================================================

University duplicate matching:

Normalized university name
Country
Official website
Source URL

Course duplicate matching:

University
Normalized course name
Country
Study level
Official source URL

If similar record exists:

Do NOT create another record.

Show:

Possible duplicate detected.

Options:

View Existing
Merge
Cancel
Create Anyway with Super Admin confirmation

Keep history.

============================================================
28. WEEKLY AI UNIVERSITY + COURSE UPDATE AGENT
============================================================

Add weekly update system.

The AI agent must check ONLY:

- Official university website
- Official course page
- Official international student page
- Official scholarship page
- Official admissions page

Respect:

robots.txt
rate limits
website terms

Do not scrape aggressively.

------------------------------------------------------------
WEEKLY PROCESS
------------------------------------------------------------

1. Run once per week.
2. Load universities/courses requiring verification.
3. Open official source URLs.
4. Extract relevant current information.
5. Compare against database.
6. Detect changes.
7. Create update_request.
8. Save source URL.
9. Save evidence/reference.
10. Show old value.
11. Show new value.
12. Assign confidence.
13. Wait for Super Admin.

AI MUST NOT publish automatically.

------------------------------------------------------------
DETECT CHANGES
------------------------------------------------------------

Course name
Course status
Tuition
Currency
Intake
Deadline
Application fee
Deposit
Academic requirement
English requirement
Scholarship
International student eligibility
Course duration
Application process

University:

Website
International student page
Application URL
Scholarship URL
Campus
Ranking
Admission information

------------------------------------------------------------
UPDATE REQUEST
------------------------------------------------------------

Create:

update_requests

id
entity_type
entity_id
field_name
old_value
new_value
source_url
evidence
confidence
status
detected_at
reviewed_by
reviewed_at
created_at

Statuses:

Pending
Approved
Rejected
Edited
Needs Manual Review

============================================================
29. APPROVAL WORKFLOW
============================================================

SUPER ADMIN:

/admin/university-data-updates

Show:

Weekly scan status
Last scan
Next scan
Changes found
Pending approval
Approved
Rejected
Needs review

Each change:

OLD VALUE
NEW VALUE
SOURCE
EVIDENCE
CONFIDENCE

Actions:

Approve
Reject
Edit
Approve & Publish

Only after approval:

Update database
Update Course Finder
Update University page
Update Course page
Update Country page
Update CRM

Create approval log.

============================================================
30. SOURCE LOGS
============================================================

source_logs

id
entity_type
entity_id
source_name
source_url
source_type
checked_at
checked_by
verification_status
notes
created_at

Source types:

Official University
Government
Official Visa Authority
Official Scholarship
Other Approved Source

For university/course facts:

Prefer official university source.

============================================================
31. AUDIT LOG
============================================================

Every create/edit/delete/import/approve/publish/merge action must be logged.

audit_logs:

user_id
role
action
entity_type
entity_id
old_value
new_value
ip_address
created_at

============================================================
32. PUBLIC DATA SAFETY
============================================================

Backend-level field filtering.

Do NOT rely only on React/UI hiding.

Public API must never return:

commission
internal_notes
partner_notes
staff_notes
private agreements
internal risk notes
other student data

Student API must never return:

commission
other partner data
staff-only information

Partner API must return:

only own permitted commission.

Staff:

permission-based fields.

Super Admin:

full data.

============================================================
33. COURSE SEARCH API
============================================================

Create one canonical course search service.

Example:

GET /api/courses/search

Parameters:

q
country
city
university
campus
study_level
study_area
discipline
intake
year
min_tuition
max_tuition
scholarship
application_fee
deposit
english_test
english_score
duration
deadline
tag
open_program

The same service must power:

Public
Student
Partner
Staff

Role-based response filtering must happen server-side.

============================================================
34. UNIVERSITY API
============================================================

Create canonical university service.

Examples:

GET /api/universities
GET /api/universities/{slug}

Include:

country
campuses
course_count
study_areas
popular_courses
scholarships
intakes

Only return fields allowed by role.

============================================================
35. COURSE API
============================================================

Canonical:

GET /api/courses/{slug}

Include:

University
Country
Campus
Study level
Study area
Discipline
Tuition
Scholarship
Intakes
Academic requirements
English requirements
Tags
Career outcomes
Source verification

Role-filter response.

============================================================
36. SEO
============================================================

University:

Dynamic title:

Study at [University] | Courses, Fees, Scholarships & Admissions | ALO Education

Course:

[Course Name] at [University] | Fees, Requirements & Intakes | ALO Education

Use:

Canonical URL
Meta description
OpenGraph
Breadcrumb schema
University schema where appropriate
Course/EducationalOccupationalProgram structured data where appropriate

Do not keyword stuff.

============================================================
37. PERFORMANCE
============================================================

- Server-side pagination where appropriate
- Lazy-load images
- Optimized image sizes
- Debounced search
- Indexed database filters
- Avoid N+1 queries
- Cache safe public queries
- No unnecessary heavy JS
- Mobile-first
- Accessible controls

Recommended indexes:

courses.country_id
courses.university_id
courses.study_level_id
courses.study_area_id
courses.status
courses.visibility
courses.slug
course_intakes.course_id
entry_requirements.course_id
english_requirements.course_id
scholarships.course_id
scholarships.university_id
universities.country_id
universities.slug

============================================================
38. MANUAL ADMIN UX
============================================================

University list:

Search
Country
City
Status
Verified
Last updated

Actions:

View
Edit
Courses
Verify
Archive
Merge

Course list:

Search
Country
University
Study Level
Subject
Intake
Status
Verification

Actions:

View
Edit
Duplicate
Verify
Archive

Bulk actions:

Publish
Unpublish
Verify
Update status
Export

============================================================
39. EMPTY / ERROR STATES
============================================================

No university:

"No universities match your search."

No course:

"No courses match your current filters."

No verified tuition:

"Tuition information is currently being verified."

No English requirement:

"English requirement information is currently being verified."

No scholarship:

"No verified scholarship is currently listed for this course."

Never show fake information.

============================================================
40. DATA QUALITY SCORE
============================================================

Calculate internal quality score based on:

University relationship
Country relationship
Official source
Last verified date
Tuition
Intake
Entry requirement
English requirement
Scholarship
Application deadline

Example:

90-100:
Excellent

70-89:
Good

50-69:
Needs Review

Below 50:
Incomplete

This score is internal unless explicitly configured for public display.

============================================================
41. UNIVERSITY + COURSE RELATIONSHIP RULE
============================================================

ONE UNIVERSITY:

Can have:

Many campuses
Many courses
Many scholarships

ONE COURSE:

Belongs to:

One country
One university
One campus when applicable
One study level
One study area
One discipline when applicable

ONE COURSE:

Can have:

Many intakes
Many academic requirements
Many English requirements
Many scholarships
Many tags

============================================================
42. COUNTRY PAGE INTEGRATION
============================================================

Existing country pages must automatically use unified data.

Country page:

Top universities
Popular courses
Tuition range
Scholarships
Intakes
Course Finder CTA

All data must be dynamically calculated.

Example:

Country:
United Kingdom

Top Universities:
Query universities.country_id

Popular Courses:
Query courses.country_id

Scholarships:
Query scholarships.country_id

Never hardcode course/university lists.

============================================================
43. COURSE FINDER RESULT SORTING
============================================================

Public default sorting:

Relevance
Popular
Lowest Tuition
Highest Scholarship
Latest Intake

Student:

Best Match
Eligibility
AI Match
Lowest Tuition
Scholarship

Partner:

Eligibility
Offer TAT
Scholarship
Acceptance
Tuition

Staff:

Data quality
Last updated
Verification status

============================================================
44. SAVE / COMPARE
============================================================

Public:

Temporary compare allowed.

Save requires login.

Student:

course_shortlists
course_comparisons

Use unique constraints to prevent duplicates.

============================================================
45. APPLICATION CREATION
============================================================

Apply Now:

Public:
Prompt login or start lead/application process.

Student:
Create application draft.

Partner:
Create application for selected own student.

Staff:
Can create application where permission allows.

Every application:

student_id
course_id
university_id
intake_id

must be linked.

============================================================
46. SECURITY
============================================================

Mandatory:

RBAC
CSRF
Prepared statements
Output escaping
Input validation
Rate limiting for public search/forms
Authentication
Authorization
Audit logs
Secure file upload
File type validation
File size validation

Never expose:

DB credentials
API secrets
internal notes
commission to unauthorized users
student information
partner information

============================================================
47. NO FAKE DATA
============================================================

Critical rule:

If database has verified information:
USE DATABASE INFORMATION.

If information is not verified:
DO NOT INVENT IT.

Use:

"Check with counselor"

or

"Data pending verification"

or

"Needs manual review"

Never fabricate:

Tuition
Scholarship
Visa rule
Work right
English score
Admission requirement
Ranking
Acceptance rate
Visa success rate
Offer TAT

============================================================
48. NO COPYRIGHT / LOGO VIOLATION
============================================================

University logos:

Use only:
- legally provided asset
- official permitted asset
- existing licensed asset

If uncertain:

Use text-based university identity.

Images:

Do not copy copyrighted images from university websites.

Use licensed images or generated visuals where appropriate.

Do not copy university text word-for-word.

Summarize and rewrite.

============================================================
49. FINAL SYSTEM FLOW
============================================================

PUBLIC:

Homepage
 ↓
Country
 ↓
University
 ↓
Course Finder
 ↓
Course Information
 ↓
Check Eligibility
 ↓
Apply / Consultation

STUDENT:

Student Profile
 ↓
Course Finder
 ↓
AI/Eligibility Match
 ↓
Course
 ↓
Shortlist
 ↓
Compare
 ↓
Apply
 ↓
Documents
 ↓
Application Tracking

PARTNER:

Partner
 ↓
Select Own Student
 ↓
Course Finder
 ↓
Eligibility
 ↓
Course
 ↓
Apply
 ↓
Documents
 ↓
Application Tracking
 ↓
Own Commission

STAFF:

CRM
 ↓
Course Finder
 ↓
University
 ↓
Course
 ↓
Verification
 ↓
Application

SUPER ADMIN:

Admin
 ↓
University Management
 ↓
Course Management
 ↓
Import Center
 ↓
Duplicate Detection
 ↓
AI Update Center
 ↓
Approval
 ↓
Publish
 ↓
Audit Log

============================================================
50. REQUIRED ADMIN PAGES
============================================================

/admin/universities
/admin/universities/create
/admin/universities/edit/:id

/admin/courses
/admin/courses/create
/admin/courses/edit/:id

/admin/import-center/universities
/admin/import-center/courses
/admin/import-center/scholarships

/admin/university-data-updates

============================================================
51. REQUIRED CRM PAGES
============================================================

/crm/universities
/crm/university/:id

/crm/courses
/crm/course-finder
/crm/course/:id

============================================================
52. REQUIRED PUBLIC PAGES
============================================================

/universities
/universities/:slug

/course-finder
/course/:slug

/destinations/:country

/scholarships

============================================================
53. REQUIRED STUDENT PAGES
============================================================

/student/course-finder
/student/course/:id
/student/shortlist
/student/compare
/student/apply/:course_id

============================================================
54. REQUIRED PARTNER PAGES
============================================================

/partner/search-programs
/partner/program/:id
/partner/apply/:student_id/:course_id

============================================================
55. FINAL SELF-AUDIT
============================================================

DO NOT SAY "DONE" UNTIL THESE ARE ACTUALLY TESTED.

DATABASE:

[ ] University saves correctly
[ ] Course saves correctly
[ ] Course connects to university
[ ] Course connects to country
[ ] Course connects to campus
[ ] Course connects to study level
[ ] Course connects to study area
[ ] Course connects to discipline
[ ] Intakes connect to course
[ ] Requirements connect to course
[ ] English requirements connect to course
[ ] Scholarships connect correctly
[ ] No orphan courses
[ ] Duplicate prevention works

PUBLIC:

[ ] /universities works
[ ] /universities/:slug works
[ ] /course-finder works
[ ] /course/:slug works
[ ] Public search works
[ ] Filters work
[ ] Pagination works
[ ] University cards work
[ ] Course cards work
[ ] Course detail works
[ ] Compare works
[ ] Apply CTA works
[ ] No commission visible
[ ] No private data visible

STUDENT:

[ ] Student search works
[ ] Eligibility calculation works
[ ] Match score works
[ ] Shortlist works
[ ] Compare works
[ ] Apply creates application
[ ] Documents are linked
[ ] Counselor notification works
[ ] Commission is hidden

PARTNER:

[ ] Partner can select own student
[ ] Other partner students are blocked
[ ] Partner search works
[ ] Partner eligibility works
[ ] Partner application works
[ ] Partner sees only own commission

STAFF:

[ ] CRM search works
[ ] University management works
[ ] Course management works
[ ] Source verification works
[ ] Internal fields protected by permission

SUPER ADMIN:

[ ] Manual university creation works
[ ] Manual course creation works
[ ] Edit works
[ ] Archive works
[ ] Publish/unpublish works
[ ] CSV import works
[ ] Import validation works
[ ] Duplicate detection works
[ ] Merge works
[ ] AI update center works
[ ] Approval works
[ ] Publish after approval works
[ ] Audit logs work

AI UPDATE:

[ ] Weekly schedule exists
[ ] Official sources only
[ ] Changes detected
[ ] Old/new values shown
[ ] Source URL stored
[ ] Evidence stored
[ ] Update request created
[ ] No automatic publishing
[ ] Super Admin approval required
[ ] Approved data updates all connected pages

SECURITY:

[ ] No hardcoded DB password
[ ] Prepared statements
[ ] CSRF protection
[ ] RBAC enforced server-side
[ ] Commission backend protected
[ ] Student data protected
[ ] Partner data protected
[ ] Admin routes protected
[ ] Audit logs working
[ ] No secrets exposed in frontend

PERFORMANCE:

[ ] No N+1 queries
[ ] Search is indexed
[ ] Images lazy-loaded
[ ] Mobile responsive
[ ] No console errors
[ ] No broken API calls
[ ] No broken links
[ ] Accessible buttons
[ ] Keyboard navigation

============================================================
FINAL DELIVERY REQUIREMENT
============================================================

The final implementation must be ONE unified system:

UNIVERSITY DATABASE
        +
COURSE DATABASE
        +
UNIVERSITY PAGE
        +
COURSE FINDER
        +
COURSE INFO PAGE
        +
STUDENT MATCHING
        +
PARTNER SEARCH
        +
CRM MANAGEMENT
        +
SUPER ADMIN MANAGEMENT
        +
CSV IMPORT
        +
DUPLICATE DETECTION
        +
WEEKLY AI UPDATE
        +
SUPER ADMIN APPROVAL
        +
SOURCE VERIFICATION
        +
AUDIT LOG

No duplicate systems.

No disconnected mock data.

No fake information.

No hardcoded database credentials.

No public commission leakage.

No automatic AI publishing.

No stolen university logos.

No copied university content.

Everything must be database-driven.

============================================================
FINAL STATUS OUTPUT
============================================================

Only after live testing and self-audit:

ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_READY

If anything is incomplete:

ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_INCOMPLETE

Then list the exact failed items with:

- Route
- Feature
- Database table
- API
- Error
- Required fix

Do NOT claim completion based only on code existence.
Do NOT claim completion based only on build success.
Test the actual live flows.
============================================================. 