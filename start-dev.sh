#!/bin/bash
echo "🔧 Freeing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1
echo "🚀 Starting ALO Education Dev Server..."
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
