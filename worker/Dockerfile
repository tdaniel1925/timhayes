# AudiaPro Worker Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install -D typescript tsx @types/node && \
    npx tsc && \
    npm uninstall -D typescript tsx @types/node

# Remove source files, keep only compiled JS
RUN rm -rf src tsconfig.json

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Run the worker
CMD ["node", "dist/index.js"]
