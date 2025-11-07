FROM oven/bun:1.3.0-alpine AS builder
ARG DOCKER_BUILD="1"
WORKDIR /app

# Ensure postinstall detects Docker build and skips non-Docker steps
ENV DOCKER_BUILD=$DOCKER_BUILD

COPY package.json bun.lock* ./
COPY . . 

# Install dependencies without running postinstall, then run it with bun
RUN bun install --frozen-lockfile --ignore-scripts && bun run scripts/postinstall.ts

# Makes the next output standalone
# https://github.com/vercel/next.js/discussions/65511
ENV NEXT_STANDALONE_OUTPUT="true"

RUN bun run build

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations content
COPY --from=builder /app/src/lib/db/migrations ./src/lib/db/migrations

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["node", "server.js"]