# ─── deps stage ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci -w apps/web --include-workspace-root

# ─── build stage ────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN npm run build

# ─── runtime stage (nginx) ──────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
