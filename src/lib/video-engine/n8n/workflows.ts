/**
 * n8n Workflow Templates JSON
 * Pre-built workflows for ALO Video Engine
 * Repo: https://github.com/n8n-io/n8n.git
 */

export const N8N_WORKFLOW_JSON_TEMPLATES = {
  "lead-to-video": {
    name: "ALO Lead → Personalized Video → WhatsApp",
    nodes: [
      {
        parameters: { path: "lead-created", options: {} },
        id: "webhook",
        name: "Webhook - Lead Created",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [0, 0],
        webhookId: "lead-created-webhook",
      },
    ],
    connections: {},
  },
  // Additional templates defined in index.ts as N8N_VIDEO_WORKFLOW_TEMPLATES
};

export const N8N_WORKFLOW_README = `
## n8n Setup for ALO Video Engine

### Install n8n

Docker (recommended):
\`\`\`bash
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
\`\`\`

Or via npx:
\`\`\`bash
npx n8n
\`\`\`

Access: http://localhost:5678

### Configure ALO Webhooks

1. In n8n, create new workflow
2. Add Webhook node, set path e.g., "alo-video"
3. Copy webhook URL: https://your-n8n/webhook/alo-video
4. In ALO .env: N8N_WEBHOOK_URL=https://your-n8n/webhook/alo-video
5. In ALO, trigger events will POST to this webhook

### ALO Video Workflows

See src/lib/video-engine/n8n/index.ts for 7 pre-built templates:

- lead-to-video
- video-approval-publish
- counseling-recording-pipeline
- faq-to-video
- youtube-research
- ai-video-batch
- talking-head-multilingual

Import via POST /api/video-engine/n8n with action=create_from_template

### Environment

In n8n, set env vars:
- ALO_API=https://your-alo.com
- ALO_API_KEY=...

### Webhook Events from ALO

- lead.created
- video.project.created
- video.render.completed
- video.project.approved
- video.recording.completed
- etc (see n8n.ts)
`;
