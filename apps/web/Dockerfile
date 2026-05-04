# ─── deps stage ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci -w apps/web --include-workspace-root

# ─── build stage ────────────────────────────────────────────────────
FROM node:20-alpine AS build
# No localhost default — Render must set VITE_API_URL or the browser will call the wrong host. docker-compose passes a build arg for local stacks.
ARG VITE_API_URL=
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
