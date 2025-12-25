# --- Build stage ---------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build Medusa v2 (utilise ton script package.json)
RUN npm run build

# --- Runtime stage -------------------------------------------------------
FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/medusajs-config.ts ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000
EXPOSE 9000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || \
      curl -f http://localhost:9000/health || exit 1

CMD ["node", "dist/main.js"]
