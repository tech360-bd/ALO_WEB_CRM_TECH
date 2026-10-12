/** Local ComfyUI provider using an operator-configured API graph.
 * RunningHub uses its separate OpenAPI adapter. No invented video workflows.
 */
import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from '../types';
import type { AIVideoProvider } from './providers';
import { enqueueComfyWorkflow, enqueueComfyGraph, pollComfyWorkflow, requestComfy, type ComfyWorkflowTemplate } from '@/lib/comfyui-client';

function template(): ComfyWorkflowTemplate {
  const raw = process.env.COMFYUI_VIDEO_WORKFLOW_JSON;
  if (!raw) throw new Error('A verified COMFYUI_VIDEO_WORKFLOW_JSON API graph and textPrompt binding are required.');
  const parsed = JSON.parse(raw) as ComfyWorkflowTemplate;
  if (!parsed.workflow || !parsed.inputBindings?.textPrompt) throw new Error('Video workflow input bindings are not configured.');
  return parsed;
}
const REQUEST_BINDINGS = ['negativePrompt', 'durationSec', 'aspectRatio', 'resolution', 'fps', 'seed', 'steps', 'guidanceScale'] as const;
export const ComfyUIProvider: AIVideoProvider = {
  id: 'comfyui', name: 'ComfyUI (configured workflow)',
  description: 'Local ComfyUI requires a verified installed workflow and ALO output-storage transfer.',
  repoUrl: 'https://github.com/HM-RunningHub/ComfyUI_RH_APICall',
  vramRequiredGB: 0, quality: 3, speed: 3,
  supports: { t2v: false, i2v: false, longVideo: false, customResolution: false },
  buildPrompt(prompt) { return prompt; },
  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    // There is no output-transfer worker installed yet. Do not start a paid or
    // GPU-intensive task whose outputs cannot be attached to the ALO job.
    void req;
    throw new Error('ComfyUI video is unavailable until a verified workflow and ALO output-storage transfer worker are installed. Use the draft creative composer for local exports.');
  },
  async health(): Promise<ProviderHealth> {
    let error = 'ComfyUI requires a verified workflow and output-storage transfer worker.';
    try { template(); error = 'Workflow configured; ALO output-storage transfer worker is not installed.'; } catch (e) { error = e instanceof Error ? e.message : error; }
    return { id: 'comfyui', name: 'ComfyUI', category: 'ai_generation', status: 'not_configured', lastCheckedAt: new Date().toISOString(), supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false }, error };
  },
};

export interface ComfyUIWorkflow { nodes: ComfyWorkflowTemplate['workflow'] }
/** Internal operator-only graph API. Authentication belongs to the calling API. */
export async function queueComfyUIWorkflow(workflow: ComfyUIWorkflow, _clientId?: string) {
  return { promptId: await enqueueComfyGraph(workflow.nodes), status: 'queued' };
}
export async function getComfyUIHistory(promptId: string) { return pollComfyWorkflow(promptId); }
export async function getComfyUIQueue(): Promise<unknown> { return (await requestComfy('/queue')).json(); }
// Prebuilt graphs were unverified custom-node guesses. Configure a real exported
// API graph instead. Low-level poster/image callers may use this explicit helper.
export async function queueConfiguredVideoWorkflow(req: AIGenerationRequest) {
  if (req.referenceImageUrl) throw new Error('Reference images require a verified upload binding.');
  const configured = template();
  const graph = structuredClone(configured.workflow);
  const requestBindings = (configured as ComfyWorkflowTemplate & { requestBindings?: Partial<Record<typeof REQUEST_BINDINGS[number], { nodeId: string; field: string }>> }).requestBindings;
  for (const field of REQUEST_BINDINGS) {
    const value = req[field];
    if (value === undefined) continue;
    const binding = requestBindings?.[field];
    if (!binding || !Object.prototype.hasOwnProperty.call(graph[binding.nodeId]?.inputs ?? {}, binding.field)) throw new Error(`Missing verified ${field} workflow binding.`);
    graph[binding.nodeId].inputs[binding.field] = value;
  }
  return enqueueComfyWorkflow({ textPrompt: req.prompt }, { ...configured, workflow: graph });
}
