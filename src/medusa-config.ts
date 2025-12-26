import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL, // Pour Redis (cache / event-bus / workflows)

    databaseDriverOptions: {
      connection: { ssl: false }, // Désactive SSL pour PostgreSQL (à ajuster si besoin)
    },

    // ⚠️ Important : ce bloc "http" DOIT respecter le type Medusa,
    // donc pas de "host" ni de "port" ici, seulement les propriétés supportées.
    http: {
      storeCors:
        process.env.STORE_CORS ||
        "http://localhost:8000",
      adminCors:
        process.env.ADMIN_CORS ||
        "http://localhost:7000,http://localhost:7001",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:7000,http://localhost:7001",

      jwtSecret:
        process.env.JWT_SECRET ||
        "QCYsV3EiJ47ZIHB9gS/MSgaNiINc5UPfT/sgKVmxOaI=",
      cookieSecret:
        process.env.COOKIE_SECRET ||
        "Ohg55d5ZSoJ8LdJv4kKNFBCTANq1hA75BBV0rJcSpuw=",
      // pas de "host" / "port" ici → gérés via les variables d'env dans Docker
    },

    workerMode:
      (process.env.MEDUSA_WORKER_MODE as
        | "shared"
        | "worker"
        | "server") || "shared",
  },

  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl:
      process.env.MEDUSA_BACKEND_URL ||
      "https://medusa.jobnexai.com",
    path: "/app",
  },

  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
})
