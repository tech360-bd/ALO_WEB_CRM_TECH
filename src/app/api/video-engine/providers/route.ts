import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN"] };

export const GET = withAuth(async () => {
  try {
    const engine = getVideoEngine();
    const [health, registry, stats, config] = await Promise.all([
      engine.getProvidersHealth(),
      Promise.resolve(engine.getRegistry()),
      Promise.resolve(engine.getStats()),
      Promise.resolve(engine.getConfig()),
    ]);

    return NextResponse.json({
      success: true,
      health,
      registry,
      stats,
      config: {
        remotion: config.remotion,
        n8n: { enabled: config.n8n.enabled, webhookUrl: !!config.n8n.webhookUrl },
        storage: config.storage,
        brand: config.brand,
        aiProviders: Object.fromEntries(Object.entries(config.aiProviders).map(([k, v]: any) => [k, { enabled: v.enabled }])),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
