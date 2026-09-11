FROM node:26-alpine AS base

RUN npm install --global pnpm@11.8.0

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY scripts/install-hooks.mjs ./scripts/install-hooks.mjs
RUN CI=true pnpm install --frozen-lockfile

# Run migrations explicitly, separately from the application build/start.
FROM deps AS migrator
CMD ["pnpm", "db:migrate"]

FROM base AS builder
WORKDIR /app

ARG SKIP_ENV_VALIDATION=1
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .

RUN pnpm build

FROM node:26-alpine AS runner
WORKDIR /app

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV="production"
ENV PORT="3000"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
