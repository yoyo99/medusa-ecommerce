# Étape 1 : Construction
FROM node:22-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production
# Désactive la télémétrie Next.js/Medusa pour le build
ENV NEXT_TELEMETRY_DISABLED=1

# 🏗️ BUILD DU BACKEND ET DU DASHBOARD
# Cette commande génère tout dans .medusa/server
RUN npx medusa build

# Étape 2 : Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copie des node_modules (dépendances)
COPY --from=builder /app/node_modules ./node_modules

# Copie du dossier de build (.medusa/server -> /app)
# Medusa v2 exécute le code depuis ce dossier
COPY --from=builder /app/.medusa/server .

# 🚨 CORRECTION CRITIQUE POUR L'ADMIN DASHBOARD
# On s'assure que le dossier public/admin existe bien là où le serveur le cherche
RUN mkdir -p public/admin
COPY --from=builder /app/.medusa/server/public/admin ./public/admin

# Copie des fichiers de configuration essentiels (au cas où)
COPY --from=builder /app/medusa-config.ts .

# Port par défaut
EXPOSE 9000

# Commande de démarrage
# On lance les migrations + le serveur
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
