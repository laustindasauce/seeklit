# seeklit

📚Book requesting web application

## Build & Run [Docker]

Server

```bash
docker build -f Dockerfile.server -t seeklit-server .

docker run --name seeklit-server -p 8416:8416 -e SEEKLIT_CONF_FILE="/config/seeklit.conf" -d seeklit-server
```

Client

```bash
docker build -f Dockerfile.client -t seeklit-client .

docker run --name seeklit-client -p 8416:8416 \
  -e SEEKLIT_API_URL= \
  -e SEEKLIT_ABS_URL= \
  -e SEEKLIT_ADMIN_EMAIL= \
  -d seeklit-client
```
