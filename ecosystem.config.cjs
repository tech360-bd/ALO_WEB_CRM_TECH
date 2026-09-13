module.exports = {
  apps: [
    {
      name: "alo-education",
      script: ".next/standalone/server.js",
      cwd: "./",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      error_file: "storage/logs/pm2-error.log",
      out_file: "storage/logs/pm2-out.log",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3044"
      }
    }
  ]
};

