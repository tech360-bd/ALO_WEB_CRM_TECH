/**
 * GET /api/ai/tools
 * List available tools from the tool gateway.
 */

import { NextResponse } from 'next/server';
import { listTools, getTool } from '@/lib/ai/tool-gateway';

export async function GET() {
  try {
    const toolNames = listTools();
    const tools = toolNames.map((name) => {
      const def = getTool(name);
      if (!def) return { name, available: false };
      return {
        name: def.name,
        description: def.description,
        parameters: def.parameters,
        riskLevel: def.riskLevel ?? 'low',
        requiredPermissions: def.requiredPermissions ?? [],
        available: true,
      };
    });

    return NextResponse.json({ tools, count: tools.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
