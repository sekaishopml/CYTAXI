FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/matching-engine/package.json ./packages/matching-engine/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/matching-engine/ ./packages/matching-engine/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3004

# Start service
CMD ["bun", "run", "--cwd", "packages/matching-engine", "start"]
