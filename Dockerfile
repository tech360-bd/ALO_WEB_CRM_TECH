# LEGACY / NOT USED FOR CURRENT PRODUCTION — Hostinger only.
# ─── Build stage ────────────────────────────────────────────
FROM node:22-bookworm AS base
WORKDIR /app

# Build tooling only; container production entry is disabled. npm only.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ─── Production stage ───────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3044
ENV HOSTNAME=0.0.0.0

# Run as non-root (SEC-18)
RUN useradd -m -u 1001 nextjs

# Copy standalone build
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Create upload/download dirs with correct ownership
RUN mkdir -p /app/upload /app/download /app/db && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3044

# Apply only reviewed, additive migrations before starting the server.
# Never use `prisma db push` in production because it can change the schema
# outside the migration history.
# Quarantined legacy runtime: Docker is not the approved Hostinger transport.
# Never migrate a database implicitly when starting an image.
CMD ["sh", "-c", "echo 'DISABLED: legacy production container entry; use the approved Hostinger release procedure' >&2; exit 1"]
