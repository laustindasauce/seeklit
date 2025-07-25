# seeklit

📚 Book requesting web application

## Production Deployment

Seeklit uses a multi-container architecture with separate containers for the client, server, and nginx proxy, providing better isolation and scalability.

#### Quick Start with Docker Compose

First copy the docker-compose.yml file to your server:

```bash
curl -L -o docker-compose.yml "https://raw.githubusercontent.com/laustindasauce/seeklit/refs/heads/main/docker-compose.example.yml"
```

Build and run the containers:

```bash
docker compose up -d --build
```

#### Manual Build

```bash
# Build both containers
make build-all

# Or build individually
make build-server
make build-client

# Start with docker-compose
make up-separate
```

### Environment Variables

Configure your deployment with these environment variables:

| Variable                   | Description                     | Default                    | Required |
| -------------------------- | ------------------------------- | -------------------------- | -------- |
| `SEEKLIT_ABS_URL`          | Internal AudioBookshelf API URL | http://audiobookshelf:80   | No       |
| `SEEKLIT_ABS_EXTERNAL_URL` | External AudioBookshelf URL     | http://localhost:13378     | No       |
| `SEEKLIT_ADMIN_EMAIL`      | Admin contact email             | -                          | No       |
| `SEEKLIT_SERVER_URL`       | Internal Server URL             | http://seeklit-server:8416 | No       |
| `SEEKLIT_DISABLE_ISSUES`   | Disable the issues feature      | `false`                    | No       |
| `SEEKLIT_CONF_FILE`        | Configuration file path         | `/config/seeklit.conf`     | No       |
| `TZ`                       | Timezone                        | `America/New_York`         | No       |
| `PUID`                     | User ID for file permissions    | `1000`                     | No       |
| `PGID`                     | Group ID for file permissions   | `1000`                     | No       |

### Configuration

Seeklit uses a configuration file system for server settings. The configuration file is located at the path specified by `SEEKLIT_CONF_FILE` (default: `/config/seeklit.conf`).

### Updating Containers

```bash
docker compose down
docker compose pull
docker compose up -d
```

## Development

### Local Development Setup

For local development without Docker, use the Makefile to set up the environment:

```bash
# Install dependencies and configure environment
make dev-setup

# Start all services (client, server, and nginx)
./run_dev.sh
```

This will:

- Install client dependencies with pnpm
- Set up Go server dependencies
- Create development environment files
- Generate a development nginx configuration that uses `localhost` instead of container names
- Create a `run_dev.sh` script to start all services

### Cleaning Up

```bash
# Remove generated development files and Docker resources
make clean
```

For more detailed development information, see the individual README files in the `client/` and `server/` directories.

## Architecture

- **Frontend**: React/Remix application (client container)
- **Backend**: Go server with Beego framework (server container)
- **Proxy**: Nginx reverse proxy handling routing between client and server
- **Database**: SQLite
- **Deployment**: Multi-container architecture with separate containers for better scalability

### Request Flow

1. **Browser requests** → nginx:80 → client container:3000 (for static files and pages)
2. **API requests** → nginx:80/api → server container:8416 (for backend API calls)
