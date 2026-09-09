import os
import sqlite3
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_DIR = os.path.join(BASE_DIR, "skills", "private")
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

DEPARTMENTS = [
    (1, "Command Center & Governance", "command_governance"),
    (2, "AI Engineering", "ai_engineering"),
    (3, "Memory & Knowledge Core", "memory_knowledge"),
    (4, "CRM & Automation", "crm_automation"),
    (5, "WhatsApp Business", "whatsapp_business"),
    (6, "Digital Marketing Strategy", "digital_marketing"),
    (7, "Social Media", "social_media"),
    (8, "Paid Ads Planning", "paid_ads"),
    (9, "Content Writing", "content_writing"),
    (10, "SEO", "seo"),
    (11, "Website Design", "website_design"),
    (12, "Website Development", "website_development"),
    (13, "Software Development", "software_development"),
    (14, "Avatar Video Studio", "avatar_video"),
    (15, "Design & Creative", "design_creative"),
    (16, "Data & Analytics", "data_analytics"),
    (17, "E-Commerce", "ecommerce"),
    (18, "Customer Support", "customer_support"),
    (19, "Finance, Admin & Legal", "finance_admin_legal"),
    (20, "DevOps & Security", "devops_security"),
    (21, "Image AI Studio", "image_ai"),
    (22, "Study & Academic AI", "academic_ai"),
    (23, "Video Production AI", "video_production"),
    (24, "Song & Music AI", "music_ai"),
    (25, "Human Avatar & Voice AI", "human_avatar_voice"),
    (26, "Educational Agency Operations", "educational_agency"),
    (27, "Student Consultancy & Visa", "student_visa"),
    (28, "University & Course Research", "university_research"),
    (29, "LMS & Course Factory", "lms_course_factory"),
    (30, "Exam & Assessment AI", "exam_assessment"),
    (31, "HR & Recruitment", "hr_recruitment"),
    (32, "Employee Productivity", "employee_productivity"),
    (33, "Finance & Accounting", "finance_accounting"),
    (34, "Business Strategy", "business_strategy"),
    (35, "Sales & Lead Generation", "sales_lead_gen"),
    (36, "Proposal & Contract Factory", "proposal_contract"),
    (37, "Project Management", "project_management"),
    (38, "Operations Management", "operations_management"),
    (39, "Research & Intelligence", "research_intelligence"),
    (40, "Legal & Compliance", "legal_compliance"),
    (41, "Real Estate & Property Marketing", "real_estate"),
    (42, "Travel & Immigration Support", "travel_immigration"),
    (43, "Local Business Automation", "local_business"),
    (44, "Agency Client Delivery", "agency_delivery"),
    (45, "AI Training & Knowledge", "ai_training"),
    (46, "Security Monitoring", "security_monitoring"),
    (47, "Server Automation", "server_automation"),
    (48, "Product Management", "product_management"),
    (49, "Quality Assurance", "quality_assurance"),
    (50, "Executive CEO Control", "ceo_control"),
    (51, "AI Website Builder, Web Clone & Scraper Agents", "ai_website_clone_scraper"),
]

EXTENDED_DEPT_NAMES = [
    "Brand Asset Management", "Influencer Marketing", "Event Management", "Public Relations",
    "Affiliate Marketing", "Community Management", "Podcast Studio", "3D Modeling & Rendering",
    "AR/VR Experience Studio", "Game Development", "Cyber Threat Intelligence", "Penetration Testing",
    "Cloud Infrastructure", "Kubernetes Management", "Database Operations", "Data Warehousing",
    "Machine Learning Operations", "NLP Specialization", "Computer Vision", "Voice Intelligence",
    "Retail Operations", "Supply Chain & Logistics", "Inventory Optimization", "Hospitality Management",
    "Healthcare & Medical Consulting", "Automotive Marketing", "Fintech Innovations", "EdTech Solutions",
    "AgriTech Automation", "Green Energy Operations", "Franchise Management", "Non-Profit Operations",
    "Grant Writing & Funding", "Investor Relations", "Mergers & Acquisitions", "Procurement & Sourcing",
    "Vendor Management", "Facility Operations", "Corporate Governance", "Audit & Internal Control",
    "Risk Management", "Business Continuity", "Customer Success", "Localization & Translation",
    "Copywriting Lab", "Graphic Design Factory", "Motion Graphics Lab", "Audio Production Studio",
    "Executive Board Support"
]

for idx, name in enumerate(EXTENDED_DEPT_NAMES, start=52):
    slug = name.lower().replace(" ", "_").replace("&", "and").replace("/", "_")
    DEPARTMENTS.append((idx, name, slug))

