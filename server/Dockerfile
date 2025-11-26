# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build/lint)
RUN npm ci

# Copy application files
COPY . .

# Expose the port
EXPOSE 4242

# Set environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV STATIC_DIR=../client

# Start the application (runs prestart: lint + build, then start)
CMD ["npx", "tsx", "server.ts"]
