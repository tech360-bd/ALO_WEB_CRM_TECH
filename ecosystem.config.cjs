// HISTORICAL ONLY: excluded from cPanel production. Not a supported production path.
// PM2 Ecosystem Configuration — ALO Education
//
// MERGED 2026-09-18 from two implementations:
//   * this repo's config — app name, PORT 3044, HOSTNAME 0.0.0.0, relative cwd,
//     repo-relative log paths, 2G memory ceiling (the CI build needs a 4G heap,
//     so a 1G ceiling would OOM-kill a legitimately busy instance)
//   * the `other-ai-builder-2026-09-13` config — restart strategy, graceful
//     shutdown, log timestamping, watch ignores
//
// Deliberately NOT taken from the other implementation:
//   * PORT 3015 and HOSTNAME 127.0.0.1 — production is 3044 behind a reverse
//     proxy; 3015 is the legacy cPanel target. tests/unit/deployment-config.test.ts
//     pins PORT "3044".
//   * cwd '/home/aloedu/aloeducation' — the VPS deployment path is
//     /root/alo-github-main-new. A relative cwd lets PM2 inherit the directory
//     it is started from, which the deploy workflow already resolves.
//   * error_file/out_file under /var/log/... — that directory is not provisioned
//     by the deploy workflow; logs stay in storage/logs/ which the workflow
//     backs up before replacing code.
//   * health_check{} — not a supported PM2 option (PM2 would warn and ignore
//     it). Liveness is covered by GET /api/health plus the health-monitor
//     workflow.
//   * the three mini-service apps — see the note at the bottom of this file.
//
// Usage:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 restart alo-education --update-env
//   pm2 status
//   pm2 logs alo-education

module.exports = {
  apps: [
    {
      name: "alo-education",
      script: ".next/standalone/server.js",
      cwd: "./",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3044",
      },
      env_production: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3044",
      },

      // --- restart strategy (from the other implementation) ---
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 3000,
      max_memory_restart: "2G",

      // --- logging (paths kept repo-relative) ---
      error_file: "storage/logs/pm2-error.log",
      out_file: "storage/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // --- watch disabled in production ---
      watch: false,
      ignore_watch: ["node_modules", "storage/logs", "storage/uploads", ".next"],

      // --- graceful shutdown (from the other implementation) ---
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};

// ---------------------------------------------------------------------------
// NOTE — mini-services (sla-monitor, follow-up-sender, university-monitor)
//
// The other implementation also declared these three as PM2 apps run under the
// `bun` interpreter. They exist in this repo at mini-services/*/index.ts with
// their own bun.lock files, so they are real code, not dead weight.
//
// They are intentionally NOT declared here:
//   * `pm2 restart ecosystem.config.cjs` in the deploy workflow would start
//     them, changing production behaviour on a deploy whose contract is to
//     restart `alo-education` only.
//   * they require `bun` on the VPS, while this project's package manager is
//     npm (tests/unit/deployment-config.test.ts asserts no root bun.lock).
//
// Enable them deliberately, as a separate reviewed change, once bun is
// provisioned on the VPS and each service has been smoke-tested.
// ---------------------------------------------------------------------------
