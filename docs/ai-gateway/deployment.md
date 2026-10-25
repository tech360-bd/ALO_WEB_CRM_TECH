# Deployment

> **Precondition:** this document is written for the production host, which was
> **not reachable** from the audit environment. Service names, paths and the
> process manager are therefore *placeholders to be confirmed* (`U1–U5` in
> `baseline.md`). Do not paste these commands onto a host whose actual layout has
> not been inspected — in particular, do not invent a process name and never use
> `pm2 delete all`, `kill` by broad pattern, or a database reset.

## 1. What is being deployed

| Artifact | Type | Requires restart of existing apps? |
|---|---|---|
| `services/ai-gateway/*` | new standalone Node process | no |
| `.env.ai-gateway.example` → host secret file | configuration | no |
| `monitoring/*` | Prometheus/Grafana configuration | no |
| `src/lib/phd/ai/gateway.ts`, `src/lib/phd/ai/client.ts` | application code (flag off by default) | **yes** — only when the flag is turned on |

No database migration, schema change, bucket change or DNS change is included.

## 2. Pre-deployment checklist

- [ ] Record current commit SHAs of the application and the gateway.
- [ ] Record current service state (`pm2 list` / `systemctl status <real-unit>`).
- [ ] Record the real port map (`ss -ltnp`) and reverse-proxy config.
- [ ] Confirm a **fresh backup** and a **tested restore path**; record the restore command.
- [ ] Confirm the secret store location and permissions (`600`, owned by the service user).
- [ ] Confirm ports 3180/9180 are free **or pick verified alternatives** and update every reference.
- [ ] Confirm `AI_EXTERNAL_DATA_POLICY` decision is written down (default `restricted`).
- [ ] Run `bash scripts/verify-ai-gateway.sh` on a non-production host.
- [ ] Confirm nobody has enabled `AI_GATEWAY_ENABLE_MOCK` in production.

## 3. Install the gateway

1. Place the repository (or at least `services/ai-gateway/`) on the host.
2. Create the secret file:

   ```bash
   sudo install -d -m 750 /etc/alo
   sudo install -m 600 /dev/null /etc/alo/ai-gateway.env
   sudoedit /etc/alo/ai-gateway.env      # paste values from .env.ai-gateway.example
   ```

3. Create a dedicated system user with no shell and no access to the application
   source tree beyond `services/ai-gateway`:

   ```bash
   sudo useradd --system --home /nonexistent --shell /usr/sbin/nologin alo-gateway
   ```

4. **systemd example** (only if systemd is the service manager on the real host —
   it was present but unused in the audit sandbox):

   ```ini
   # /etc/systemd/system/alo-ai-gateway.service
   [Unit]
   Description=ALO shared AI gateway
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=alo-gateway
   Group=alo-gateway
   WorkingDirectory=/opt/alo/services/ai-gateway
   EnvironmentFile=/etc/alo/ai-gateway.env
   ExecStart=/usr/bin/node /opt/alo/services/ai-gateway/server.mjs
   Restart=on-failure
   RestartSec=5
   NoNewPrivileges=true
   PrivateTmp=true
   ProtectSystem=strict
   ProtectHome=true
   ReadOnlyPaths=/opt/alo
   RestrictAddressFamilies=AF_INET AF_INET6
   MemoryMax=512M
   LimitNOFILE=4096

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now alo-ai-gateway
   systemctl status alo-ai-gateway --no-pager
   ```

5. **PM2 alternative** (only if PM2 is the real manager):

   ```bash
   pm2 start server.mjs --name alo-ai-gateway --cwd /opt/alo/services/ai-gateway \
     --time --max-memory-restart 512M
   pm2 save
   ```

   Record the exact app name; use it for logs and rollback. Do not use `pm2 delete all`.

## 4. Verify before integrating anything

```bash
curl -fsS http://127.0.0.1:3180/health/live
curl -fsS http://127.0.0.1:3180/health/ready
curl -fsS http://127.0.0.1:9180/metrics | head
ss -ltnp | grep -E ':(3180|9180)\b'   # must show 127.0.0.1 only
```

`/health/ready` must list the providers you actually configured. If it reports
`NO_PROVIDER`, stop: do not enable an application flag.

## 5. Integrate one application (PhD first)

The PhD module is the only consumer with a client already written.

1. Add to the PhD application's server environment:

   ```
   PHD_AI_GATEWAY_ENABLED=true
   AI_GATEWAY_BASE_URL=http://127.0.0.1:3180
   PHD_AI_GATEWAY_TOKEN=<the plaintext token for the `phd` identity>
   PHD_AI_GATEWAY_MODEL=<the local model id>
   ```

2. Restart **only** that application process through its existing manager.
3. Run one non-critical AI action (e.g. generate a section draft; the result is
   not written unless applied).
4. Confirm: the request appears in the gateway audit line; the PhD job result
   shows `provider: gateway:<id>`; the proposal is unchanged unless applied.
5. Compare the output with the previous direct-provider path before enabling any
   other module.

**Do not** enable CRM or AgentOS in the same change.

## 6. Monitoring (only if the stack is actually adopted)

```bash
sudo cp monitoring/prometheus/ai-gateway-scrape.yml /etc/prometheus/file_sd/   # adjust to real layout
sudo cp monitoring/prometheus/ai-gateway-alerts.yml /etc/alo/
promtool check config /etc/prometheus/prometheus.yml
promtool check rules /etc/alo/ai-gateway-alerts.yml
sudo systemctl reload prometheus
```

Keep `ALERTS_ENABLED=false` until a test notification has been delivered.

## 7. Change log to record

| Field | Value |
|---|---|
| Commit deployed | |
| Host | |
| Service manager + unit name | |
| Ports (verified) | |
| Providers enabled | |
| Applications enabled (flags) | |
| Backup reference | |
| Verification report path | `.ai-gateway-tmp/verification-results.json` |
| Operator + timestamp | |

## 8. Exit criteria for the deployment step

* Gateway restarts cleanly under the real service manager (SIGTERM exits 0).
* Loopback binding verified with `ss`.
* `/health/live` and `/health/ready` behave distinctly.
* No application flag enabled until its own integration test passes.
* Rollback rehearsed (see `rollback.md`).
