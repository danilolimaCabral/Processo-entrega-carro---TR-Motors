FROM node:20-slim
RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN ls -la dist/index.js
EXPOSE 8080
CMD ["sh", "-c", "node migrate.js 2>&1; echo '=== Starting server ==='; node dist/index.js 2>&1; echo '=== Server exited with code: '$?' ==="]
