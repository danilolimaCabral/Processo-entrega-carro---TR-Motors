FROM node:20-slim
RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN echo '#!/bin/sh' > /app/run.sh && echo 'node migrate.js 2>&1 || true' >> /app/run.sh && echo 'echo "=== Starting server ==="' >> /app/run.sh && echo 'exec node dist/index.js' >> /app/run.sh && chmod +x /app/run.sh
EXPOSE 8080
ENTRYPOINT ["/app/run.sh"]
