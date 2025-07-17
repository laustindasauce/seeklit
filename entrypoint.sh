#!/bin/sh
set -e

echo "Starting Seeklit combined container..."

# Check if the SEEKLIT_CONF_FILE exists
if [ ! -f "$SEEKLIT_CONF_FILE" ]; then
    echo "Configuration file not found at $SEEKLIT_CONF_FILE. Copying default.conf to $SEEKLIT_CONF_FILE..."
    mkdir -p "$(dirname "$SEEKLIT_CONF_FILE")"
    cp /app/default.conf "$SEEKLIT_CONF_FILE"
else
    echo "Configuration file found at $SEEKLIT_CONF_FILE."
fi

# Start supervisor to manage both nginx and the Go server
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf