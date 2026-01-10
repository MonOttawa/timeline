# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Build-time env vars for Vite
ARG VITE_POCKETBASE_URL
ARG VITE_APP_URL
ARG VITE_DATA_PROVIDER=pocketbase
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_DATA_PROVIDER=$VITE_DATA_PROVIDER

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
