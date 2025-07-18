#!/bin/sh
set -e

echo "Starting Seeklit client container..."

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
# Create pnpm directories for seeklit user
mkdir -p /home/seeklit/.local/share/pnpm /home/seeklit/.config/pnpm /home/seeklit/.cache/pnpm
chown -R seeklit:seeklit /home/seeklit/.local /home/seeklit/.config /home/seeklit/.cache

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
echo "SEEKLIT_ABS_URL=$SEEKLIT_ABS_URL"
echo "SEEKLIT_ABS_EXTERNAL_URL=$SEEKLIT_ABS_EXTERNAL_URL"
echo "SEEKLIT_ADMIN_EMAIL=$SEEKLIT_ADMIN_EMAIL"
echo "SEEKLIT_PROXY_URL=$SEEKLIT_PROXY_URL"

# Replace baked environment variables in built Remix files
if [ ! -z "$SEEKLIT_ABS_URL" ] || [ ! -z "$SEEKLIT_ABS_EXTERNAL_URL" ] || [ ! -z "$SEEKLIT_ADMIN_EMAIL" ]; then
    echo "Replacing environment variables in built Remix files..."
    
    # Find all JS files in the client build directory
    find /app/client/build -type f -name "*.js" | while read file; do
        # Replace the baked variables with actual values
        if [ ! -z "$SEEKLIT_ABS_URL" ]; then
            sed -i "s|BAKED_SEEKLIT_ABS_URL|$SEEKLIT_ABS_URL|g" "$file"
        fi
        if [ ! -z "$SEEKLIT_ABS_EXTERNAL_URL" ]; then
            sed -i "s|BAKED_SEEKLIT_ABS_EXTERNAL_URL|$SEEKLIT_ABS_EXTERNAL_URL|g" "$file"
        fi
        if [ ! -z "$SEEKLIT_ADMIN_EMAIL" ]; then
            sed -i "s|BAKED_SEEKLIT_ADMIN_EMAIL|$SEEKLIT_ADMIN_EMAIL|g" "$file"
        fi
    done
fi

# Function to handle shutdown
cleanup() {
    echo "Shutting down Remix server..."
    kill $REMIX_PID 2>/dev/null || true
    wait
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Remix server
echo "Starting Remix server..."
cd /app/client
exec su-exec seeklit sh -c 'HOME=/home/seeklit XDG_DATA_HOME=/home/seeklit/.local/share XDG_CONFIG_HOME=/home/seeklit/.config pnpm start'