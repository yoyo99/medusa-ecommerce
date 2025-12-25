import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,  // ✅ Ajouté pour éviter les warnings
    databaseDriverOptions: {
      connection: { ssl: false },  // ✅ Désactive SSL pour PostgreSQL
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "QCYsV3EiJ47ZIHB9gS/MSgaNiINc5UPfT/sgKVmxOaI=",
      cookieSecret: process.env.COOKIE_SECRET || "Ohg55d5ZSoJ8LdJv4kKNFBCTANq1hA75BBV0rJcSpuw=",
      host: process.env.HOST || "0.0.0.0",  // ✅ Force l'écoute publique
      port: process.env.PORT ? parseInt(process.env.PORT) : 9000,  // ✅ Port explicite
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://medusa.jobnexai.com",
    path: "/app",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { url: process.env.REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: { apiKey: process.env.STRIPE_API_KEY },
          },
        ],
      },
    },
  ],
})
