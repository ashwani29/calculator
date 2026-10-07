# Build the Go API.
FROM golang:1.27-alpine AS backend-build
WORKDIR /src/backend
COPY backend/go.mod ./go.mod
COPY backend/cmd ./cmd
COPY backend/internal ./internal
COPY backend/tests ./tests
RUN mkdir -p /out && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/calculator ./cmd/server

# Minimal runtime image for the Go API.
FROM gcr.io/distroless/static-debian12:nonroot AS backend
COPY --from=backend-build /out/calculator /calculator
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/calculator"]

# Build the React frontend.
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src
COPY scripts ./scripts
RUN npm run build

# Nginx serves the static app and proxies API calls to the Go container.
FROM nginx:stable-alpine AS frontend
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80
