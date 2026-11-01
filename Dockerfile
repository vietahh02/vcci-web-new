# syntax=docker/dockerfile:1
# VCCI web-new (Vite SPA). Build: docker build --build-arg VITE_API_BASE_URL=https://api.example -t vcci-web-new .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* được nhúng vào bundle lúc build, không đặt secret ở đây
ARG VITE_API_BASE_URL=http://localhost:8094
ARG VITE_USE_MOCK=false
# Chat hỗ trợ (REST + Socket.IO của vcci-livestream-chat); để trống = widget báo chưa cấu hình
ARG VITE_CHAT_URL=
ARG VITE_CHAT_SOCKET_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_USE_MOCK=$VITE_USE_MOCK VITE_CHAT_URL=$VITE_CHAT_URL VITE_CHAT_SOCKET_URL=$VITE_CHAT_SOCKET_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
