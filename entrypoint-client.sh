#!/bin/bash
set -e

# Replace baked environment variables
BAKED_VARS=(
    "SEEKLIT_API_URL"
    "SEEKLIT_ABS_URL"
    "SEEKLIT_ADMIN_EMAIL"
)

# Directory containing the Remix build output
REMIX_BUILD_DIR="/app/client/build"

# Check if at least one variable is set
any_var_set=false
for VAR in "${BAKED_VARS[@]}"; do
    if [ ! -z "${!VAR}" ]; then
        any_var_set=true
        break
    fi
done

# Perform replacements if at least one variable is set
if [ "$any_var_set" = true ]; then
    echo "Replacing baked environment variables in Remix application"

    find "$REMIX_BUILD_DIR" -type f -name "*.js" |
    while read file; do
        for VAR in "${BAKED_VARS[@]}"; do
            if [ ! -z "${!VAR}" ]; then
                sed -i "s|BAKED_$VAR|${!VAR}|g" "$file"
            fi
        done
    done
else
    echo "No environment variables provided for replacement. Skipping variable replacement."
fi

# Start the client
echo "Starting Remix client..."
cd /app/client
pnpm start

# Wait for all background processes to finish
wait -n
