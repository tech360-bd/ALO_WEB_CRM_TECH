/**
 * Video Engine Health Check Script
 * Checks health of all 34 repos providers
 */

import { getVideoEngine } from "../src/lib/video-engine";

async function main() {
  console.log("=== ALO Video Engine Health Check ===");
  console.log("Date:", new Date().toISOString());
  console.log("");

  const engine = getVideoEngine();
  const config = engine.getConfig();
  const stats = engine.getStats();
  const registry = engine.getRegistry();

  console.log(`Total repos: ${stats.total}, P0: ${stats.p0}, P1: ${stats.p1}, P2: ${stats.p2}`);
  console.log(`Integrated: ${stats.integrated}, Adapter Ready: ${stats.adapterReady}`);
  console.log("");

  console.log("Config:");
  console.log(`- Remotion: ${config.remotion.enabled ? "enabled" : "disabled"} (Lambda: ${config.remotion.lambdaEnabled})`);
  console.log(`- n8n: ${config.n8n.enabled ? "enabled" : "disabled"} (${config.n8n.webhookUrl ? "webhook set" : "no webhook"})`);
  console.log(`- LTX: ${config.aiProviders.ltx.enabled ? "enabled" : "disabled"}`);
  console.log(`- CogVideo: ${config.aiProviders.cogvideo.enabled ? "enabled" : "disabled"}`);
  console.log(`- Hunyuan: ${config.aiProviders.hunyuan.enabled ? "enabled" : "disabled"}`);
  console.log(`- VideoCaptioner: ${config.captioning.videocaptioner.enabled ? "enabled" : "disabled"}`);
  console.log(`- Jitsi: ${config.recording.jitsi.enabled ? "enabled" : "disabled"}`);
  console.log("");

  console.log("Checking provider health...");
  const health = await engine.getProvidersHealth();
  
  for (const [id, h] of Object.entries(health)) {
    const statusIcon = h.status === "online" ? "✅" : h.status === "not_configured" ? "⚠️" : "❌";
    console.log(`${statusIcon} ${h.name} (${id}): ${h.status} ${h.vramRequiredGB ? `${h.vramRequiredGB}GB VRAM` : ""} ${h.error ? `Error: ${h.error}` : ""}`);
  }

  console.log("");
  console.log("Registry (34 repos):");
  for (const entry of registry) {
    console.log(`- [${entry.integration.priority}] ${entry.name} (${entry.id}): ${entry.integration.status} - ${entry.category} - ${entry.license}`);
  }

  console.log("");
  console.log("=== Done ===");
}

main().catch(console.error);
