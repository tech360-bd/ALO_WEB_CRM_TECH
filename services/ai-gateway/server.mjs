#!/usr/bin/env node
/**
 * Standalone entry point. The process manager (systemd/PM2/Docker) that already
 * runs the applications should run this file; the gateway does not install its
 * own supervisor.
 *
 *   node services/ai-gateway/server.mjs
 *
 * Configuration is read from the environment (see .env.ai-gateway.example).
 * Startup fails closed: invalid configuration exits non-zero instead of
 * starting with a silently degraded policy.
 */
import { loadConfig, assertProductionConfig, createGateway } from './gateway.mjs';

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  // A malformed registry must be reported without a stack trace (and without
  // echoing any value from the environment).
  process.stderr.write(`${JSON.stringify({
    level: 'error',
    service: 'ai-gateway',
    event: 'config_invalid',
    problems: [error instanceof Error ? error.message : 'Configuration could not be parsed.'],
  })}\n`);
  process.exit(1);
}
const problems = assertProductionConfig(config);
if (problems.length) {
  process.stderr.write(`${JSON.stringify({ level: 'error', service: 'ai-gateway', event: 'config_invalid', problems })}\n`);
  if (config.nodeEnv === 'production') process.exit(1);
}

const gateway = createGateway(config);
const running = await gateway.listen();

const address = running.address;
const metrics = running.metricsAddress;
process.stdout.write(`${JSON.stringify({
  level: 'info',
  service: 'ai-gateway',
  event: 'started',
  version: config.version,
  address: typeof address === 'object' ? `${address.address}:${address.port}` : String(address),
  metrics: metrics && typeof metrics === 'object' ? `${metrics.address}:${metrics.port}` : null,
  apps: config.apps.map((app) => app.id),
  providers: gateway.state.providers.map((provider) => ({ id: provider.id, policy: provider.policy, disabled: Boolean(provider.disabled) })),
})}\n`);

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`${JSON.stringify({ level: 'info', service: 'ai-gateway', event: 'shutdown', signal })}\n`);
  try {
    await running.close();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
