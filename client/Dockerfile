# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
ARG VITE_API_URL
ARG VITE_SOCKET_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env
RUN echo "VITE_SOCKET_URL=$VITE_SOCKET_URL" >> .env
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build artifacts to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if it exists, otherwise use default
# Note: client/nginx.conf was identified earlier
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
