#!/bin/sh
set -e

# Check if the SEEKLIT_CONF_FILE exists
if [ ! -f "$SEEKLIT_CONF_FILE" ]; then
    echo "Configuration file not found at $SEEKLIT_CONF_FILE. Copying default.conf to $SEEKLIT_CONF_FILE..."
    mkdir -p "$(dirname "$SEEKLIT_CONF_FILE")"  # Create directory if it doesn't exist
    cp /app/default.conf "$SEEKLIT_CONF_FILE"
else
    echo "Configuration file found at $SEEKLIT_CONF_FILE."
fi

# Execute the main process
/app/main