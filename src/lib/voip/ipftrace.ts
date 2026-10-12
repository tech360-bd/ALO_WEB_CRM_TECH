import { isIP } from 'node:net';

/** ipftrace2 traces kernel functions, not network hops or ping latency.
 * Requires a privileged Linux sidecar and an explicit operator action. Never
 * execute a shell command from a CRM input or invent network measurements.
 */
export async function traceIpFlow(dstIp: string, port = 5060) {
  if (!isIP(dstIp) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('A valid IP address and port (1–65535) are required.');
  }
  return { dstIp, port, available: false, status: 'not_configured' as const,
    events: [],
    guidance: 'No privileged ipftrace2 collector is installed. This tool observes Linux kernel packet paths; it is not a SIP client or traceroute service.' };
}
