# make-money

## Getting Started

This project uses [pnpm](https://pnpm.io). The version is pinned by the
`packageManager` field in `package.json`, so `corepack enable` is enough to get
the right one.

Install dependencies and generate the Prisma client:

```bash
pnpm install
pnpm exec prisma generate
```

Prisma 7 generates into `./generated` rather than `node_modules`, and no longer
does it on install, so that second step is required before the first build.

Then run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database migrations

```bash
pnpm migrate:dev
```

## A note on pnpm build scripts

pnpm does not run dependency build scripts unless they are listed under
`allowBuilds` in `pnpm-workspace.yaml`. `better-sqlite3` is a native module that
has to compile, so removing it from that list produces an install that succeeds
and an app that fails at runtime.
