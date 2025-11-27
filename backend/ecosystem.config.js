module.exports = {
  apps: [
    {
      name: 'nxchain-api',
      script: 'server-enhanced.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    },
    {
      name: 'nxchain-scanner',
      script: 'workers/depositScanner.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/scanner-error.log',
      out_file: './logs/scanner-out.log',
      log_file: './logs/scanner-combined.log',
      time: true
    },
    {
      name: 'nxchain-sweep',
      script: 'workers/sweepWorker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/sweep-error.log',
      out_file: './logs/sweep-out.log',
      log_file: './logs/sweep-combined.log',
      time: true
    }
  ]
};
