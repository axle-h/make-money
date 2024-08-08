FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app

# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat


FROM base AS builder

# Install dependencies in a seperate layer
COPY package.json package-lock.json* ./
COPY prisma/ .
RUN npm ci

# Build
COPY . .
RUN npm run build


FROM base AS runner

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

VOLUME /data
ENV DATABASE_URL "file:/data/money.db"

ENV APP_ROLE make-money

CMD HOSTNAME="0.0.0.0" node server.js