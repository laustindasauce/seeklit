.PHONY: all

all: setup-data-dir setup-conf-dir install-packages install-client install-server create-dev-script

setup-data-dir:
	@echo "Creating data directory and downloads directory..."
	sudo mkdir -p /data && sudo mkdir -p /data/downloads
	sudo chown -R $(USER):$(USER) /data

setup-conf-dir:
	@echo "Creating config directory..."
	cp server/default.conf server/dev.conf
	sudo mkdir -p /config
	sudo chown -R $(USER):$(USER) /config

install-packages:
	@echo "Installing dev helper packages..."
	sudo apt-get update
	sudo apt-get install -y \
		sqlite3

install-client:
	@echo "Installing pnpm packages in the client folder..."
	cd client && pnpm install

install-server:
	@echo "Installing all server dependencies"
	cd server && go mod tidy
	@echo "Setting up dev environment file"
	@echo 'SEEKLIT_CONF_FILE="dev.conf"' > server/.env
	@echo 'SEEKLIT_VERSION="develop"' >> server/.env
	@echo "Installing beego v2 module"
	cd /go && go install github.com/beego/bee/v2@latest

create-dev-script:
	@echo "Creating run_dev.sh script..."
	@echo '#!/bin/sh' > run_dev.sh
	@echo '(cd client && pnpm dev) &' >> run_dev.sh
	@echo '(cd server && bee run -gendoc=true -downdoc=true)' >> run_dev.sh
	@chmod +x run_dev.sh
	@echo "run_dev.sh script created successfully."