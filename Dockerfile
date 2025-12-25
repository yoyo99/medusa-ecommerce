# --- BUILD STAGE ---------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Dependencies nécessaires pour node-gyp (quelques modules Medusa en ont besoin)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copie des fichiers package.* pour installation propre
COPY package*.json ./

# On installe TOUTES les deps (prod + dev) pour pouvoir build en TypeScript
RUN npm install --legacy-peer-deps

# Copie du reste du projet
COPY . .

# Build Medusa (génère dist/)
RUN npm run build


# --- RUNTIME STAGE -------------------------------------------------------
FROM node:22-slim AS runtime

WORKDIR /app

# Copy uniquement le strict nécessaire dans l'image finale
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/medusa-config.ts ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000
EXPOSE 9000

# Healthcheck compatible Medusa v2 (endpoint disponibles)
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/app/health || exit 1

# Démarrage Medusa V2 compilé
CMD ["node", "dist/main.js"]
