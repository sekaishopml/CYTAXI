FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/web-central/package.json ./packages/web-central/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/web-central/ ./packages/web-central/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3000

# Start service
CMD ["bun", "run", "--cwd", "packages/web-central", "start"]
