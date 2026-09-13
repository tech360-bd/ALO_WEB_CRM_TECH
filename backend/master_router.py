import re

WORKFLOW_TRIGGERS = [
    ("digital_marketing_agency_workflow", ["digital marketing", "marketing agency", "campaign", "social media", "lead generation"]),
    ("education_agency_workflow", ["education agency", "student admission", "study abroad", "visa", "university application"]),
    ("technology_agency_workflow", ["technology agency", "software company", "build app", "build crm", "saas"]),
    ("finance_hr_admin_workflow", ["finance", "accounting", "hr", "payroll", "employee", "admin"]),
    ("image_ai_workflow", ["image", "poster", "thumbnail", "banner", "product image", "social design", "image prompt"]),
    ("academic_ai_workflow", ["study", "academic", "course", "lesson", "quiz", "exam", "assignment", "lms", "moodle", "certificate"]),
    ("video_production_workflow", ["video", "reel", "short video", "storyboard", "subtitle", "edit video", "motion graphics"]),
    ("song_music_workflow", ["song", "music", "jingle", "lyric", "beat", "melody", "chord", "background music"]),
    ("human_avatar_voice_workflow", ["real human avatar", "human-like video", "talking avatar", "voice clone", "human voice", "bangla voice", "english voice"]),
    ("website_app_builder_workflow", ["website builder", "app builder", "build website", "build app", "full-stack app", "bolt", "lovable", "replit agent"]),
    ("web_clone_original_rebuild_workflow", ["clone website", "rebuild website from url", "url to ui", "uxmagic", "original rebuild"]),
    ("scraper_agent_workflow", ["scrape website", "crawl website", "firecrawl", "crawl4ai", "browse ai", "extract markdown", "extract data"]),
    ("crm_saas_builder_workflow", ["crm saas", "react crm", "vite crm", "tailwind crm", "supabase crm", "firebase crm"]),
    ("static_html_full_project_workflow", ["html file", "static crm", "full html project", "no backend"]),
    ("auto_domain_project_deploy_workflow", ["add domain", "auto create folder", "upload project", "run project", "fix project", "deploy domain", "ssl"]),
    ("executive_ceo_control_workflow", ["ceo", "executive summary", "company report", "decision support", "kpi"]),
    ("crm_automation_workflow", ["crm automation", "follow up", "lead score", "pipeline"]),
    ("whatsapp_business_workflow", ["whatsapp", "whatsapp automation", "broadcast"]),
    ("seo_audit_workflow", ["seo", "seo audit", "keyword research", "meta title"]),
    ("paid_ads_planning_workflow", ["meta ads", "google ads", "ad copy", "pixel"]),
    ("proposal_contract_workflow", ["proposal", "contract", "agreement", "quotation"]),
    ("project_management_workflow", ["project scope", "sprint", "milestone"]),
    ("security_monitoring_workflow", ["firewall", "malware scan", "log watch"]),
    ("server_auto_deploy_workflow", ["server deploy", "nginx", "pm2", "certbot"]),
]

class MasterCommandRouter:
    def __init__(self):
        pass

    def route_command(self, command_text: str) -> dict:
        cmd_lower = command_text.lower()
        matched_workflow = "digital_marketing_agency_workflow" # Default fallback

        for wf_slug, keywords in WORKFLOW_TRIGGERS:
            for kw in keywords:
                if kw in cmd_lower:
                    matched_workflow = wf_slug
                    break
            if matched_workflow == wf_slug and matched_workflow != "digital_marketing_agency_workflow":
                break

        return {
            "intent": "WORKFLOW_EXECUTION",
            "matched_workflow": matched_workflow,
            "original_command": command_text
        }

master_router = MasterCommandRouter()
