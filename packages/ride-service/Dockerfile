FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/ride-service/package.json ./packages/ride-service/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/ride-service/ ./packages/ride-service/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3002

# Start service
CMD ["bun", "run", "--cwd", "packages/ride-service", "start"]
