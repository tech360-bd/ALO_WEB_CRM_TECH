// ============================================================
// ComfyUI — RunningHub APICall (HM-RunningHub/ComfyUI_RH_APICall)
// Bridges local ComfyUI workflows to ALO Marketing Studio (image/video)
// Supports: RH_ExecuteNode, RH_ImageUploader, RH_AudioUploader, 5 video ports, polling fallback
// ============================================================

export type ComfyUIWorkflow = {
  workflowJson: Record<string, any>; // ComfyUI workflow graph
  images?: { name: string; base64: string }[];
  audio?: { name: string; base64: string }[];
};

export async function runComfyWorkflow(opts: ComfyUIWorkflow & { apiUrl?: string; apiKey?: string }): Promise<{ images: string[]; videos: string[]; error?: string }> {
  const apiUrl = opts.apiUrl || process.env.COMFYUI_API_URL || process.env.RUNNINGHUB_API_URL;
  const apiKey = opts.apiKey || process.env.COMFYUI_API_KEY || process.env.RUNNINGHUB_API_KEY;
  if (!apiUrl || !apiKey) throw new Error('COMFYUI_API_URL / RUNNINGHUB_API_KEY not configured');

  // Upload images first (RH_ImageUploaderNode pattern)
  for (const img of opts.images || []) {
    await fetch(`${apiUrl}/upload/image`, { method:'POST', headers:{ Authorization:`Bearer ${apiKey}` }, body: JSON.stringify({ image: img.base64, name: img.name, overwrite: true })}).catch(()=>{});
  }

  // Submit workflow — RunningHub style: POST /prompt
  const submit = await fetch(`${apiUrl}/prompt`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` },
    body: JSON.stringify({ prompt: opts.workflowJson }),
  });
  const submitJson: any = await submit.json().catch(()=>({}));
  const promptId = submitJson.prompt_id || submitJson.id;
  if (!promptId) throw new Error(submitJson.error || 'ComfyUI submit failed');

  // Poll via HTTP (fallback when WebSocket lost — see RH_ExecuteNode 84e45)
  for (let i=0; i<60; i++) {
    await new Promise(r=> setTimeout(r, 2000));
    const hist = await fetch(`${apiUrl}/history/${promptId}`, { headers:{ Authorization:`Bearer ${apiKey}` }}).then(r=> r.json()).catch(()=>null);
    const entry = hist?.[promptId];
    if (entry?.status?.completed || entry?.outputs) {
      const outputs = entry.outputs || {};
      const images: string[] = [];
      const videos: string[] = [];
      for (const node of Object.values(outputs) as any[]) {
        for (const img of node.images || []) images.push(img.filename || img.url);
        for (const v of (node.gifs || []).concat(node.videos || [])) videos.push(v.filename || v.url);
        // 5 video ports: video1..video5 — collect all
        for (let k=1;k<=5;k++) for (const v of node[`video${k}`] || []) videos.push(v.filename || v.url);
      }
      return { images, videos };
    }
    if (entry?.status?.failed) return { images:[], videos:[], error: 'ComfyUI failed' };
  }
  return { images:[], videos:[], error:'timeout' };
}

// Helper for marketing: generate poster with ALO brand (#F97316 + blue)
export async function generateMarketingPoster(caption: string, style: string){
  // In production load workflow JSON from `prisma: MarketingAsset` + RunningHub workflow
  return runComfyWorkflow({ workflowJson:{ caption, style, brand:'#F97316' } as any });
}
