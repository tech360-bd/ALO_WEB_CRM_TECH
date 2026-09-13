import urllib.request
import json
import os

class LocalAI:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.default_model = "qwen2.5:7b"

    def check_status(self) -> dict:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", headers={"User-Agent": "AgentOS"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())
                    return {"online": True, "models": [m.get("name") for m in data.get("models", [])]}
        except Exception:
            pass
        return {"online": False, "models": [], "fallback": "Local Prompt Pack Fallback Active"}

    def generate(self, prompt: str, system_prompt: str = "") -> dict:
        status = self.check_status()
        if not status["online"]:
            return {
                "text": f"[LOCAL FALLBACK GENERATION]: Processed directive '{prompt[:80]}...' using local canonical template rule-engine.",
                "model": "local_rule_fallback",
                "fallback_used": True
            }

        try:
            payload = json.dumps({
                "model": self.default_model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False
            }).encode('utf-8')

            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res_data = json.loads(resp.read().decode())
                return {
                    "text": res_data.get("response", ""),
                    "model": self.default_model,
                    "fallback_used": False
                }
        except Exception as e:
            return {
                "text": f"[LOCAL FALLBACK GENERATION]: Exception occurred ({str(e)}). Processed using local rule-engine.",
                "model": "local_rule_fallback",
                "fallback_used": True
            }

local_ai = LocalAI()
