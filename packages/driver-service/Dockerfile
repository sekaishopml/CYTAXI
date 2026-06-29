FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/driver-service/package.json ./packages/driver-service/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/driver-service/ ./packages/driver-service/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3003

# Start service
CMD ["bun", "run", "--cwd", "packages/driver-service", "start"]
