# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm ci

# Copy sources and compile
COPY . .
RUN npm run build -- --configuration=production

# 2. Run Stage
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
