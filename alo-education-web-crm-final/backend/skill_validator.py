import os
import re
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPROVED_DIR = os.path.join(BASE_DIR, "skills", "approved")
QUARANTINE_DIR = os.path.join(BASE_DIR, "skills", "quarantine")
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class SkillValidator:
    def __init__(self):
        pass

    def validate_skill_content(self, content: str) -> dict:
        dangerous_checks = [
            (r"curl\s+.*\|\s*bash", "Curl pipe bash execution"),
            (r"base64_decode", "Base64 decoded shell execution"),
            (r"cat\s+.*\.env", "Reading secret environment file"),
            (r"browser_passwords", "Accessing browser saved passwords"),
            (r"ssh/id_rsa", "Reading SSH private keys"),
            (r"paid_api", "Paid API request without approval"),
            (r"real_person_clone_without_consent", "Unconsented real person cloning"),
        ]

        findings = []
        for pattern, desc in dangerous_checks:
            if re.search(pattern, content, re.IGNORECASE):
                findings.append(desc)

        if findings:
            return {"status": "BLOCKED", "findings": findings}
        return {"status": "PASS", "findings": []}

    def process_skill(self, skill_id: str, content: str) -> str:
        res = self.validate_skill_content(content)
        status = res["status"]

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO skill_validation_logs (id, skill_id, status, findings, created_at) VALUES (?, ?, ?, ?, ?)",
            (f"VAL-{datetime.now().strftime('%Y%m%d%H%M%S%f')}", skill_id, status, ", ".join(res["findings"]), datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        return status

skill_validator = SkillValidator()
