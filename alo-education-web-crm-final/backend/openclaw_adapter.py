import os
import glob
from backend.skill_validator import skill_validator

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIVATE_SKILLS_DIR = os.path.join(BASE_DIR, "skills", "private")

class OpenClawAdapter:
    def __init__(self):
        self.private_skills_only = True
        self.public_skills_disabled = True

    def load_skill(self, category_slug: str, skill_slug: str) -> dict:
        skill_path = os.path.join(PRIVATE_SKILLS_DIR, category_slug, skill_slug, "SKILL.md")
        if not os.path.exists(skill_path):
            return {"success": False, "error": f"Private skill {skill_slug} not found"}

        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()

        validation_status = skill_validator.process_skill(skill_slug, content)
        if validation_status == "BLOCKED":
            return {"success": False, "error": f"Skill {skill_slug} blocked by Skill Validator."}

        return {
            "success": True,
            "skill_slug": skill_slug,
            "category": category_slug,
            "content": content,
            "validation": validation_status
        }

    def list_private_skills(self) -> list:
        skills = []
        files = glob.glob(os.path.join(PRIVATE_SKILLS_DIR, "*", "*", "SKILL.md"))
        for f in files:
            parts = f.split(os.sep)
            skills.append({
                "category": parts[-3],
                "skill_slug": parts[-2],
                "path": f
            })
        return skills

openclaw_adapter = OpenClawAdapter()
