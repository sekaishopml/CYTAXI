FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/geocoder-service/package.json ./packages/geocoder-service/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/geocoder-service/ ./packages/geocoder-service/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3006

# Start service
CMD ["bun", "run", "--cwd", "packages/geocoder-service", "start"]
