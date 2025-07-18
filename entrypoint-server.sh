#!/bin/sh
set -e

echo "Starting Seeklit server container..."

# Handle PUID and PGID
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Setting up user with PUID=$PUID and PGID=$PGID"

# Update the seeklit group and user with the provided PUID/PGID
if [ "$PGID" != "1000" ]; then
    echo "Updating group ID to $PGID"
    groupmod -g "$PGID" seeklit
fi

if [ "$PUID" != "1000" ]; then
    echo "Updating user ID to $PUID"
    usermod -u "$PUID" seeklit
fi

# Ensure proper ownership of directories
chown -R seeklit:seeklit /data /config /app /home/seeklit

# Handle timezone configuration
TZ=${TZ:-America/New_York}
echo "Setting timezone to $TZ"
if [ -f "/usr/share/zoneinfo/$TZ" ]; then
    ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime
    echo "$TZ" > /etc/timezone
    echo "Timezone set to $TZ"
else
    echo "Warning: Timezone $TZ not found, using default"
fi

# Log environment variables
echo "Environment variables:"
echo "TZ=$TZ"
echo "PUID=$PUID"
echo "PGID=$PGID"
echo "SEEKLIT_CONF_FILE=$SEEKLIT_CONF_FILE"
echo "SEEKLIT_ABS_URL=$SEEKLIT_ABS_URL"
echo "SEEKLIT_ABS_EXTERNAL_URL=$SEEKLIT_ABS_EXTERNAL_URL"
echo "SEEKLIT_ADMIN_EMAIL=$SEEKLIT_ADMIN_EMAIL"

# Check if the SEEKLIT_CONF_FILE exists
if [ ! -f "$SEEKLIT_CONF_FILE" ]; then
    echo "Configuration file not found at $SEEKLIT_CONF_FILE. Copying default.conf to $SEEKLIT_CONF_FILE..."
    mkdir -p "$(dirname "$SEEKLIT_CONF_FILE")"
    cp /app/default.conf "$SEEKLIT_CONF_FILE"
else
    echo "Configuration file found at $SEEKLIT_CONF_FILE."
fi

# Function to handle shutdown
cleanup() {
    echo "Shutting down Go server..."
    kill $GO_PID 2>/dev/null || true
    wait
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Go server
echo "Starting Go server..."
exec su-exec seeklit /app/main