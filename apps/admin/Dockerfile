# ─── deps ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/admin/package.json ./apps/admin/package.json
RUN npm ci -w apps/admin --include-workspace-root

# ─── build ────────────────────────────────────────────────────────
# Render: set VITE_API_URL + VITE_CLIENT_URL on the service (build args). docker-compose sets args for local Docker.
# Production admin at https://admin.possibility.es — API must allow that origin in CORS_ORIGINS.
FROM node:20-alpine AS build
ARG VITE_API_URL=
ARG VITE_CLIENT_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLIENT_URL=$VITE_CLIENT_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY apps/admin ./apps/admin
WORKDIR /app/apps/admin
RUN npm run build

# ─── runtime ──────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
