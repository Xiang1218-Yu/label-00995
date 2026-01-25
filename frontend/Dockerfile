# 使用多阶段构建，支持 ARM64 和 AMD64 架构
# Stage 1: 构建阶段
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建工具
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm ci 以获得更快的、可靠的、可重复的构建）
RUN npm ci --legacy-peer-deps

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# Stage 2: 生产阶段
FROM --platform=$TARGETPLATFORM nginx:alpine

# 设置标签信息
LABEL maintainer="Finance Management System"
LABEL description="科技园智慧财务一体化管理系统前端"

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建 nginx 配置文件，支持 SPA 路由
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