SKILL_ACTION_TYPES = [
    ("Audit & Validate", "audit_and_validate", "low", False),
    ("Generate & Create", "generate_and_create", "low", False),
    ("Analyze & Optimize", "analyze_and_optimize", "low", False),
    ("Parse & Process", "parse_and_process", "low", False),
    ("Execute Local Workflow", "execute_local_workflow", "medium", False),
    ("Check Safety Rules", "check_safety_rules", "low", False),
    ("Index Memory Entry", "index_memory_entry", "low", False),
    ("Structure JSON Data", "structure_json_data", "low", False),
    ("Formulate Strategy", "formulate_strategy", "low", False),
    ("Build SOP Document", "build_sop_document", "low", False),
    ("Run Quality Check", "run_quality_check", "low", False),
    ("Generate Report", "generate_report", "low", False),
    ("Extract Data Insights", "extract_data_insights", "low", False),
    ("Prepare Approval Request", "prepare_approval_request", "medium", True),
    ("Draft Response Plan", "draft_response_plan", "low", False),
    ("Verify Compliance Rules", "verify_compliance_rules", "low", False),
    ("Manage Backup Archive", "manage_backup_archive", "medium", True),
    ("Deploy Local Package", "deploy_local_package", "high", True),
    ("Synthesize Intelligence", "synthesize_intelligence", "low", False),
    ("Master Executive Action", "master_executive_action", "medium", True),
]

def generate_skills():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM skills")

    total_skills = 0

    for dept_id, dept_name, dept_slug in DEPARTMENTS:
        cat_dir = os.path.join(SKILLS_DIR, dept_slug)
        os.makedirs(cat_dir, exist_ok=True)

        for skill_idx, (action_title, action_slug, risk_level, requires_approval) in enumerate(SKILL_ACTION_TYPES, start=1):
            skill_name = f"{action_slug}_{dept_slug}_skill"
            title = f"{action_title} ({dept_name})"
            skill_dir = os.path.join(cat_dir, skill_name)
            os.makedirs(skill_dir, exist_ok=True)
            skill_file_path = os.path.join(skill_dir, "SKILL.md")

            frontmatter = f"""---
name: {skill_name}
title: {title}
category: {dept_name}
version: 1.0.0
status: private
risk_level: {risk_level}
requires_approval: {"true" if requires_approval else "false"}
allowed_tools:
  - local_ai
  - memory_read
  - memory_write
  - file_output
forbidden_tools:
  - shell_unrestricted
  - secret_read
  - paid_api
  - bulk_send
  - dns_change
  - delete_files
  - public_publish
  - private_login_scrape
  - real_person_clone_without_consent
  - celebrity_voice_clone
  - copyrighted_music_copy
  - copyrighted_website_copy
inputs:
  - owner_command
  - task_context
outputs:
  - skill_output
---
"""

            body = f"""
# Purpose
Private execution skill for **{title}** operating strictly within self-hosted local rules.

# When to Use
Triggered when task context requires **{action_title.lower()}** for **{dept_name}**.

# Inputs
- `owner_command`: Primary directive from owner.
- `task_context`: Context data, memory references, and parameters.

# Steps
1. Parse `owner_command` and inspect Protection Mode constraints.
2. Check Payment Guard to ensure `PAID_AI_API_ALLOWED=false`.
3. Query HOT memory and department SOP for reusable context.
4. Execute private local logic using local AI or rule-based generators.
5. Format final output and write logs to `storage/outputs/`.

# Output Format
Returns structured JSON and Markdown summary.

# Safety Rules
- LOCAL_FIRST=true
- PRIVATE_SKILLS_ONLY=true
- NO_SURPRISE_PAYMENT=true
- NEVER steal credentials, tokens, or session cookies.

# Approval Rules
- Owner approval required if `risk_level` is high or requires file deletions / shell commands.

# Failure Handling
- If local LLM fails, switch to local prompt-pack fallback. Log warning in `storage/protection_logs/`.

# Example
```json
{{
  "skill": "{skill_name}",
  "status": "success",
  "result": "{title} completed with 100% compliance."
}}
```
"""
            content = frontmatter + body
            with open(skill_file_path, "w", encoding="utf-8") as f:
                f.write(content)

            allowed_tools_json = json.dumps(["local_ai", "memory_read", "memory_write", "file_output"])
            forbidden_tools_json = json.dumps(["shell_unrestricted", "paid_api", "secret_read", "bulk_send"])

            cursor.execute(
                """INSERT INTO skills 
                (id, slug, title, category, risk_level, requires_approval, status, allowed_tools, forbidden_tools, content, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                (f"SKILL-{total_skills+1:04d}", skill_name, title, dept_name, risk_level, 1 if requires_approval else 0, "approved", allowed_tools_json, forbidden_tools_json, content)
            )

            total_skills += 1

    conn.commit()
    conn.close()
    print(f"✓ Generated {total_skills} private skills across {len(DEPARTMENTS)} categories in {SKILLS_DIR}")

if __name__ == "__main__":
    generate_skills()
