import os
import json
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
DB_PATH = os.path.join(STORAGE_DIR, "agentos.db")
AGENTS_DIR = os.path.join(BASE_DIR, "agents")
REGISTRY_PATH = os.path.join(AGENTS_DIR, "agent_registry_1020.json")

def ensure_directories():
    dirs = [
        os.path.join(BASE_DIR, "backend"),
        os.path.join(BASE_DIR, "agents"),
        os.path.join(BASE_DIR, "skills", "private"),
        os.path.join(BASE_DIR, "skills", "approved"),
        os.path.join(BASE_DIR, "skills", "quarantine"),
        os.path.join(BASE_DIR, "memory", "agents"),
        os.path.join(BASE_DIR, "memory", "departments"),
        os.path.join(BASE_DIR, "memory", "company"),
        os.path.join(BASE_DIR, "memory", "hot"),
        os.path.join(BASE_DIR, "memory", "warm"),
        os.path.join(BASE_DIR, "memory", "cold"),
        os.path.join(BASE_DIR, "memory", "archive"),
        os.path.join(BASE_DIR, "workflows"),
        os.path.join(STORAGE_DIR, "outputs"),
        os.path.join(STORAGE_DIR, "audit_logs"),
        os.path.join(STORAGE_DIR, "skill_logs"),
        os.path.join(STORAGE_DIR, "protection_logs"),
        os.path.join(STORAGE_DIR, "payment_logs"),
        os.path.join(STORAGE_DIR, "uploads"),
        os.path.join(STORAGE_DIR, "backups"),
        os.path.join(BASE_DIR, "scripts"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print(f"✓ Directories verified across {BASE_DIR}")

# 51 Primary Departments + 49 Extended Departments = 100 Departments
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

# Generate 49 additional departments to reach 100 departments total
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

ROLE_TEMPLATES = [
    ("Manager", "Overlook department strategy and execution workflow"),
    ("Planner", "Design step-by-step task breakdown and schedule"),
    ("Execution", "Perform core technical execution and generate output"),
    ("QA", "Verify output quality against standards and compliance"),
    ("Report", "Synthesize analytics and generate executive summaries"),
    ("Automation", "Integrate automated workflows and repetitive tasks"),
    ("Safety", "Enforce safety, protection rules, and permission checks"),
    ("Memory", "Index knowledge and save hot/warm/cold memory entries"),
    ("Productivity", "Optimize speed, template reuse, and task scoring"),
    ("Owner Approval", "Gate risky actions and prepare approval items"),
    ("Specialist 1", "Domain specialist handling primary task slice"),
    ("Specialist 2", "Domain specialist handling secondary task slice"),
    ("Specialist 3", "Technical specialist handling code and data validation"),
    ("Specialist 4", "Content specialist handling copy and design review"),
    ("Specialist 5", "Integration specialist handling APIs and webhooks"),
    ("Specialist 6", "Compliance specialist checking legal and privacy rules"),
    ("Specialist 7", "Performance specialist optimizing throughput"),
    ("Specialist 8", "Security specialist checking protection policies"),
    ("Specialist 9", "Customer experience specialist refining UX"),
    ("Specialist 10", "Final delivery specialist packaging outputs")
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables = [
        "users (id TEXT PRIMARY KEY, username TEXT, email TEXT, role TEXT, created_at TIMESTAMP)",
        "roles (id TEXT PRIMARY KEY, name TEXT, description TEXT)",
        "permissions (id TEXT PRIMARY KEY, name TEXT, category TEXT)",
        "role_permissions (role_id TEXT, permission_id TEXT)",
        "departments (id INTEGER PRIMARY KEY, name TEXT, slug TEXT, description TEXT)",
        "agents (id TEXT PRIMARY KEY, name TEXT, slug TEXT, department_id INTEGER, department_name TEXT, purpose TEXT, allowed_skills TEXT, forbidden_skills TEXT, allowed_tools TEXT, forbidden_tools TEXT, status TEXT, version TEXT, created_at TIMESTAMP)",
        "agent_versions (id TEXT PRIMARY KEY, agent_id TEXT, version TEXT, changelog TEXT, created_at TIMESTAMP)",
        "agent_permissions (agent_id TEXT, permission_id TEXT)",
        "skills (id TEXT PRIMARY KEY, slug TEXT, title TEXT, category TEXT, risk_level TEXT, requires_approval INTEGER, status TEXT, allowed_tools TEXT, forbidden_tools TEXT, content TEXT, created_at TIMESTAMP)",
        "skill_versions (id TEXT PRIMARY KEY, skill_id TEXT, version TEXT, content TEXT, created_at TIMESTAMP)",
        "skill_permissions (skill_id TEXT, permission_id TEXT)",
        "skill_validation_logs (id TEXT PRIMARY KEY, skill_id TEXT, status TEXT, findings TEXT, created_at TIMESTAMP)",
        "commands (id TEXT PRIMARY KEY, command_text TEXT, owner_id TEXT, status TEXT, created_at TIMESTAMP)",
        "tasks (id TEXT PRIMARY KEY, command_id TEXT, title TEXT, department TEXT, status TEXT, created_at TIMESTAMP, completed_at TIMESTAMP)",
        "task_steps (id TEXT PRIMARY KEY, task_id TEXT, step_index INTEGER, agent_id TEXT, skill_id TEXT, status TEXT, output TEXT, created_at TIMESTAMP)",
        "workflows (id TEXT PRIMARY KEY, name TEXT, slug TEXT, description TEXT, department TEXT, steps TEXT, status TEXT)",
        "workflow_steps (id TEXT PRIMARY KEY, workflow_id TEXT, step_order INTEGER, agent_id TEXT, action TEXT)",
        "approvals (id TEXT PRIMARY KEY, task_id TEXT, request_type TEXT, title TEXT, description TEXT, status TEXT, requested_by TEXT, reviewed_by TEXT, created_at TIMESTAMP)",
        "capability_requests (id TEXT PRIMARY KEY, capability_type TEXT, name TEXT, department TEXT, purpose TEXT, status TEXT, created_at TIMESTAMP)",
        "agent_build_requests (id TEXT PRIMARY KEY, name TEXT, department TEXT, purpose TEXT, status TEXT, created_at TIMESTAMP)",
        "skill_build_requests (id TEXT PRIMARY KEY, name TEXT, category TEXT, purpose TEXT, status TEXT, created_at TIMESTAMP)",
        "workflow_build_requests (id TEXT PRIMARY KEY, name TEXT, description TEXT, status TEXT, created_at TIMESTAMP)",
        "tool_approval_requests (id TEXT PRIMARY KEY, tool_name TEXT, agent_id TEXT, status TEXT, created_at TIMESTAMP)",
        "domain_deployments (id TEXT PRIMARY KEY, domain TEXT, stack TEXT, status TEXT, folder_path TEXT, ssl_active INTEGER, created_at TIMESTAMP)",
        "project_uploads (id TEXT PRIMARY KEY, filename TEXT, file_path TEXT, file_size INTEGER, project_type TEXT, created_at TIMESTAMP)",
        "agent_memory (id TEXT PRIMARY KEY, agent_id TEXT, key TEXT, value TEXT, updated_at TIMESTAMP)",
        "department_memory (id TEXT PRIMARY KEY, department_id INTEGER, key TEXT, value TEXT, updated_at TIMESTAMP)",
        "company_memory (id TEXT PRIMARY KEY, key TEXT, value TEXT, updated_at TIMESTAMP)",
        "memory_hot (id TEXT PRIMARY KEY, context_key TEXT, content TEXT, created_at TIMESTAMP)",
        "memory_warm (id TEXT PRIMARY KEY, context_key TEXT, content TEXT, created_at TIMESTAMP)",
        "memory_cold (id TEXT PRIMARY KEY, context_key TEXT, content TEXT, created_at TIMESTAMP)",
        "learning_reports (id TEXT PRIMARY KEY, task_id TEXT, summary TEXT, lessons TEXT, created_at TIMESTAMP)",
        "productivity_reports (id TEXT PRIMARY KEY, task_id TEXT, speed_score REAL, quality_score REAL, overall_score REAL, created_at TIMESTAMP)",
        "sop_updates (id TEXT PRIMARY KEY, department_id INTEGER, title TEXT, content TEXT, created_at TIMESTAMP)",
        "workflow_improvement_requests (id TEXT PRIMARY KEY, workflow_id TEXT, suggestion TEXT, status TEXT, created_at TIMESTAMP)",
        "automation_suggestions (id TEXT PRIMARY KEY, title TEXT, detail TEXT, status TEXT, created_at TIMESTAMP)",
        "blocked_actions (id TEXT PRIMARY KEY, action_type TEXT, reason TEXT, actor TEXT, timestamp TIMESTAMP)",
        "payment_guard_logs (id TEXT PRIMARY KEY, requested_api TEXT, blocked INTEGER, fallback_used TEXT, timestamp TIMESTAMP)",
        "protection_logs (id TEXT PRIMARY KEY, rule_triggered TEXT, action_blocked TEXT, details TEXT, timestamp TIMESTAMP)",
        "audit_logs (id TEXT PRIMARY KEY, actor TEXT, action TEXT, target TEXT, metadata TEXT, timestamp TIMESTAMP)",
        "outputs (id TEXT PRIMARY KEY, task_id TEXT, file_path TEXT, file_type TEXT, created_at TIMESTAMP)",
        "files (id TEXT PRIMARY KEY, filename TEXT, file_path TEXT, mime_type TEXT, size INTEGER, created_at TIMESTAMP)",
        "settings (key TEXT PRIMARY KEY, value TEXT, description TEXT)",
        "health_checks (id TEXT PRIMARY KEY, component TEXT, status TEXT, details TEXT, checked_at TIMESTAMP)",
        "error_logs (id TEXT PRIMARY KEY, error_type TEXT, message TEXT, stack_trace TEXT, timestamp TIMESTAMP)",
        "server_logs (id TEXT PRIMARY KEY, level TEXT, message TEXT, source TEXT, timestamp TIMESTAMP)",
        "deployment_logs (id TEXT PRIMARY KEY, domain TEXT, step TEXT, status TEXT, log_text TEXT, timestamp TIMESTAMP)"
    ]

    for table_def in tables:
        cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_def}")

    conn.commit()
    conn.close()
    print("✓ SQLite Database schema initialized at", DB_PATH)

def generate_agents():
    agents = []
    agent_counter = 1

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing departments & agents
    cursor.execute("DELETE FROM departments")
    cursor.execute("DELETE FROM agents")

    for dept_id, dept_name, dept_slug in DEPARTMENTS:
        cursor.execute(
            "INSERT INTO departments (id, name, slug, description) VALUES (?, ?, ?, ?)",
            (dept_id, dept_name, dept_slug, f"Department covering {dept_name}")
        )

        for role_name, role_desc in ROLE_TEMPLATES:
            agent_id = f"AGENT-{agent_counter:04d}"
            agent_name = f"{dept_name} {role_name} Agent"
            agent_slug = f"{dept_slug}_{role_name.lower().replace(' ', '_')}_agent"
            purpose = f"{role_desc} within {dept_name}."

            allowed_skills = json.dumps([f"skill_{dept_slug}_core", f"skill_{role_name.lower().replace(' ', '_')}"])
            forbidden_skills = json.dumps(["public_skill_unapproved", "paid_api_skill", "credential_theft"])
            allowed_tools = json.dumps(["local_ai", "memory_read", "memory_write", "file_output"])
            forbidden_tools = json.dumps(["shell_unrestricted", "paid_api", "secret_read", "bulk_send"])

            agent_obj = {
                "id": agent_id,
                "name": agent_name,
                "slug": agent_slug,
                "department_id": dept_id,
                "department_name": dept_name,
                "purpose": purpose,
                "allowed_skills": allowed_skills,
                "forbidden_skills": forbidden_skills,
                "allowed_tools": allowed_tools,
                "forbidden_tools": forbidden_tools,
                "input_schema": {"command": "string", "context": "object"},
                "output_schema": {"status": "string", "result": "object"},
                "workflow_steps": ["parse", "validate", "execute", "output"],
                "protection_rules": ["LOCAL_FIRST=true", "PAYMENT_GUARD=active"],
                "approval_rules": ["OWNER_APPROVAL_REQUIRED_FOR_RISKY_ACTIONS"],
                "status": "active",
                "version": "1.0.0"
            }

            agents.append(agent_obj)

            cursor.execute(
                """INSERT INTO agents 
                (id, name, slug, department_id, department_name, purpose, allowed_skills, forbidden_skills, allowed_tools, forbidden_tools, status, version, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (agent_id, agent_name, agent_slug, dept_id, dept_name, purpose, allowed_skills, forbidden_skills, allowed_tools, forbidden_tools, "active", "1.0.0", datetime.now().isoformat())
            )

            agent_counter += 1

    conn.commit()
    conn.close()

    # Save to agent_registry_1020.json
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump({"total_agents": len(agents), "agents": agents}, f, indent=2)

    print(f"✓ Generated {len(agents)} agents across {len(DEPARTMENTS)} departments into {REGISTRY_PATH}")

if __name__ == "__main__":
    ensure_directories()
    init_db()
    generate_agents()
