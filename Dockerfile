FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY server/ ./

# Expose port
EXPOSE 3200

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3200/api/health || exit 1

# Start
CMD ["node", "src/app.js"]
