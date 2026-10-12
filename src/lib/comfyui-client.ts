/** Local/server-managed ComfyUI API. Cloud RunningHub has a separate adapter.
 * Templates are configured server-side API graphs with explicit input nodes.
 * This client never invents graphs or returns a fabricated poster/video URL.
 */
export type WorkflowInput = { image?: Buffer; audio?: Buffer; video?: Buffer; textPrompt?: string };
export interface ComfyInputBinding { nodeId: string; field: string }
export interface ComfyWorkflowTemplate {
  workflow: Record<string, { class_type: string; inputs: Record<string, unknown> }>;
  inputBindings: Partial<Record<keyof WorkflowInput, ComfyInputBinding>>;
}
function settings() {
  const raw = process.env.COMFYUI_API_URL;
  if (!raw) throw new Error('Local ComfyUI API URL is not configured. RunningHub requires its separate OpenAPI adapter.');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid configured ComfyUI base URL.');
  const headers: Record<string, string> = {};
  if (process.env.COMFYUI_API_KEY) headers.Authorization = `Bearer ${process.env.COMFYUI_API_KEY}`;
  return { base: url.toString().replace(/\/$/, ''), headers };
}
export async function requestComfy(path: string, init: RequestInit = {}) {
  const { base, headers } = settings();
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers }, redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`ComfyUI returned HTTP ${response.status}.`);
  return response;
}
function record(raw: unknown): Record<string, unknown> { return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}; }
export async function enqueueComfyGraph(workflow: ComfyWorkflowTemplate['workflow']): Promise<string> {
  if (!workflow || !Object.keys(workflow).length || Object.values(workflow).some((node) => typeof node?.class_type !== 'string' || !node.inputs || typeof node.inputs !== 'object')) throw new Error('A validated, installed ComfyUI API workflow is required.');
  const response = await requestComfy('/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow }) });
  const json = record(await response.json());
  if (typeof json.prompt_id !== 'string' || !json.prompt_id || Object.keys(record(json.node_errors)).length) throw new Error('ComfyUI did not accept the configured workflow.');
  return json.prompt_id;
}
export async function enqueueComfyWorkflow(input: WorkflowInput, template: ComfyWorkflowTemplate): Promise<string> {
  if (!template?.workflow || !template.inputBindings) throw new Error('A configured API graph and input bindings are required.');
  // Image uploads are supported by vanilla ComfyUI. Audio/video loaders depend
  // on specific installed nodes; no silent upload fallback is permitted.
  if (input.audio || input.video) throw new Error('Audio/video input needs a verified custom-node upload adapter.');
  const graph = structuredClone(template.workflow);
  const bind = (key: keyof WorkflowInput, value: string) => {
    const binding = template.inputBindings[key];
    if (!binding || !graph[binding.nodeId]?.inputs || !Object.prototype.hasOwnProperty.call(graph[binding.nodeId].inputs, binding.field)) throw new Error(`Missing configured ${key} input binding.`);
    graph[binding.nodeId].inputs[binding.field] = value;
  };
  if (input.textPrompt !== undefined) bind('textPrompt', input.textPrompt);
  if (input.image) {
    if (!input.image.length || input.image.length > 20 * 1024 * 1024) throw new Error('Image input must be between 1 byte and 20 MB.');
    const png = input.image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = input.image[0] === 255 && input.image[1] === 216;
    if (!png && !jpeg) throw new Error('Only PNG/JPEG image input is supported.');
    // Validate binding before any upload side effect.
    bind('image', 'pending');
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(input.image)], { type: png ? 'image/png' : 'image/jpeg' }), `alo-input.${png ? 'png' : 'jpg'}`);
    const json = record(await (await requestComfy('/upload/image', { method: 'POST', body: form })).json());
    if (typeof json.name !== 'string' || !json.name) throw new Error('ComfyUI upload did not return a filename.');
    bind('image', `${typeof json.subfolder === 'string' && json.subfolder ? `${json.subfolder}/` : ''}${json.name}`);
  }
  return enqueueComfyGraph(graph);
}
export interface ComfyOutput { filename: string; subfolder: string; type: string; kind: 'image' | 'video' | 'audio' }
export async function pollComfyWorkflow(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid ComfyUI prompt ID.');
  const history = record(await (await requestComfy(`/history/${encodeURIComponent(id)}`)).json());
  const run = record(history[id]);
  if (!Object.keys(run).length) return { status: 'running' as const, outputs: [] as ComfyOutput[] };
  const state = record(run.status);
  const messages = Array.isArray(state.messages) ? state.messages : [];
  // Error precedence: some failed runs also mark completed=true.
  if (state.status_str === 'error' || messages.some((message) => Array.isArray(message) && ['execution_error', 'execution_interrupted'].includes(message[0]))) return { status: 'failed' as const, outputs: [] as ComfyOutput[] };
  if (state.completed !== true) return { status: 'running' as const, outputs: [] as ComfyOutput[] };
  const outputs: ComfyOutput[] = [];
  for (const node of Object.values(record(run.outputs))) {
    for (const [field, kind] of [['images', 'image'], ['gifs', 'video'], ['videos', 'video'], ['audio', 'audio']] as const) {
      const items = record(node)[field];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const file = record(item);
        if (typeof file.filename !== 'string' || !file.filename || /[\/\\]/.test(file.filename) || file.filename.includes('..')) throw new Error('ComfyUI returned an invalid output descriptor.');
        const subfolder = typeof file.subfolder === 'string' ? file.subfolder : '';
        if (subfolder.split(/[\/\\]/).includes('..')) throw new Error('ComfyUI returned an invalid output directory.');
        outputs.push({ filename: file.filename, subfolder, type: typeof file.type === 'string' ? file.type : 'output', kind });
      }
    }
  }
  return { status: 'completed' as const, outputs };
}
export async function readComfyOutput(file: ComfyOutput): Promise<Response> {
  if (!file.filename || /[\/\\]/.test(file.filename) || file.filename.includes('..') || file.subfolder.split(/[\/\\]/).includes('..') || !['output', 'temp'].includes(file.type)) throw new Error('Invalid output descriptor.');
  return requestComfy(`/view?${new URLSearchParams({ filename: file.filename, subfolder: file.subfolder, type: file.type })}`);
}
export async function makeBrandedPoster(text: string, brand: { logoUrl?: string; colors?: string[]; caption?: string }, template?: ComfyWorkflowTemplate) {
  if (!template) throw new Error('A configured poster workflow is required. Use the local draft composer for template-based branded exports.');
  if (brand.logoUrl || brand.colors?.length || brand.caption) throw new Error('Brand overlays need explicit verified workflow bindings; they cannot be silently ignored.');
  return { id: await enqueueComfyWorkflow({ textPrompt: text }, template), status: 'queued' as const };
}
