FROM node:20-bullseye-slim AS client-build

RUN npm install -g pnpm

# Build the client
WORKDIR /app/client
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install

COPY client/ ./
RUN pnpm run build

# Build the Go server
FROM golang:1.23-alpine3.21 AS server-build

WORKDIR /app/server

COPY server/go.mod server/go.sum ./
RUN go mod download && go mod verify

COPY server/ .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage with nginx
FROM nginx:alpine

# Install supervisor to manage multiple processes
RUN apk add --no-cache supervisor

# Set environment variables
ARG VERSION
ENV SEEKLIT_VERSION=${VERSION}
ENV SEEKLIT_CONF_FILE="/config/seeklit.conf"
ENV TZ=America/New_York

RUN apk add --no-cache tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# Create necessary directories
RUN mkdir -p /data /config /app /var/log/supervisor

# Copy the Go server binary and config
COPY --from=server-build /app/main /app/
COPY --from=server-build /app/default.conf /app/
COPY --from=server-build /app/conf/ /app/conf/

# Copy the client build
COPY --from=client-build /app/client/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]