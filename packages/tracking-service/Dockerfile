FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracking-service/package.json ./packages/tracking-service/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/tracking-service/ ./packages/tracking-service/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3007

# Start service
CMD ["bun", "run", "--cwd", "packages/tracking-service", "start"]
