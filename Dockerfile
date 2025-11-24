FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
COPY . .
RUN npm run build

# Production runtime
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4321 \
    HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
