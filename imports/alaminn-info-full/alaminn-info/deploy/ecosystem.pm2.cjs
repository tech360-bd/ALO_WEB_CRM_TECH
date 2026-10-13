// ─────────────────────────────────────────────────────────────────
// PM2 ecosystem — alternative to systemd (optional)
// Use ONLY if you prefer PM2 over systemd. systemd is recommended on
// Ubuntu 22.04 (zero extra deps, journald logging, auto-restart).
//
// START:
//   pm2 start deploy/ecosystem.pm2.cjs --env production
//   pm2 save && pm2 startup   # enable boot persistence
//
// LOGS:
//   pm2 logs alaminn-info
// ─────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: "alaminn-info",
      cwd: "/var/www/alaminn-info",
      script: ".next/standalone/server.js",
      instances: "1",          // single instance — Next.js standalone handles concurrency
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NODE_OPTIONS: "--max-old-space-size=512",
      },
      env_file: ".env",        // PM2 5.2+ supports env_file
      // ── Restart policy ──────────────────────────────────────
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,
      max_memory_restart: "768M",
      // ── Logs (in addition to journald) ──────────────────────
      out_file: "/var/www/alaminn-info/logs/out.log",
      error_file: "/var/www/alaminn-info/logs/error.log",
      merge_logs: true,
      time: true,
      // ── Graceful shutdown ───────────────────────────────────
      kill_timeout: 5000,
      listen_timeout: 10000,
      // ── Watch (OFF in production — use deploy script to restart)
      watch: false,
    },
  ],
};
