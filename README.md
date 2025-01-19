# seeklit

📚Book requesting web application

## Deploy with Docker Compose

First copy the docker-compose.yml file into your local server.

```bash
curl -L -o docker-compose.yml "https://raw.githubusercontent.com/laustindasauce/seeklit/refs/heads/main/docker-compose.yml"
```

Next pull and run the containers

```bash
docker compose pull

docker compose up -d
```

## Updating Containers

```bash
docker compose down

docker compose pull

docker compose up -d
```

## Local Docker Build & Run

Server

```bash
docker build -f Dockerfile.server -t seeklit-server .

docker run --name seeklit-server -p 8416:8416 -e SEEKLIT_CONF_FILE="/config/seeklit.conf" -d seeklit-server
```

Client

```bash
docker build -f Dockerfile.client -t seeklit-client .

docker run --name seeklit-client -p 3014:3000 \
  -e SEEKLIT_API_URL= \
  -e SEEKLIT_ABS_URL= \
  -e SEEKLIT_ADMIN_EMAIL= \
  -d seeklit-client
```
