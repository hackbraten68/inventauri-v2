FROM node:20-slim AS base
WORKDIR /app

# Allow build-time configuration for assets that need PUBLIC_* envs
ARG PUBLIC_POCKETBASE_URL=http://localhost:8090

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
ARG PUBLIC_POCKETBASE_URL
ENV PUBLIC_POCKETBASE_URL=${PUBLIC_POCKETBASE_URL}
COPY . .
RUN npm run build

# Production runtime
FROM node:20-slim AS runner
WORKDIR /app
ARG PUBLIC_POCKETBASE_URL=http://localhost:8090
ENV NODE_ENV=production \
    PORT=4321 \
    HOST=0.0.0.0 \
    PUBLIC_POCKETBASE_URL=${PUBLIC_POCKETBASE_URL}

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
