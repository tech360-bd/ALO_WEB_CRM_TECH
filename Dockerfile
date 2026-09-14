# ─── Build stage ────────────────────────────────────────────
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js
RUN bun run build

# ─── Production stage ───────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone build
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Create upload/download dirs
RUN mkdir -p /app/upload /app/download /app/db

EXPOSE 3000

# Apply only reviewed, additive migrations before starting the server.
# Never use `prisma db push` in production because it can change the schema
# outside the migration history.
CMD ["sh", "-c", "bunx prisma migrate deploy && node server.js"]
