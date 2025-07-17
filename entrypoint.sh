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

# Replace baked environment variables in static files
# Since we're using nginx to serve static files, we need to replace the variables in the build
if [ ! -z "$SEEKLIT_ABS_URL" ] || [ ! -z "$SEEKLIT_ADMIN_EMAIL" ]; then
    echo "Replacing environment variables in static files..."
    
    # Find all JS files in the nginx html directory
    find /usr/share/nginx/html -type f -name "*.js" | while read file; do
        # Replace the baked variables with actual values
        if [ ! -z "$SEEKLIT_ABS_URL" ]; then
            sed -i "s|BAKED_SEEKLIT_ABS_URL|$SEEKLIT_ABS_URL|g" "$file"
        fi
        if [ ! -z "$SEEKLIT_ADMIN_EMAIL" ]; then
            sed -i "s|BAKED_SEEKLIT_ADMIN_EMAIL|$SEEKLIT_ADMIN_EMAIL|g" "$file"
        fi
        # No need to replace API URL since we're using relative paths now
    done
fi

# Start supervisor to manage both nginx and the Go server
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf