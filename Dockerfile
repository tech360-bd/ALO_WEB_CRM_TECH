# ─── Build stage ────────────────────────────────────────────
FROM node:22-bookworm AS base
WORKDIR /app

# Install dependencies — supports both npm and bun lockfiles (SEC-11 fix)
COPY package.json package-lock.json* bun.lock* ./
RUN if [ -f bun.lock ]; then npm install -g bun && bun install --frozen-lockfile; else npm ci; fi

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
ENV PORT=3000

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

EXPOSE 3000

# Apply only reviewed, additive migrations before starting the server.
# Never use `prisma db push` in production because it can change the schema
# outside the migration history.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
