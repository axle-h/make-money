FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

# pnpm ships via corepack, pinned by the packageManager field in package.json.
# The prompt would block a non-interactive build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable


FROM base AS builder

# Prisma 7 requires a driver adapter. @prisma/adapter-better-sqlite3 pulls in
# better-sqlite3, a native module that node-gyp has to compile from source.
RUN apk add --no-cache python3 make g++

# Install dependencies in a seperate layer.
#
# pnpm-workspace.yaml has to land before the install, not with the rest of the
# source: it carries the allowBuilds list, and pnpm silently skips dependency
# build scripts without it. Miss it and better-sqlite3 never compiles, the
# install still succeeds, and the container only fails once it serves a request.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .

# Prisma 7 generates the client into ./generated rather than node_modules, and
# no longer does it as part of install, so it has to run before the build.
RUN pnpm exec prisma generate

RUN pnpm run build


FROM base AS runner

ENV NODE_ENV=production

# next build --standalone traces the real files out of pnpm's symlinked store,
# so this tree is self-contained and needs no install in the runner.
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
