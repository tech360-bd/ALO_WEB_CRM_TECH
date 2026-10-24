import { lookup } from 'node:dns/promises';
import { isIP, type LookupFunction } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { isPublicIp } from '@/lib/university-monitoring-source-policy';
/** Internal targets require an exact host in server configuration, never a browser flag. */
export function privateWebhookHostAllowed(raw: string): boolean {
    try {
        const hostname = new URL(raw).hostname.toLowerCase().replace(/^\[|\]$/g, '');
        return (process.env.WEBHOOK_PRIVATE_HOST_ALLOWLIST || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean).includes(hostname);
    }
    catch {
        return false;
    }
}
export async function resolveWebhookTarget(raw: string) {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
        throw new Error('WEBHOOK_TARGET_REJECTED');
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
        throw new Error('WEBHOOK_HTTPS_REQUIRED');
    const host = url.hostname.replace(/^\[|\]$/g, '');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await Promise.race([lookup(host, { all: true, verbatim: true }), new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('WEBHOOK_DNS_TIMEOUT')), 5000); timer.unref(); })]).finally(() => { if (timer)
        clearTimeout(timer); });
    if (!addresses.length || (!privateWebhookHostAllowed(raw) && addresses.some(item => !isPublicIp(item.address))))
        throw new Error('WEBHOOK_PRIVATE_TARGET_REJECTED');
    return { url, address: addresses[0] };
}
/** DNS is checked once and pinned to the connection. No redirects, proxy inheritance,
 * unbounded response buffering or second DNS lookup can bypass the target policy. */
export async function secureWebhookFetch(raw: string, init: Record<string, unknown>): Promise<{
    status: number;
    text(): Promise<string>;
}> {
    const { url, address } = await resolveWebhookTarget(raw);
    return new Promise((resolve, reject) => {
        const call = url.protocol === 'https:' ? httpsRequest : httpRequest;
        const connection = call(url, {
            method: 'POST', headers: init.headers as Record<string, string>,
            signal: init.signal as AbortSignal | undefined,
            family: address.family,
            lookup: ((_hostname, _options, callback) => callback(null, address.address, address.family)) as LookupFunction,
        }, response => {
            const chunks: Buffer[] = [];
            let size = 0;
            response.on('data', (chunk: Buffer) => {
                size += chunk.length;
                if (size > 65536) {
                    response.destroy(new Error('WEBHOOK_RESPONSE_TOO_LARGE'));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('error', reject);
            response.on('end', () => { const body = Buffer.concat(chunks).toString('utf8').slice(0, 2000); resolve({ status: response.statusCode || 502, text: async () => body }); });
        });
        connection.on('error', () => reject(new Error('WEBHOOK_TRANSPORT_FAILED')));
        connection.end(String(init.body || ''));
    });
}
