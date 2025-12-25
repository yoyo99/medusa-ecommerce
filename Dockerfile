FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NODE_ENV=production
# Build et compiler
RUN npx tsc --project tsconfig.json || npm run build 2>&1 | grep -v "Unable to compile frontend" || true

FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/src ./src
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000
ENV PG_POOL_SIZE=20
EXPOSE 9000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || \
      curl -f http://localhost:9000/health || exit 1
CMD ["sh", "-c", "npx medusa db:migrate || true && npx medusa db:sync-links || true && npx medusa start"]
