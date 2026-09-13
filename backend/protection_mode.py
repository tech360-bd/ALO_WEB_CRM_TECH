import re
import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

DANGEROUS_PATTERNS = [
    r"curl\s+.*\|\s*bash",
    r"wget\s+.*\|\s*sh",
    r"rm\s+-rf\s+/",
    r"eval\(base64_decode",
    r"/etc/shadow",
    r"cat\s+~/\.ssh",
    r"cat\s+.*\.env",
    r"browser_passwords",
    r"wallet\.dat",
    r"session_tokens",
    r"ufw\s+disable",
    r"iptables\s+-F",
]

class ProtectionMode:
    def __init__(self):
        self.enabled = True
        self.local_first = True

    def check_command(self, command_text: str) -> dict:
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, command_text, re.IGNORECASE):
                self.log_blocked("UNSAFE_SHELL_PATTERN", command_text, f"Matches dangerous pattern: {pattern}")
                return {
                    "allowed": False,
                    "reason": f"Blocked by Protection Mode. Dangerous pattern detected: {pattern}",
                    "action": "BLOCKED"
                }

        # Check for risky commands requiring owner approval
        risky_keywords = ["delete", "drop table", "dns_change", "bulk_send", "public_publish", "real_person_clone", "celebrity_voice"]
        for kw in risky_keywords:
            if kw in command_text.lower():
                return {
                    "allowed": False,
                    "reason": f"Owner approval required for risky action: {kw}",
                    "action": "REQUIRES_OWNER_APPROVAL"
                }

        return {"allowed": True, "reason": "Passed Protection Mode check", "action": "ALLOW"}

    def log_blocked(self, rule: str, action: str, details: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO protection_logs (id, rule_triggered, action_blocked, details, timestamp) VALUES (?, ?, ?, ?, ?)",
            (f"PROT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}", rule, action[:200], details, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

protection_mode = ProtectionMode()
