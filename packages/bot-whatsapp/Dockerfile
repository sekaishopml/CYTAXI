FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/bot-whatsapp/package.json ./packages/bot-whatsapp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/bot-whatsapp/ ./packages/bot-whatsapp/

# Build shared package
RUN cd packages/shared && bun run build

# Expose port
EXPOSE 3001

# Start service
CMD ["bun", "run", "--cwd", "packages/bot-whatsapp", "start"]
