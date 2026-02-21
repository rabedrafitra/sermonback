import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),                 // ← obligatoire
    // directUrl: env('DIRECT_URL'),          // optionnel (si tu as besoin d'une URL directe pour les migrations)
  },
})