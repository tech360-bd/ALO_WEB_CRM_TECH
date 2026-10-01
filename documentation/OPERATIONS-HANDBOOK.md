> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education — Operations Handbook

**For ALO Education staff (non-developers)**

This handbook explains how to use the ALO Education platform day-to-day.

---

## 1. Logging In

1. Go to the ALO Education website
2. Click **"Student Portal"**, **"Partner Portal"**, or **"Employee Portal"** in the top navigation
3. Enter your email and password
4. Click **"Sign In"**

**Default accounts** (change passwords immediately in production):
- Super Admin: `superadmin@aloedu.com` / `alo123`
- Admin: `admin@aloedu.com` / `alo123`
- Counselor: `counselor@aloedu.com` / `alo123`
- Partner: `partner@aloedu.com` / `alo123`

---

## 2. Managing Students

### As a Counselor:
1. Go to **Counselor Portal → Counselor Dashboard**
2. View your assigned students
3. Click a student to open **Student 360** (full profile)
4. Upload documents via **Document Hub**
5. Create applications via **Applications**
6. Track progress via the timeline

### As a Super Admin:
1. Go to **Super Admin → CRM Dashboard**
2. View all leads and students across the organization
3. Assign leads to counselors
4. Monitor conversion rates

---

## 3. Managing Universities & Courses

### Viewing Universities:
1. Go to **Public Website → Universities**
2. Filter by country
3. Click a university to view details

### Monitoring University Changes:
1. Go to **Super Admin → University Monitor**
2. Check the **Verification Queue** tab for pending changes
3. Click a change to view old vs new values
4. Click **Approve** to apply the change to production
5. Click **Reject** to discard
6. Click **Request Recheck** to re-verify the source

### Triggering a Manual Monitoring Run:
1. Go to **Super Admin → University Monitor**
2. Click **"Trigger Run Now"**
3. Wait for the run to complete (check the **Run History** tab)

---

## 4. Managing Reviews

### Sending Review Invitations:
1. Go to **Super Admin → Review Center** (or Marketing → Review Center)
2. Click **"Send Review Invitation"**
3. Enter student name, country, service type
4. Optionally add Google and Facebook review links
5. Click **Create Invitation**
6. Share the generated link with the student

### Moderating Reviews:
1. Go to **Review Center**
2. Check the **Recent Reviews** table
3. Click a review to view full details
4. Check the AI flags and consent status
5. Click **Publish to Website** (only if student consented)
6. Click **Reject** to keep internal only

**Important:** You CANNOT publish a review if the student did not consent. The system enforces this.

---

## 5. Managing Storage

### Checking Storage Health:
1. Go to **Super Admin → Storage Control**
2. View the 3 storage pools (Student/Partner, Official, Operational)
3. Check capacity usage and health status
4. View the **File Browser** tab to see all files
5. View the **Audit Trail** tab to see file events

### Understanding Storage Pools:
- **Student/Partner Pool (120GB)**: Student documents, passports, certificates
- **Official Pool (120GB)**: Company policies, SOPs, brand assets, project archives
- **Operational Pool (500GB)**: Employee files, marketing media, AI-generated content

---

## 6. Managing AI Agents

### Central AI Command:
1. Go to **Super Admin → Central AI Command**
2. View all registered AI agents
3. Check agent status (ACTIVE/PAUSED)
4. Click an agent to view its prompt template, config, execution log
5. Pause/activate agents as needed

### Enterprise AI:
1. Go to **Super Admin → Enterprise AI (100 Depts)**
2. View the 100 departments and 20 enterprise engines
3. Run DCC (Department Capability Certification) checks
4. View constitutional rules and capabilities

---

## 7. Using the Knowledge Center

### Searching for Information:
1. Go to **Knowledge Center** (available to all staff)
2. Use the **AI Search** tab to ask questions
3. Use the **Documents** tab to browse official documents
4. Use the **News & Updates** tab for university/government updates
5. Use the **Training Center** for staff training materials

**Example questions:**
- "University of Oxford tuition"
- "UK visa documents"
- "Which universities have September intake?"

---

## 8. Managing Marketing

### Creating Campaigns:
1. Go to **Marketing → Marketing Manager**
2. View campaign performance
3. Create new campaigns

### Marketing AI:
1. Go to **Marketing → Marketing AI Engine**
2. Generate content with AI assistance
3. All content goes through approval workflow before publishing

---

## 9. Managing Employees

### As Super Admin:
1. Go to **Super Admin → Employee Management**
2. View all employees
3. Manage designations, departments, salaries
4. Go to **Enterprise HR** for advanced HR features

### HR Dashboard:
1. Go to **HRM Dashboard** for attendance, payroll, performance
2. Go to **Finance Dashboard** for revenue and commissions

---

## 10. Reviewing Audit Logs

1. Go to **Super Admin → Audit Logs**
2. View all system actions
3. Filter by user, action type, date
4. Every important action is logged: login, document upload, status changes, approvals, AI actions

---

## 11. Backup and Restore

### Database Backup:
```bash
cd /home/z/my-project
cp db/custom.db db/backup-$(date +%Y%m%d-%H%M%S).db
```

### File Storage Backup:
```bash
cd /home/z/my-project
tar -czf storage-backup-$(date +%Y%m%d).tar.gz storage/
```

### Restore:
```bash
cd /home/z/my-project
# Stop the application
cp db/backup-20260807-120000.db db/custom.db
tar -xzf storage-backup-20260807.tar.gz
# Restart the application
```

See `documentation/BACKUP-RESTORE-GUIDE.md` for the complete procedure.

---

## 12. Troubleshooting

### The website won't load:
1. Check if the dev server is running: `ps aux | grep next`
2. Restart it: `bun run dev`
3. Check the log: `tail -50 dev.log`

### API returns 401:
- You're not logged in, or your session expired. Log in again.

### API returns 403:
- You don't have permission for this action. Contact your Super Admin.

### File upload fails:
- Check file size (max 100MB)
- Check file type (no .exe, .sh, .php)
- Check storage pool health in Super Admin → Storage Control

### University data looks wrong:
- Check Super Admin → University Monitor for pending changes
- Do NOT edit university data directly — use the approval workflow

### Need help:
- Email: info@aloeducation.com
- Phone: 01805020101
