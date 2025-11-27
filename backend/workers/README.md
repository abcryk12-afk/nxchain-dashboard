# NXChain Blockchain Workers

This directory contains separate worker processes for blockchain operations to keep the main API server lightweight and responsive.

## Workers

### 1. Deposit Scanner (`depositScanner.js`)
- **Purpose**: Scans blockchain blocks for incoming deposits
- **Features**:
  - Interval-based scanning (every 3 seconds)
  - Memory leak prevention
  - Block-by-block processing
  - 1.5 second delay between blocks
  - Automatic garbage collection
  - Graceful shutdown handling

### 2. Sweep Worker (`sweepWorker.js`)
- **Purpose**: Processes pending deposits and sweeps funds to master wallet
- **Features**:
  - Automatic gas top-up
  - Private key derivation
  - Token and native BNB transfers
  - Error handling and retry logic
  - 30 second processing intervals

## Usage

### Development Mode
```bash
# Start API server only
npm start

# Start scanner only
npm run scanner

# Start sweep worker only
npm run sweep

# Start both workers
npm run workers

# Start everything (API + workers)
npm run all
```

### Production Mode (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start all processes
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Stop all processes
pm2 stop all

# Restart all processes
pm2 restart all
```

## Memory Management

### Scanner Memory Optimization
- Clear arrays and objects after each block
- Force garbage collection (`global.gc()`)
- 1.5 second delays prevent CPU spikes
- Block-by-block processing (no batching)

### Sweep Worker Memory Optimization
- Process deposits sequentially
- 2 second delays between sweeps
- Clear transaction objects after processing
- Error handling prevents memory leaks

## Monitoring

### Health Checks
```bash
# API Server Health
curl http://localhost:5000/api/health

# Check PM2 processes
pm2 monit

# View specific worker logs
pm2 logs nxchain-scanner
pm2 logs nxchain-sweep
```

### Memory Usage
```bash
# Check memory usage
pm2 show nxchain-api
pm2 show nxchain-scanner
pm2 show nxchain-sweep
```

## Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `MASTER_SEED_PHRASE`: Master wallet seed phrase
- `NODE_ENV`: Environment (development/production)

### Render.com Deployment
- API Server: Main web service
- Scanner Worker: Background worker
- Sweep Worker: Background worker

Each runs as a separate service with automatic restarts.

## Troubleshooting

### Common Issues
1. **Memory Leaks**: Workers automatically restart on high memory usage
2. **Scanner Stuck**: Check logs for block processing errors
3. **Sweep Failures**: Verify gas balance and network connectivity
4. **Database Issues**: Check MongoDB connection status

### Logs Location
- Development: Console output
- Production: `./logs/` directory
- PM2: `pm2 logs` command

### Graceful Shutdown
Both workers handle SIGINT and SIGTERM signals for clean shutdown:
```bash
# Stop workers gracefully
pm2 stop nxchain-scanner nxchain-sweep
```

## Performance Tips

1. **Scanner**: Adjust scan intervals based on network activity
2. **Sweep Worker**: Optimize gas prices for network conditions
3. **Memory**: Monitor with `pm2 monit` and adjust max_memory_restart
4. **Database**: Ensure proper indexing for deposit queries

## Security

- Private keys derived securely from master seed
- No private keys stored in database
- Workers run with minimal permissions
- Environment variables for sensitive data
