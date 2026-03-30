# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.10-alpine AS build

WORKDIR /workspace

COPY package.json bun.lock tsconfig.json ./
COPY apps/dapp/package.json apps/dapp/package.json
COPY apps/oracle/package.json apps/oracle/package.json
COPY packages/frontier-client/package.json packages/frontier-client/package.json

RUN bun install --frozen-lockfile --production

COPY apps/oracle apps/oracle
COPY packages/frontier-client packages/frontier-client

RUN bun build apps/oracle/src/main.ts \
  --target bun \
  --minify \
  --outfile /tmp/oracle.js

FROM oven/bun:1.3.10-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    ORACLE_DB_PATH=/data/oracle.db

COPY --from=build /tmp/oracle.js /app/oracle.js

RUN mkdir -p /data && chown -R bun:bun /app /data

USER bun

VOLUME ["/data"]

EXPOSE 4318

CMD ["bun", "/app/oracle.js"]
