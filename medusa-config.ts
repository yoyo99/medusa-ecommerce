import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    redisUrl: process.env.REDIS_URL,
  },

  admin: {
    // ne pas servir si désactivé via env
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    // URL publique de ton backend (pour les appels API depuis l'admin)
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://medusa.jobnexai.com",
    // chemin où l'admin sera servie
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
    // Configuration SMTP pour les emails
    {
      resolve: "medusa-plugin-smtp",
      options: {
        fromEmail: process.env.SMTP_FROM || "noreply@jobnexai.com",
        transport: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        },
        // Templates email optionnels
        templates: {
          user_password_reset: {
            subject: "Réinitialisation de votre mot de passe",
          },
          invite: {
            subject: "Invitation à rejoindre l'administration",
          },
        },
      },
    },
  ],
})
