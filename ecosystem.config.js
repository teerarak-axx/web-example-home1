module.exports = {
  apps: [
    {
      name: 'baanpoo-studio',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1 --port 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '900M',
      env: { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
      time: true,
      kill_timeout: 10000,
    },
  ],
};
