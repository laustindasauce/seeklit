FROM mcr.microsoft.com/devcontainers/go:1.23-bookworm

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && apt-get install -y \
    nodejs \
    nginx \
    supervisor \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Fix Go module cache permissions
RUN chown -R vscode:vscode /go

# Install Beego CLI for development as vscode user
USER vscode
RUN go install github.com/beego/bee/v2@latest
USER root

# Create necessary directories
RUN mkdir -p /data /config /var/log/supervisor

# Give vscode user sudo access for nginx operations
RUN echo "vscode ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/supervisord, /usr/bin/supervisorctl, /bin/mkdir, /bin/chown, /bin/cp, /usr/bin/sed" >> /etc/sudoers

# Set proper ownership for directories
RUN chown -R vscode:vscode /data /config

WORKDIR /workspaces/seeklit