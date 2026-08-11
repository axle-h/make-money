FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat


FROM base AS builder

# Prisma 7 requires a driver adapter. @prisma/adapter-better-sqlite3 pulls in
# better-sqlite3, a native module that node-gyp has to compile from source.
RUN apk add --no-cache python3 make g++

# Install dependencies in a seperate layer
COPY package.json package-lock.json* ./
RUN npm ci

# Build
COPY . .

# Prisma 7 generates the client into ./generated rather than node_modules, and
# no longer does it as part of install, so it has to run before the build.
RUN npx prisma generate

RUN npm run build


FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

VOLUME /data
ENV DATABASE_URL="file:/data/money.db"

ENV APP_ROLE=make-money
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
