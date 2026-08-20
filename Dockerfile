# syntax=docker/dockerfile:1

# Build stage
FROM node:26.7.0-alpine AS builder

# Install pnpm
RUN npm install --global pnpm@11.22.0

WORKDIR /app

# Copy package files and pnpm build policy
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:26.7.0-alpine

# Install pnpm
RUN npm install --global pnpm@11.22.0

WORKDIR /app

# Copy package files and pnpm build policy
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -u 1001 -S mcpuser -G mcpuser && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

# Set environment variables
ENV NODE_ENV=production

# Run the application
ENTRYPOINT ["node", "dist/index.js"]
