.PHONY: all dev-setup dev-start dev-stop

all: setup-data-dir setup-conf-dir install-packages install-client install-server

# Setup directories
setup-data-dir:
	@echo "Creating data directory and downloads directory..."
	@echo "Directories already created in container build..."

setup-conf-dir:
	@echo "Creating config directory..."
	@echo "Config directory already created in container build..."
	@echo "Creating dev.conf from default.conf..."
	cp -n server/default.conf server/dev.conf || true

install-packages:
	@echo "Dev packages already installed in container..."

install-client:
	@echo "Installing pnpm packages in the client folder..."
	cd client && pnpm install
	@echo 'VITE_API_URL="http://localhost:8416"' > client/.env
	@echo 'SEEKLIT_ABS_URL=""' >> client/.env
	@echo 'VITE_ABS_URL=""' >> client/.env
	@echo 'VITE_ADMIN_EMAIL="dev@gmail.com"' >> client/.env

install-server:
	@echo "Installing all server dependencies"
	cd server && GOPROXY=direct go mod tidy
	@echo "Setting up dev environment file"
	@echo 'SEEKLIT_CONF_FILE="dev.conf"' > server/.env
	@echo 'SEEKLIT_VERSION="develop"' >> server/.env

# Development setup for combined nginx approach
dev-setup: setup-data-dir setup-conf-dir install-client install-server
	@echo "Setting up combined development environment..."
	@echo "Creating nginx configuration for development..."
	sudo cp nginx.conf /etc/nginx/nginx.conf
	sudo sed -i 's|root /usr/share/nginx/html;|proxy_pass http://localhost:3000;|g' /etc/nginx/nginx.conf
	sudo sed -i 's|try_files.*|proxy_http_version 1.1;\n            proxy_set_header Upgrade $$http_upgrade;\n            proxy_set_header Connection "upgrade";\n            proxy_set_header Host $$host;\n            proxy_cache_bypass $$http_upgrade;|g' /etc/nginx/nginx.conf
	@echo "Setup complete. Run 'make dev-start' to start the development environment."

# Start the development environment using supervisord (like production)
dev-start:
	@echo "Starting development services with supervisord..."
	sudo cp supervisord.conf /etc/supervisor/conf.d/supervisord.conf
	sudo sed -i 's|command=/app/main|command=sh -c "cd $(PWD)/server && bee run -gendoc=true -downdoc=true"|g' /etc/supervisor/conf.d/supervisord.conf
	sudo sed -i '/\[program:seeklit-server\]/a [program:client]\ncommand=sh -c "cd $(PWD)/client && pnpm dev"\ndirectory=$(PWD)/client\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\nautorestart=true\nstartretries=3' /etc/supervisor/conf.d/supervisord.conf
	sudo supervisord -c /etc/supervisor/conf.d/supervisord.conf

# Stop the development environment
dev-stop:
	@echo "Stopping development services..."
	sudo supervisorctl stop all || true
	sudo pkill supervisord || true