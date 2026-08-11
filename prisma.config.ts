import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer loads .env files automatically, and the datasource url
// moved out of schema.prisma into this file.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
