#!/bin/bash

# NXChain Render.com Build Script
echo "🔥 Building NXChain for Render.com deployment..."

# Build frontend
echo "🔥 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Create render-specific configuration
echo "🔥 Creating render configuration..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: nxchain-frontend
    env: static
    rootDir: frontend/build
    buildCommand: cd frontend && npm run build
    staticPublishPath: .
    routes:
      - route: /api/*
        type: rewrite
        path: /api/:splat
      - route: /*
        type: rewrite
        path: /index.html
    envVars:
      - key: REACT_APP_API_URL
        value: https://nxchain-dashboard.onrender.com/api
EOF

echo "✅ Build completed successfully!"
echo "📁 Frontend build: frontend/build/"
echo "🔧 Render config: render.yaml"
echo "🌐 Ready for Render.com deployment!"
