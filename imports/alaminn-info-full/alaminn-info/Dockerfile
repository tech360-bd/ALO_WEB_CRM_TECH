# ═══════════════════════════════════════════════════════════════════
#  Alaminn.info — Production Dockerfile (multi-stage)
#  Builds the Next.js standalone output and runs it on Node.js 22.
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1: deps ──────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy lockfile + manifest for reproducible installs.
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional && npm cache clean --force

# ── Stage 2: builder ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (uses schema.prisma — swap to MySQL for prod).
RUN npx prisma generate

# Build Next.js (standalone output).
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: runner (final, minimal image) ────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build + static + public.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

# Create writable dirs for logs/backups.
RUN mkdir -p storage/logs storage/backups storage/temporary storage/exports db/backups && \
    chown -R nextjs:nodejs storage db

USER nextjs

EXPOSE 3000

# Health check — hit the lightweight endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
