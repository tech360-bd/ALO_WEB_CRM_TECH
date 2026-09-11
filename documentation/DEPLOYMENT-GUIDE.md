# ALO Education — Deployment Guide

## Prerequisites
- Node.js 22.x or Bun 1.x
- PostgreSQL 16+ (production) or SQLite (development)
- Domain with HTTPS configured

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random 32+ char string
- `NEXTAUTH_URL` — Your domain URL
- `WHATSAPP_BUSINESS_TOKEN` — WhatsApp Business API token
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` — Email config

## Production Build
```bash
bun install
bun run db:push
bun run db:seed
bun run build
bun run start
```

## Docker Deployment
```bash
docker-compose up -d --build
```

## cPanel Deployment
1. Upload `ALO_EDUCATION_PRODUCTION_DEPLOYMENT.zip`
2. Extract to your application root
3. Configure `.env` via cPanel File Manager
4. Run `bun run db:push` via SSH
5. Start the server via PM2 or Node app manager

## Health Check
```bash
curl https://yourdomain.com/api/stats
```

## Backup
```bash
pg_dump --no-tablespaces -U alo_user alo_education > backup.sql
```
