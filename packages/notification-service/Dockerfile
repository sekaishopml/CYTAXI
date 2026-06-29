FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/notification-service/package.json ./packages/notification-service/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/notification-service/ ./packages/notification-service/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3005

# Start service
CMD ["bun", "run", "--cwd", "packages/notification-service", "start"]
