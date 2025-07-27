# Use Node.js 22 LTS as base image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for better performance and security
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S testrail -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage for building
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY nodemon.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Copy any additional runtime files
COPY --from=builder /app/index.html ./
COPY --from=builder /app/index.css ./

# Change ownership to non-root user
RUN chown -R testrail:nodejs /app

# Switch to non-root user
USER testrail

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
