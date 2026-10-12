/** Server-side RunningHub OpenAPI adapter, independently implemented from the
 * published RH_ExecuteNode contract. It is NOT ComfyUI's /prompt API.
 * No automatic creation retries (a timed-out request may have started a paid job).
 * Credentials and workflow/node mappings must be controlled by the server.
 */
export interface RunningHubNodeInput { nodeId: string; fieldName: string; fieldValue: string }
export interface RunningHubOutput { fileUrl: string; fileType: string }
function config() {
  const key = process.env.RUNNINGHUB_API_KEY;
  const raw = process.env.RUNNINGHUB_API_URL;
  if (!key || !raw) throw new Error('RunningHub API URL and key are not configured.');
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('RunningHub requires a trusted HTTPS base URL.');
  return { key, base: url.toString().replace(/\/$/, '') };
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
async function post(path: string, payload: Record<string, unknown>) {
  const { base, key } = config();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, apiKey: key }), redirect: 'error', signal: AbortSignal.timeout(30_000) });
  } catch { throw new Error('RunningHub request outcome is unknown. Check the provider before retrying job creation.'); }
  if (!response.ok) throw new Error(`RunningHub returned HTTP ${response.status}.`);
  try { return object(await response.json()); } catch { throw new Error('RunningHub returned invalid JSON.'); }
}
export async function createRunningHubTask(workflowId: string, nodeInfoList: RunningHubNodeInput[]) {
  if (!/^\d+$/.test(workflowId) || !Array.isArray(nodeInfoList) || nodeInfoList.length > 100 || nodeInfoList.some((node) => !/^\d+$/.test(node.nodeId) || !/^[a-zA-Z0-9_]+$/.test(node.fieldName) || typeof node.fieldValue !== 'string' || node.fieldValue.length > 20_000)) {
    throw new Error('A valid workflow ID and node input mappings are required.');
  }
  const json = await post('/task/openapi/create', { workflowId, nodeInfoList });
  const data = object(json.data);
  if (json.code !== 0 || typeof data.taskId !== 'string' || !data.taskId) throw new Error('RunningHub did not acknowledge a task ID. Check the provider before resubmitting.');
  return { taskId: data.taskId, status: data.taskStatus === 'RUNNING' ? 'running' as const : 'queued' as const };
}
export async function getRunningHubTask(taskId: string): Promise<{ taskId: string; status: 'queued' | 'running' | 'completed' | 'failed'; outputs: RunningHubOutput[] }> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(taskId)) throw new Error('Invalid RunningHub task ID.');
  const json = await post('/task/openapi/outputs', { taskId });
  if (json.msg === 'APIKEY_TASK_IS_QUEUED') return { taskId, status: 'queued', outputs: [] };
  if (json.msg === 'APIKEY_TASK_IS_RUNNING') return { taskId, status: 'running', outputs: [] };
  if (json.code !== 0) return { taskId, status: 'failed', outputs: [] };
  if (!Array.isArray(json.data)) throw new Error('RunningHub returned an invalid output list.');
  const outputs = json.data.map((raw) => {
    const item = object(raw);
    if (typeof item.fileUrl !== 'string' || typeof item.fileType !== 'string') throw new Error('RunningHub returned an invalid output.');
    const url = new URL(item.fileUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('RunningHub returned an unsafe output URL.');
    return { fileUrl: url.toString(), fileType: item.fileType };
  });
  // No placeholders if a completed workflow produced zero output.
  return { taskId, status: 'completed', outputs };
}
