# Étape 1 : Construction
FROM node:22-alpine AS builder

WORKDIR /app

# Installation de Yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copie des fichiers de dépendances
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Installation des dépendances avec Yarn
RUN yarn install --immutable

# Copie du code source
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 🏗️ BUILD DU BACKEND ET DU DASHBOARD
RUN npx medusa build

# Étape 2 : Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Installation de Yarn dans le runner aussi
RUN corepack enable && corepack prepare yarn@stable --activate

# Copie des node_modules (dépendances)
COPY --from=builder /app/node_modules ./node_modules

# Copie du dossier de build (.medusa/server -> /app)
COPY --from=builder /app/.medusa/server .

# 🚨 CORRECTION CRITIQUE POUR L'ADMIN DASHBOARD
RUN mkdir -p public/admin
COPY --from=builder /app/.medusa/server/public/admin ./public/admin

# Copie des fichiers de configuration
COPY --from=builder /app/medusa-config.ts .

# Port par défaut
EXPOSE 9000

# Commande de démarrage
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
