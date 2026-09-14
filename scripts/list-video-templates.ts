/**
 * List Video Templates
 */

import { getVideoEngine } from "../src/lib/video-engine";

async function main() {
  const engine = getVideoEngine();
  const compositions = engine.getRemotionCompositions();
  
  console.log("=== Remotion Compositions ===");
  for (const c of compositions) {
    console.log(`- ${c.id}: ${c.name} (${c.category}) ${c.width}x${c.height} ${c.durationInFrames}frames`);
    console.log(`  ${c.description.slice(0, 100)}...`);
  }

  console.log("\n=== AI Prompt Presets ===");
  const { ALO_PROMPT_PRESETS } = await import("../src/lib/video-engine/ai-generation");
  for (const [k, v] of Object.entries(ALO_PROMPT_PRESETS)) {
    console.log(`- ${k}: ${v.slice(0, 80)}...`);
  }

  console.log("\n=== n8n Workflows ===");
  const { N8N_VIDEO_WORKFLOW_TEMPLATES } = await import("../src/lib/video-engine/n8n");
  for (const w of N8N_VIDEO_WORKFLOW_TEMPLATES) {
    console.log(`- ${w.id}: ${w.name} (${w.trigger}) - ${w.description.slice(0, 80)}...`);
  }
}

main().catch(console.error);
