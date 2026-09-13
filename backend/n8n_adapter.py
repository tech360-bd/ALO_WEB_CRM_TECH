class N8nAdapter:
    def __init__(self):
        self.enabled = True

    def check_status(self) -> dict:
        return {
            "online": False,
            "fallback": "Local Workflow Plan Engine Active"
        }

    def execute_workflow(self, workflow_slug: str, payload: dict) -> dict:
        return {
            "status": "success",
            "workflow": workflow_slug,
            "mode": "local_plan_execution",
            "payload_received": payload
        }

n8n_adapter = N8nAdapter()
