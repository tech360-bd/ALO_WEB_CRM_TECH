// PM2 Ecosystem Configuration for ALO Education
// Usage: pm2 start ecosystem.config.cjs --env production
// Restart: pm2 restart alo-education
// Status: pm2 status
// Logs: pm2 logs alo-education
// Stop: pm2 stop alo-education

module.exports = {
  apps: [
    {
      name: 'alo-education',
      script: '.next/standalone/server.js',
      cwd: '/home/aloedu/aloeducation',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3015,
        HOSTNAME: '127.0.0.1',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3015,
        HOSTNAME: '127.0.0.1',
      },
      // Restart strategy
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '1G',
      restart_delay: 3000,
      // Logging
      error_file: '/var/log/alo-education/error.log',
      out_file: '/var/log/alo-education/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Watch (disabled in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Auto-restart on file change (disabled in production)
      autorestart: true,
      // Health check
      health_check: {
        interval: 60000,
        timeout: 5000,
        path: '/api/health',
      },
    },
    // Mini-service: SLA Monitor
    {
      name: 'alo-sla-monitor',
      script: 'mini-services/sla-monitor/index.ts',
      cwd: '/home/aloedu/aloeducation',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 5000,
      error_file: '/var/log/alo-education/sla-error.log',
      out_file: '/var/log/alo-education/sla-output.log',
      autorestart: true,
    },
    // Mini-service: Follow-up Sender
    {
      name: 'alo-follow-up-sender',
      script: 'mini-services/follow-up-sender/index.ts',
      cwd: '/home/aloedu/aloeducation',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 5000,
      error_file: '/var/log/alo-education/followup-error.log',
      out_file: '/var/log/alo-education/followup-output.log',
      autorestart: true,
    },
    // Mini-service: University Monitor
    {
      name: 'alo-university-monitor',
      script: 'mini-services/university-monitor/index.ts',
      cwd: '/home/aloedu/aloeducation',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 5000,
      error_file: '/var/log/alo-education/monitor-error.log',
      out_file: '/var/log/alo-education/monitor-output.log',
      autorestart: true,
    },
  ],
};
