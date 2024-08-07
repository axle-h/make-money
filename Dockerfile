FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app

# Install dependencies only when needed
FROM base AS builder

# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN  npm run prisma -- generate && npm run build

# Production image, copy all the files and run next
FROM base AS runner

ENV NODE_ENV production

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

VOLUME /data
ENV DATABASE_URL "file:/data/money.db"

ENV APP_ROLE make-money


# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js