import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.openclaw_adapter import openclaw_adapter
from backend.skill_validator import skill_validator

def main():
    skills = openclaw_adapter.list_private_skills()
    print(f"Scanning {len(skills)} private skills for safety & compliance...")

    passed = 0
    blocked = 0

    for s in skills:
        with open(s["path"], "r", encoding="utf-8") as f:
            content = f.read()
        res = skill_validator.validate_skill_content(content)
        if res["status"] == "PASS":
            passed += 1
        else:
            blocked += 1

    print(f"✓ Validation complete: {passed} PASSED, {blocked} BLOCKED")

if __name__ == "__main__":
    main()
