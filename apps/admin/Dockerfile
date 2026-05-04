# ─── deps ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json 2>/dev/null || true
COPY apps/web/package.json ./apps/web/package.json
COPY apps/admin/package.json ./apps/admin/package.json
RUN npm ci -w apps/admin --include-workspace-root

# ─── build ────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG VITE_API_URL=http://localhost:4000
ARG VITE_CLIENT_URL=http://localhost:5173
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLIENT_URL=$VITE_CLIENT_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
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
