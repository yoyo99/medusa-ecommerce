# --- BUILD STAGE ---------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Dépendances nécessaires pour node-gyp (certains packages Medusa les utilisent)
RUN apt-get update \
    && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers package.* pour installation propre
COPY package*.json ./

# Installer toutes les dépendances (prod + dev) pour compiler TS
RUN npm install --legacy-peer-deps

# Copie du reste du projet
COPY . .

# Build TypeScript → dist/
RUN npm run build


# --- RUNTIME STAGE -------------------------------------------------------
FROM node:22-slim AS runtime

WORKDIR /app

# Copie uniquement ce qui est nécessaire à l'exécution
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist/medusa-config.js ./medusa-config.js

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000
EXPOSE 9000

# Healthcheck Medusa V2
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/app/health || exit 1

# Démarrage Medusa compilée
CMD ["node", "dist/main.js"]
