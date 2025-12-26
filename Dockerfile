# --- BUILD STAGE ---------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Installer les dépendances système nécessaires pour node-gyp et Medusa
RUN apt-get update \
    && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier uniquement les fichiers package.* pour une installation propre
COPY package*.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm install --legacy-peer-deps

# Copier le reste du projet
COPY . .

# Builder TypeScript → dist/
RUN npm run build

# --- RUNTIME STAGE -------------------------------------------------------
FROM node:22-slim AS runtime

WORKDIR /app

# Copier les dépendances et le code compilé
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# 🔴 IMPORTANT : copier la config Medusa à la racine
COPY --from=builder /app/src/medusa-config.ts ./medusa-config.ts

# Définir les variables d'environnement pour la production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000
EXPOSE 9000

# Démarrage Medusa via le script npm "start"
CMD ["npm", "run", "start"]
