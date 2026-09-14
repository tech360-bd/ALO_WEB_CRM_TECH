// ============================================================
// IP Flow Trace (YutaroHayakawa/ipftrace2)
// Network diagnostics for CRM connectivity (SIP/RTP, httpsms webhook)
// Lightweight wrapper — in production calls `ipftrace2` eBPF tool via sidecar
// ============================================================

export async function traceIpFlow(dstIp: string, port?: number){
  // In prod: exec `ipftrace2 -d ${dstIp} -p ${port}` and parse JSON
  // Here we return a diagnostic stub with guidance
  return {
    dstIp,
    port: port||5060,
    hops: [] as { ip:string; rttMs:number }[],
    status:'stub — deploy ipftrace2 sidecar for eBPF trace',
    guidance:'For SIP 502/503, check Linphone transport=tls + firewall 5060/5061 + Cloudflare Tunnel for httpsms webhook',
  };
}
