FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS install
COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile
COPY apps/api/src ./src
COPY apps/api/drizzle ./drizzle
COPY apps/api/drizzle.config.ts ./

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/package.json ./

ENV PORT=8080
EXPOSE 8080
CMD ["bun", "src/index.ts"]
