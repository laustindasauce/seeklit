.PHONY: all dev-setup dev-stop

all: setup-data-dir setup-conf-dir install-packages install-client install-server

# Define default development URLs for Nginx
SEEKLIT_PROXY_CLIENT_URL ?= http://localhost:3000
SEEKLIT_PROXY_SERVER_URL ?= http://localhost:8416

# Setup directories
setup-data-dir:
	@echo "Creating data directory and downloads directory..."
	@echo "Directories already created in container build..."

setup-conf-dir:
	@echo "Creating config directory..."
	@echo "Config directory already created in container build..."
	@echo "Creating dev.conf from default.conf..."
	cp -n server/default.conf server/dev.conf || true
	@echo "Updating dev.conf with development log levels..."
	sed -i 's/level=6/level=7/' server/dev.conf
	sed -i 's/loglevel=warn/loglevel=info/' server/dev.conf

install-packages:
	@echo "Dev packages already installed in container..."

install-client:
	@echo "Installing pnpm packages in the client folder..."
	pnpm config set store-dir /home/vscode/.local/share/pnpm/store
	cd client && pnpm install
	@echo 'SEEKLIT_ABS_URL="http://audiobookshelf:80"' >> client/.env
	@echo 'SEEKLIT_ABS_EXTERNAL_URL="http://localhost:13378"' >> client/.env
	@echo 'VITE_ABS_URL="http://audiobookshelf:80"' >> client/.env
	@echo 'VITE_ABS_EXTERNAL_URL="http://localhost:13378"' >> client/.env
	@echo 'VITE_ADMIN_EMAIL="dev@example.com"' >> client/.env
	@echo 'VITE_SEEKLIT_VERSION="dev"' >> client/.env
	@echo 'VITE_DISABLE_ISSUES="false"' >> client/.env

install-server:
	@echo "Installing all server dependencies"
	cd server && GOPROXY=direct go mod tidy
	@echo "Setting up dev environment file"
	@echo 'SEEKLIT_CONF_FILE="dev.conf"' > server/.env
	@echo 'SEEKLIT_VERSION="develop"' >> server/.env
	@echo 'SEEKLIT_ABS_EXTERNAL_URL="http://localhost:13378"' >> server/.env

create-dev-script:
	@echo "Creating run_dev.sh script..."
	@echo '#!/bin/sh' > run_dev.sh
	@echo '(cd client && NODE_ENV=development VITE_USER_NODE_OPTIONS="--openssl-legacy-provider" pnpm dev) &' >> run_dev.sh
	@echo '(sudo nginx -g "daemon off;") &' >> run_dev.sh
	@echo '(cd server && bee run -gendoc=true -downdoc=true)' >> run_dev.sh
	@chmod +x run_dev.sh
	@echo "run_dev.sh script created successfully."

copy-nginx-config:
	@echo "Creating development nginx configuration from template..."
	@SEEKLIT_PROXY_CLIENT_URL="$(SEEKLIT_PROXY_CLIENT_URL)" \
	 SEEKLIT_PROXY_SERVER_URL="$(SEEKLIT_PROXY_SERVER_URL)" \
	 envsubst '$$SEEKLIT_PROXY_CLIENT_URL,$$SEEKLIT_PROXY_SERVER_URL' < nginx.conf.template > nginx.dev.conf
	@echo "Copying development nginx configuration..."
	sudo cp nginx.dev.conf /etc/nginx/nginx.conf
	@echo "Development nginx configuration copied successfully."

# Development setup for combined nginx approach
dev-setup: setup-data-dir setup-conf-dir install-client install-server copy-nginx-config create-dev-script
	@echo "Setting up combined development environment..."
	@echo "Setup complete. Run './run_dev.sh' to start the development environment."

# Docker targets for separate containers
build-server:
	@echo "Building server container..."
	docker build -f Dockerfile.server -t seeklit-server:latest .

build-client:
	@echo "Building client container..."
	docker build -f Dockerfile.client -t seeklit-client:latest .

build-combined:
	@echo "Building combined container..."
	docker build -f Dockerfile -t seeklit:latest .

build-all: build-server build-client
	@echo "All containers built successfully."

# Docker Compose targets
up-separate:
	@echo "Starting separate containers with docker-compose..."
	docker-compose up -d

up-combined:
	@echo "Starting combined container..."
	docker run -d --name seeklit \
		-p 80:80 \
		-v ./data:/config \
		-v ./data:/data \
		-e SEEKLIT_CONF_FILE=/config/seeklit.conf \
		-e SEEKLIT_ABS_URL=http://audiobookshelf:80 \
		-e SEEKLIT_ABS_EXTERNAL_URL=http://localhost:13378 \
		-e SEEKLIT_ADMIN_EMAIL=admin@example.com \
		seeklit:latest

down:
	@echo "Stopping containers..."
	docker-compose down || docker stop seeklit || true
	docker rm seeklit || true

logs-separate:
	@echo "Showing logs for separate containers..."
	docker-compose logs -f

logs-combined:
	@echo "Showing logs for combined container..."
	docker logs -f seeklit

clean:
	@echo "Cleaning up containers and images..."
	docker-compose down --rmi all --volumes --remove-orphans || true
	docker rmi seeklit:latest seeklit-server:latest seeklit-client:latest || true
	@echo "Cleaning up development files..."
	rm -f nginx.dev.conf run_dev.sh || true
